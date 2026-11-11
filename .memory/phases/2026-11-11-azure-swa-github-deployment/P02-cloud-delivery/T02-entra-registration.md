# Task: T02 Dedicated Entra App Registration

## Status: in_progress

## Goal

Create and configure dedicated single-tenant Entra registrations for the Stella Runner SPA and API after P02-T01 verifies the tenant and permissions. Configure sign-in and API access without Microsoft Graph permissions.

## Decision Summary

- Company tenant users, including guest users in that tenant, may authenticate; no separate staff group restriction.
- SPA uses MSAL and requests an API access token. API validates tenant and audience.
- Account panel uses `name` and `username` claims already exposed to MSAL. Public ranking uses validated `name` or `Runner`; email stays private.

## Implementation

### I01. Register SPA and protected API

- Related Files:
  - `src/auth/entraConfig.ts` :: `readEntraSettings`, `runnerApiRequest`, `entraMsalConfig`; read-only unless redirect URI assumptions require a code change, which must be separately planned.
  - `api/src/shared/auth.ts` :: `requiredEnv`, audience/tenant/scope validation; read-only.
  - `.env.production.example` :: public build-time identifiers only; new/update if repo convention requires.
  - `api/local.settings.example.json` :: placeholder tenant/audience/scope names; modify only with non-secret placeholders if names need alignment.
  - `docs/azure-deployment-preflight.md` :: sanitized app IDs, scopes, and redirect configuration; update, never include secrets.

#### Details

- Create a dedicated SPA app registration and API app registration in the verified company tenant. Both use supported single-tenant account type.
- API registration exposes delegated scope `access_as_user` with URI `api://{API_CLIENT_ID}/access_as_user`. Authorize the SPA client to request this scope and grant only the required consent.
- SPA redirect URI is the verified SWA production origin plus MSAL redirect path (match `src/auth/entraConfig.ts`, expected root `/`); register localhost URI only if required for local testing. Add matching post-logout URI. Do not register wildcard production URLs.
- Use exact environment mapping:
  - Vite build-time public values: `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_CLIENT_ID` (SPA client ID), `VITE_ENTRA_API_SCOPE` (`api://{API_CLIENT_ID}/access_as_user`), and optionally `VITE_API_BASE_URL=/api`.
  - Managed API server-side values: `ENTRA_TENANT_ID`, `ENTRA_API_AUDIENCE` (`api://{API_CLIENT_ID}`), `ENTRA_API_SCOPE=access_as_user`.
- Do not add Graph delegated/application permissions or client secret for the SPA. Record tenant ID and client IDs as identifiers, but keep any confidential credential out of git and documents.
- If tenant/app registration permissions, app owner, issuer/audience semantics, or redirect origin cannot be verified, stop; do not weaken token validation.

## Acceptance Criteria

- [ ] Dedicated SPA and API registrations exist in the intended tenant and are single-tenant.
- [ ] API exposes exactly the delegated scope required by the app and SPA is authorized for it.
- [ ] Production and local redirect/logout URIs match the configured origins.
- [ ] No Graph permissions, wildcard redirect, client secret, or sensitive value is added to the client.
- [ ] Tenant, audience, and scope settings match API validation code.

## Validation

- `npm run test -- src/auth/entraConfig.test.ts` — frontend scope/environment expectations pass.
- `npm --prefix api test -- --run` — API auth validation tests pass.
- Manual Entra portal review: account type, exposed API scope, SPA permission, redirect/logout URIs, and absence of Graph permissions.
- Verify `git diff --check` and inspect config templates for public identifiers only.

## Commit Message

```text
docs(auth): record dedicated Entra SPA and API configuration

Plan: 2026-11-11-azure-swa-github-deployment
Phase: P02-cloud-delivery
Task: T02-entra-registration

- Align tenant, audience, scope, and redirect settings for Stella Runner
- Document safe public identifier configuration without Graph scopes
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
