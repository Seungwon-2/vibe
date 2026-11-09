import type { HttpRequest } from '@azure/functions';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { PlayerPrincipal } from './contracts.js';
import { ApiException } from './errors.js';

type TokenVerifier = (token: string) => Promise<JWTPayload>;
let cachedJwks: { tenantId: string; keys: ReturnType<typeof createRemoteJWKSet> } | undefined;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiException(503, 'AUTH_NOT_CONFIGURED', 'AUTH_NOT_CONFIGURED');
  return value;
}

async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const tenantId = requiredEnv('ENTRA_TENANT_ID');
  const audience = requiredEnv('ENTRA_API_AUDIENCE');
  const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
  if (!cachedJwks || cachedJwks.tenantId !== tenantId) {
    const url = new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);
    cachedJwks = { tenantId, keys: createRemoteJWKSet(url) };
  }
  const { payload } = await jwtVerify(token, cachedJwks.keys, { issuer, audience, algorithms: ['RS256'] });
  return payload;
}

export function principalFromClaims(payload: JWTPayload): PlayerPrincipal {
  const tenantId = requiredEnv('ENTRA_TENANT_ID');
  const configuredScope = process.env.ENTRA_API_SCOPE?.trim() || 'access_as_user';
  const scopes = typeof payload.scp === 'string' ? payload.scp.split(/\s+/) : [];
  if (payload.tid !== tenantId || typeof payload.oid !== 'string' || !payload.oid || !scopes.includes(configuredScope)) {
    throw new ApiException(403, 'INSUFFICIENT_CLAIMS', 'INSUFFICIENT_CLAIMS');
  }
  const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, 80) : '';
  return { playerId: `${tenantId}:${payload.oid}`, displayName: name || 'Runner' };
}

export async function requirePrincipal(request: HttpRequest, verifier: TokenVerifier = verifyAccessToken): Promise<PlayerPrincipal> {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) throw new ApiException(401, 'UNAUTHENTICATED', 'UNAUTHENTICATED');
  try {
    return principalFromClaims(await verifier(match[1]!));
  } catch (error) {
    if (error instanceof ApiException) throw error;
    throw new ApiException(401, 'INVALID_TOKEN', 'INVALID_TOKEN');
  }
}
