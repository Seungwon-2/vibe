import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Entra SPA configuration', () => {
  it('keeps OIDC login scopes separate from the optional delegated runner API scope', async () => {
    vi.stubEnv('VITE_ENTRA_TENANT_ID', 'tenant-123');
    vi.stubEnv('VITE_ENTRA_CLIENT_ID', 'spa-client-456');
    vi.stubEnv('VITE_ENTRA_API_SCOPE', 'api://runner-api/access_as_user');
    vi.stubEnv('VITE_API_BASE_URL', 'https://runner.example.test/api');
    const config = await import('./entraConfig');

    expect(config.isEntraConfigured()).toBe(true);
    expect(config.loginRequest.scopes).toEqual(['openid', 'profile']);
    expect(config.loginRequest.scopes).not.toContain('api://runner-api/access_as_user');
    expect(config.loginRequest.scopes).not.toContain('User.Read');
    expect(config.entraMsalConfig.auth).toMatchObject({
      clientId: 'spa-client-456',
      authority: 'https://login.microsoftonline.com/tenant-123',
    });
    expect(config.runnerApiRequest.scopes).toEqual(['api://runner-api/access_as_user']);
    expect(config.runnerApiRequest.scopes).not.toContain('User.Read');
    expect(config.readEntraSettings().apiBaseUrl).toBe('https://runner.example.test/api');
  });

  it('allows Entra login when the API scope is not configured', async () => {
    vi.stubEnv('VITE_ENTRA_TENANT_ID', 'tenant-123');
    vi.stubEnv('VITE_ENTRA_CLIENT_ID', 'spa-client-456');
    vi.stubEnv('VITE_ENTRA_API_SCOPE', '');
    const config = await import('./entraConfig');

    expect(config.isEntraConfigured()).toBe(true);
    expect(config.loginRequest.scopes).toEqual(['openid', 'profile']);
    expect(config.runnerApiRequest.scopes).toEqual([]);
  });

  it('does not treat a partially configured tenant as a usable cloud configuration', async () => {
    vi.stubEnv('VITE_ENTRA_TENANT_ID', 'tenant-123');
    vi.stubEnv('VITE_ENTRA_CLIENT_ID', '');
    vi.stubEnv('VITE_ENTRA_API_SCOPE', '');
    const config = await import('./entraConfig');

    expect(config.isEntraConfigured()).toBe(false);
    expect(config.readEntraSettings().apiBaseUrl).toBe('/api');
  });
});
