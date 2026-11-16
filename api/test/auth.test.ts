import { afterEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { HttpRequest } from '@azure/functions';
import { principalFromClaims, requirePrincipal } from '../src/shared/auth.js';
import { ApiException } from '../src/shared/errors.js';

const originalTenant = process.env.ENTRA_TENANT_ID;
afterEach(() => {
  if (originalTenant === undefined) delete process.env.ENTRA_TENANT_ID;
  else process.env.ENTRA_TENANT_ID = originalTenant;
});

describe('Entra principal boundary', () => {
  it('validates the app token even when SWA injects its own Authorization header', async () => {
    process.env.ENTRA_TENANT_ID = 'tenant-guid';
    const verifier = vi.fn().mockResolvedValue({ tid: 'tenant-guid', oid: 'object-guid', scp: 'access_as_user' });
    const request = new HttpRequest({ url: 'https://runner.example/api/runs', method: 'GET', headers: {
      Authorization: 'Bearer platform-internal-token', 'X-Runner-Authorization': 'Bearer app-access-token',
    } });
    await expect(requirePrincipal(request, verifier)).resolves.toMatchObject({ playerId: 'tenant-guid:object-guid' });
    expect(verifier).toHaveBeenCalledWith('app-access-token');
  });
  it('does not treat the platform Authorization header as a user credential', async () => {
    const verifier = vi.fn();
    const request = new HttpRequest({ url: 'https://runner.example/api/runs', method: 'GET',
      headers: { Authorization: 'Bearer platform-internal-token' } });
    await expect(requirePrincipal(request, verifier)).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
    expect(verifier).not.toHaveBeenCalled();
  });
  it('rejects an invalid app token without falling back to the platform token', async () => {
    const verifier = vi.fn().mockRejectedValue(new Error('signature verification failed'));
    const request = new HttpRequest({ url: 'https://runner.example/api/runs', method: 'GET', headers: {
      Authorization: 'Bearer platform-internal-token', 'X-Runner-Authorization': 'Bearer invalid-app-token',
    } });
    await expect(requirePrincipal(request, verifier)).rejects.toMatchObject({ status: 401, code: 'INVALID_TOKEN' });
    expect(verifier).toHaveBeenCalledOnce();
    expect(verifier).toHaveBeenCalledWith('invalid-app-token');
  });
  it('derives owner key and public name only from validated tenant claims', () => {
    process.env.ENTRA_TENANT_ID = 'tenant-guid';
    expect(principalFromClaims({ tid: 'tenant-guid', oid: 'object-guid', scp: 'openid access_as_user', name: '  Alice  ' }))
      .toEqual({ playerId: 'tenant-guid:object-guid', displayName: 'Alice' });
  });
  it('uses Runner when the verified token has no name', () => {
    process.env.ENTRA_TENANT_ID = 'tenant-guid';
    expect(principalFromClaims({ tid: 'tenant-guid', oid: 'object-guid', scp: 'access_as_user' }).displayName).toBe('Runner');
  });
  it.each([
    { tid: 'other-tenant', oid: 'object-guid', scp: 'access_as_user' },
    { tid: 'tenant-guid', oid: '', scp: 'access_as_user' },
    { tid: 'tenant-guid', oid: 'object-guid', scp: 'openid' },
  ])('rejects missing or out-of-policy identity claims', (claims) => {
    process.env.ENTRA_TENANT_ID = 'tenant-guid';
    expect(() => principalFromClaims(claims)).toThrowError(ApiException);
  });
  it('rejects absent tenant configuration', () => {
    delete process.env.ENTRA_TENANT_ID;
    expect(() => principalFromClaims({ tid: 'tenant-guid', oid: 'object-guid', scp: 'access_as_user' }))
      .toThrowError(ApiException);
  });
});
