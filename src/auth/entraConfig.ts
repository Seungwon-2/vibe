import type { Configuration, RedirectRequest, SilentRequest } from '@azure/msal-browser';

export type EntraSettings = Readonly<{
  tenantId: string;
  clientId: string;
  apiScope: string;
  apiBaseUrl: string;
}>;

export function readEntraSettings(): EntraSettings {
  return {
    tenantId: import.meta.env.VITE_ENTRA_TENANT_ID?.trim() ?? '',
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID?.trim() ?? '',
    apiScope: import.meta.env.VITE_ENTRA_API_SCOPE?.trim() ?? '',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || '/api',
  };
}

export function isEntraConfigured(settings = readEntraSettings()): boolean {
  return Boolean(settings.tenantId && settings.clientId && settings.apiScope);
}

export const entraMsalConfig: Configuration = (() => {
  const settings = readEntraSettings();
  return {
    auth: {
      clientId: settings.clientId || 'local-development-not-configured',
      authority: `https://login.microsoftonline.com/${settings.tenantId || 'invalid-tenant-not-configured'}`,
      redirectUri: typeof window === 'undefined' ? '/' : window.location.origin,
      postLogoutRedirectUri: typeof window === 'undefined' ? '/' : window.location.origin,
      navigateToLoginRequestUrl: true,
    },
    cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
  };
})();

export const runnerApiRequest: RedirectRequest & SilentRequest = {
  scopes: [readEntraSettings().apiScope].filter(Boolean),
};
