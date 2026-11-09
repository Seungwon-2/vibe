import { afterEach, describe, expect, it } from 'vitest';
import { principalFromClaims } from '../src/shared/auth.js';
import { ApiException } from '../src/shared/errors.js';

const originalTenant = process.env.ENTRA_TENANT_ID;
afterEach(() => {
  if (originalTenant === undefined) delete process.env.ENTRA_TENANT_ID;
  else process.env.ENTRA_TENANT_ID = originalTenant;
});

describe('Entra principal boundary', () => {
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
