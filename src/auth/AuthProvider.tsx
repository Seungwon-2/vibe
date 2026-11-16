import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { InteractionRequiredAuthError, PublicClientApplication, type AccountInfo } from '@azure/msal-browser';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { entraMsalConfig, isEntraConfigured, loginRequest, readEntraSettings, runnerApiRequest } from './entraConfig';

export type RunnerAuthStatus = 'loading' | 'signed-out' | 'signed-in' | 'error';
export type RunnerAuthMode = 'local' | 'cloud' | 'configuration-error';
export type RunnerApiConsentStatus = 'unavailable' | 'checking' | 'consent-required' | 'available' | 'error';
export type RunnerAuthValue = Readonly<{
  mode: RunnerAuthMode;
  status: RunnerAuthStatus;
  account: AccountInfo | null;
  error: string | null;
  apiConsentStatus: RunnerApiConsentStatus;
  apiConsentError: string | null;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  requestApiConsent(): Promise<void>;
  acquireApiToken(): Promise<string>;
}>;

const localAuth: RunnerAuthValue = {
  mode: 'local', status: 'signed-in', account: null, error: null,
  apiConsentStatus: 'unavailable', apiConsentError: null,
  signIn: async () => undefined,
  signOut: async () => undefined,
  requestApiConsent: async () => undefined,
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
      try { await app.handleRedirectPromise(); }
      catch (error: unknown) {
        if (mounted) setInitializationError(error instanceof Error ? error.message : 'Entra redirect failed');
      }
      if (mounted) setInstance(app);
    }).catch((error: unknown) => {
      if (mounted) {
        setInitializationError(error instanceof Error ? error.message : 'Entra initialization failed');
        setInstance(app);
      }
    });
    return () => { mounted = false; };
  }, [configured]);

  if (!configured) {
    if (!configError) return <AuthContext.Provider value={localAuth}>{children}</AuthContext.Provider>;
    const value: RunnerAuthValue = { ...localAuth, mode: 'configuration-error', status: 'error',
      error: 'Entra 설정이 완전하지 않습니다. 테넌트 ID와 SPA 클라이언트 ID를 설정해야 합니다.' };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  if (!instance) {
    const value: RunnerAuthValue = { ...localAuth, mode: 'cloud', status: 'loading', error: null };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  return <MsalProvider instance={instance}><CloudContextBridge redirectError={initializationError}>{children}</CloudContextBridge></MsalProvider>;
}

function CloudContextBridge({ children, redirectError }: Readonly<{ children: React.ReactNode; redirectError: string | null }>): React.JSX.Element {
  const { instance, accounts, inProgress } = useMsal();
  const account = accounts[0] ?? null;
  const settings = readEntraSettings();
  const [apiConsentStatus, setApiConsentStatus] = useState<RunnerApiConsentStatus>(settings.apiScope ? 'checking' : 'unavailable');
  const [apiConsentError, setApiConsentError] = useState<string | null>(redirectError);
  useEffect(() => { if (account) instance.setActiveAccount(account); }, [account, instance]);
  useEffect(() => {
    let current = true;
    if (!account || !settings.apiScope) {
      queueMicrotask(() => {
        if (current) setApiConsentStatus(settings.apiScope ? 'checking' : 'unavailable');
      });
      return () => { current = false; };
    }
    void Promise.resolve().then(() => {
      if (current) setApiConsentStatus('checking');
      return instance.acquireTokenSilent({ ...runnerApiRequest, account });
    }).then(() => {
      if (current) { setApiConsentStatus('available'); setApiConsentError(null); }
    }).catch((error: unknown) => {
      if (!current) return;
      if (error instanceof InteractionRequiredAuthError) setApiConsentStatus('consent-required');
      else { setApiConsentStatus('error'); setApiConsentError(error instanceof Error ? error.message : 'API 권한을 확인하지 못했습니다.'); }
    });
    return () => { current = false; };
  }, [account, instance, settings.apiScope]);
  const value = useMemo<RunnerAuthValue>(() => ({
    mode: 'cloud', status: inProgress !== 'none' ? 'loading' : account ? 'signed-in' : 'signed-out',
    account, error: null, apiConsentStatus, apiConsentError: apiConsentError ?? redirectError,
    signIn: async () => { await instance.loginRedirect({ ...loginRequest }); },
    signOut: async () => { await instance.logoutRedirect({ account: account ?? undefined }); },
    requestApiConsent: async () => {
      if (!account) throw new Error('먼저 회사 계정으로 로그인해 주세요.');
      if (!settings.apiScope) throw new Error('API 권한 설정이 없습니다.');
      setApiConsentError(null);
      try {
        await instance.acquireTokenSilent({ ...runnerApiRequest, account });
        setApiConsentStatus('available');
      } catch (error) {
        if (!(error instanceof InteractionRequiredAuthError)) {
          setApiConsentStatus('error');
          setApiConsentError(error instanceof Error ? error.message : 'API 권한 확인에 실패했습니다.');
          return;
        }
        try {
          await instance.acquireTokenRedirect({ ...runnerApiRequest, account, prompt: 'consent' });
        } catch (redirectError: unknown) {
          setApiConsentStatus('error');
          setApiConsentError(redirectError instanceof Error ? redirectError.message : 'API 동의 요청을 시작하지 못했습니다. 로컬 기록을 계속 사용합니다.');
        }
      }
    },
    acquireApiToken: async () => {
      if (!account) throw new Error('Sign in to continue');
      if (!readEntraSettings().apiScope) throw new Error('Runner API scope is not configured');
      return (await instance.acquireTokenSilent({ ...runnerApiRequest, account })).accessToken;
    },
  }), [account, apiConsentError, apiConsentStatus, inProgress, instance, redirectError, settings.apiScope]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// This hook intentionally lives beside its private context to keep the provider implementation cohesive.
// eslint-disable-next-line react-refresh/only-export-components
export function useRunnerAuth(): RunnerAuthValue { return useContext(AuthContext); }
