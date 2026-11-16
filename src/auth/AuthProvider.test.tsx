import type { ReactNode } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InteractionRequiredAuthError } from '@azure/msal-browser';

const auth = vi.hoisted(() => ({
  account: { homeAccountId: 'test-company-account', name: 'Runner' },
  instance: {
    initialize: vi.fn(), handleRedirectPromise: vi.fn(), setActiveAccount: vi.fn(),
    acquireTokenSilent: vi.fn(), acquireTokenRedirect: vi.fn(), loginRedirect: vi.fn(), logoutRedirect: vi.fn(),
  },
}));
vi.mock('@azure/msal-browser', async (importOriginal) => {
  const original = await importOriginal<typeof import('@azure/msal-browser')>();
  return { ...original, PublicClientApplication: vi.fn(function () { return auth.instance; }) };
});
vi.mock('@azure/msal-react', () => ({
  MsalProvider: ({ children }: { children: ReactNode }) => children,
  useMsal: () => ({ instance: auth.instance, accounts: [auth.account], inProgress: 'none' }),
}));
vi.mock('./entraConfig', () => ({
  entraMsalConfig: {}, isEntraConfigured: () => true,
  readEntraSettings: () => ({ tenantId: 'tenant', clientId: 'client', apiScope: 'api://runner/access_as_user' }),
  loginRequest: { scopes: ['openid', 'profile', 'api://runner/access_as_user'] },
  runnerApiRequest: { scopes: ['api://runner/access_as_user'] },
}));
import { AuthProvider, useRunnerAuth } from './AuthProvider';
function Status() { const auth = useRunnerAuth(); return <p>{auth.apiConsentStatus}</p>; }
const attemptKey = 'runner:api-connect:test-company-account:api://runner/access_as_user';

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  auth.instance.initialize.mockResolvedValue(undefined);
  auth.instance.handleRedirectPromise.mockResolvedValue(null);
  auth.instance.acquireTokenRedirect.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('automatic cloud record connection', () => {
  it('connects silently for an already-consented sign-in', async () => {
    auth.instance.acquireTokenSilent.mockResolvedValue({ accessToken: 'test-token' });
    render(<AuthProvider><Status /></AuthProvider>);
    expect(await screen.findByText('available')).toBeInTheDocument();
    expect(auth.instance.acquireTokenRedirect).not.toHaveBeenCalled();
  });
  it('automatically starts API consent for an existing login without another button click', async () => {
    auth.instance.acquireTokenSilent.mockRejectedValue(new InteractionRequiredAuthError('consent_required', 'User consent is required'));
    render(<AuthProvider><Status /></AuthProvider>);
    await waitFor(() => expect(auth.instance.acquireTokenRedirect).toHaveBeenCalledExactlyOnceWith({
      account: auth.account, scopes: ['api://runner/access_as_user'],
    }));
    expect(sessionStorage.getItem(attemptKey)).toBe('1');
  });
  it('does not redirect in a loop after an unsuccessful consent return', async () => {
    sessionStorage.setItem(attemptKey, '1');
    auth.instance.acquireTokenSilent.mockRejectedValue(new InteractionRequiredAuthError('consent_required', 'User consent is required'));
    render(<AuthProvider><Status /></AuthProvider>);
    expect(await screen.findByText('consent-required')).toBeInTheDocument();
    expect(auth.instance.acquireTokenRedirect).not.toHaveBeenCalled();
  });
});
