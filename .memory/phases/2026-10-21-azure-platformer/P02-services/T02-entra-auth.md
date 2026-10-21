# Task: T02 Entra Authentication

## Status: pending

## Goal
Require a verified company-tenant access token for every game API and use MSAL to acquire the API scope for the signed-in player.

## Decision Summary
- SPA uses tenant-specific MSAL authorization code with PKCE. APIs validate access token signature, issuer, audience, tenant, object id, and delegated scope.
- Never accept an ID token as API bearer token. Display name comes from the API access token name optional claim.

## Implementation

### I01. React MSAL integration
- Related Files:
  - src/auth/authConfig.ts :: MSAL configuration; new
  - src/auth/AuthProvider.tsx :: provider component; new
  - src/auth/useApiAccessToken.ts :: getToken():Promise<string>; new
  - src/app/screens/LoginScreen.tsx :: sign in/error UI; new
  - src/auth/AuthProvider.test.tsx :: client auth cases; new
  - .env.example :: tenant/client/scope/API placeholders; modify
- Details
  - Use @azure/msal-browser and @azure/msal-react, pinned compatible stable versions. Authority: https://login.microsoftonline.com/{tenantId}; redirect URI current origin. Request openid, profile, and api://{API_CLIENT_ID}/access_as_user.
  - Use PublicClientApplication, MsalProvider, acquireTokenSilent, and redirect interaction only on InteractionRequiredAuthError. No client secret; all VITE values public identifiers.
  - Handle cancellation, consent required, expired session, and sign-out visibly. Game routes require authenticated account.

### I02. Azure Functions token validation
- Related Files:
  - api/src/auth/validateAccessToken.ts :: validateAccessToken(request:HttpRequest):Promise<AuthenticatedPlayer>; new
  - api/src/auth/types.ts :: AuthenticatedPlayer; new
  - api/src/auth/validateAccessToken.test.ts :: JWT rejection/acceptance matrix; new
  - api/src/index.ts :: apply authorization to every API; modify
- Details
  - AuthenticatedPlayer = { tenantId:string; userObjectId:string; displayName:string; scopes:string[] }.
  - Read ENTRA_TENANT_ID, ENTRA_API_AUDIENCE, ENTRA_REQUIRED_SCOPE from settings. Require Authorization Bearer token. Verify RS256 signature against tenant OpenID JWKS with jose remote-key cache; exact issuer https://login.microsoftonline.com/{tenantId}/v2.0; exact audience; tid exact tenant; nonempty oid; scp includes access_as_user.
  - Require name claim from API registration optional claim. Ignore any caller-provided user id/name. 401 for absent/invalid token; 403 for valid token with wrong tenant/scope; do not log JWT.

## Acceptance Criteria
- [ ] SPA obtains API access token after sign-in and handles interactive requirement.
- [ ] API rejects missing, expired, wrong issuer/audience/tenant/scope tokens.
- [ ] API user identity is derived only from verified claims.

## Validation
- npm test -- --run src/auth/AuthProvider.test.tsx — client auth states pass.
- cd api; npm test -- --run src/auth/validateAccessToken.test.ts — JWT matrix passes.
- npm run typecheck; npm run build; cd api; npm run typecheck; npm run build — pass.

## Commit Message
feat(auth): add tenant-scoped Entra access tokens

Plan: 2026-10-21-azure-platformer
Phase: P02-services
Task: T02-entra-auth

- integrate MSAL authorization code flow
- validate API bearer tokens and claims

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
