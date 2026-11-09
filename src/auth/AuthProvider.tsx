import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { InteractionRequiredAuthError, PublicClientApplication, type AccountInfo } from '@azure/msal-browser';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { entraMsalConfig, isEntraConfigured, readEntraSettings, runnerApiRequest } from './entraConfig';

export type RunnerAuthStatus = 'loading' | 'signed-out' | 'signed-in' | 'error';
export type RunnerAuthMode = 'local' | 'cloud' | 'configuration-error';
export type RunnerAuthValue = Readonly<{
  mode: RunnerAuthMode;
  status: RunnerAuthStatus;
  account: AccountInfo | null;
  error: string | null;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  acquireApiToken(): Promise<string>;
}>;

const localAuth: RunnerAuthValue = {
  mode: 'local', status: 'signed-in', account: null, error: null,
  signIn: async () => undefined,
  signOut: async () => undefined,
  acquireApiToken: async () => { throw new Error('Entra sign-in is not configured for local mode'); },
};
const AuthContext = createContext<RunnerAuthValue>(localAuth);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const settings = readEntraSettings();
  const configured = isEntraConfigured(settings);
  const anySetting = Boolean(settings.tenantId || settings.clientId || settings.apiScope);
  const configError = !configured && (anySetting || import.meta.env.PROD);
  const [instance, setInstance] = useState<PublicClientApplication | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    let mounted = true;
    const app = new PublicClientApplication(entraMsalConfig);
    void app.initialize().then(async () => {
      await app.handleRedirectPromise();
      if (mounted) setInstance(app);
    }).catch((error: unknown) => {
      if (mounted) setInitializationError(error instanceof Error ? error.message : 'Entra initialization failed');
    });
    return () => { mounted = false; };
  }, [configured]);

  if (!configured) {
    if (!configError) return <AuthContext.Provider value={localAuth}>{children}</AuthContext.Provider>;
    const value: RunnerAuthValue = { ...localAuth, mode: 'configuration-error', status: 'error',
      error: 'Entra 설정이 완전하지 않습니다. 테넌트, SPA 클라이언트, API scope를 모두 설정해야 합니다.' };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  if (initializationError) {
    const value: RunnerAuthValue = { ...localAuth, mode: 'cloud', status: 'error', error: initializationError };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  if (!instance) {
    const value: RunnerAuthValue = { ...localAuth, mode: 'cloud', status: 'loading', error: null };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  return <MsalProvider instance={instance}><CloudContextBridge>{children}</CloudContextBridge></MsalProvider>;
}

function CloudContextBridge({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const { instance, accounts, inProgress } = useMsal();
  const account = accounts[0] ?? null;
  useEffect(() => { if (account) instance.setActiveAccount(account); }, [account, instance]);
  const value = useMemo<RunnerAuthValue>(() => ({
    mode: 'cloud', status: inProgress !== 'none' ? 'loading' : account ? 'signed-in' : 'signed-out',
    account, error: null,
    signIn: async () => { await instance.loginRedirect({ ...runnerApiRequest }); },
    signOut: async () => { await instance.logoutRedirect({ account: account ?? undefined }); },
    acquireApiToken: async () => {
      if (!account) throw new Error('Sign in to continue');
      try { return (await instance.acquireTokenSilent({ ...runnerApiRequest, account })).accessToken; }
      catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          await instance.acquireTokenRedirect({ ...runnerApiRequest, account });
          throw new Error('Redirecting to sign in', { cause: error });
        }
        throw error;
      }
    },
  }), [account, inProgress, instance]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// This hook intentionally lives beside its private context to keep the provider implementation cohesive.
// eslint-disable-next-line react-refresh/only-export-components
export function useRunnerAuth(): RunnerAuthValue { return useContext(AuthContext); }
