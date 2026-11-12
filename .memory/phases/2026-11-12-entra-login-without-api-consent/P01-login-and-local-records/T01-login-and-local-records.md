# Task: T01 Entra Login Without API Consent

## Status: done

## Goal

Make company Entra sign-in work with only tenant ID and SPA client ID, without asking for the runner API delegated permission. Keep the current login-required cloud entry flow, account display, and logout. Ensure all run records, personal bests, and rankings continue to use the browser-local gateway until API consent is approved.

## Decision Summary

- Sign-in is single-company-tenant OIDC only; do not request `access_as_user`, Microsoft Graph, or other API permissions at login.
- `VITE_ENTRA_API_SCOPE` and `VITE_API_BASE_URL` remain available for a later API phase, but API token acquisition and protected API calls are not used in this task.
- Cloud authentication state and record storage source are separate concepts: account UI depends on Entra status, while run records and leaderboard labels must say they are local to this browser.
- Existing browser-local records stay in the existing `running-action:records:v1` storage key; no migration or deletion.

## Implementation

### I01. Separate OIDC sign-in configuration from the optional runner API scope

- Related Files:
  - `src/auth/entraConfig.ts` :: `EntraSettings`, `readEntraSettings`, `isEntraConfigured`, `runnerApiRequest`; modify
  - `src/auth/AuthProvider.tsx` :: `AuthProvider`, `CloudContextBridge`, `signIn`, `acquireApiToken`; modify
  - `src/auth/entraConfig.test.ts` :: `Entra SPA configuration`; modify

#### Details

- **Types and configuration**:
  - Keep `EntraSettings` fields `tenantId: string`, `clientId: string`, `apiScope: string`, and `apiBaseUrl: string`.
  - Change `isEntraConfigured(settings)` to return true when and only when `tenantId` and `clientId` are non-empty. `apiScope` is optional for authentication.
  - Export a dedicated OIDC `loginRequest: RedirectRequest` whose `scopes` contains only `openid` and `profile`. Do not include `apiScope`, `User.Read`, or another resource scope.
  - Preserve `runnerApiRequest` using the configured `apiScope` for future protected API access. If the scope is empty, its scope list is empty; `acquireApiToken()` must fail with a clear configuration error before calling MSAL rather than requesting an empty or unintended scope.
- **Execution flow**:
  1. `AuthProvider` initializes MSAL when tenant ID and client ID exist even when `VITE_ENTRA_API_SCOPE` is unset.
  2. `CloudContextBridge.signIn()` calls `instance.loginRedirect(loginRequest)`.
  3. `acquireApiToken()` remains isolated for future API work and requires both a signed-in account and a non-empty API scope before token acquisition.
  4. Do not change tenant authority, redirect URI, post-logout redirect URI, cache location, sign-out behavior, or API token validation in `api/src/shared/auth.ts`.
- **Error handling**:
  - When tenant/client values are missing in production or a partial cloud configuration is present, show a configuration error describing the required tenant ID and SPA client ID; do not say API scope is required for login.
  - A local build without Entra settings continues using local mode.
- **Test cases** in `src/auth/entraConfig.test.ts`:
  - Tenant and client ID with no API scope enable Entra configuration.
  - `loginRequest.scopes` equals `['openid', 'profile']` and excludes API/Graph scopes.
  - API scope remains in `runnerApiRequest` when configured.
  - Missing tenant or client ID disables cloud configuration.
  - Keep configured authority and API base URL assertions.

### I02. Keep run data local and accurately label its source while preserving account UI

- Related Files:
  - `src/App.tsx` :: `runGateway`, `MainMenu` props, `RankingScreen` props, run submission and record loading; modify
  - `src/app/screens/MainMenu.tsx` :: `MainMenuProps`, `MainMenu`; modify
  - `src/app/screens/RankingScreen.tsx` :: `RankingScreenProps`, `RankingScreen`; modify
  - `src/app/screens/PersonalHistoryScreen.tsx` :: page source/description text; modify only if its copy implies server/account-backed history
  - `src/App.test.tsx` :: `App flow`; modify

#### Details

- **Data model and contracts**:
  - Do not change `RunGateway`, `PersonalBestRecord`, `PersonalRunHistoryRecord`, `PublicLeaderboardRecord`, local storage schema, or session resume account scoping.
  - Add `recordSource?: 'cloud' | 'local'` to `MainMenuProps` if needed to separate record labels from `authMode`; pass `'local'` from `App` for this plan.
  - `RankingScreen.source` must be `'local'` for the app flow in both local and cloud-auth modes.
- **Execution flow**:
  1. In `App`, set `runGateway` to `browserRunGateway` regardless of `auth.mode`; remove the `AuthenticatedRunGateway` construction/import from this app flow without deleting the service implementation needed for a future API plan.
  2. Preserve `canUseRecords` gating: local mode can view records; cloud mode requires signed-in status. The records themselves are local once access is granted.
  3. Keep Entra login required before entering the game in cloud mode. Keep account name/username display and sign-out unchanged.
  4. Ensure `getBest`, `getRanking`, `getPersonalHistory`, and `submitRun` all use `browserRunGateway`; do not call `auth.acquireApiToken()` from the app flow.
  5. Pass local record source to `MainMenu` and `RankingScreen` so the title/menu does not claim to show a community or server leaderboard when it is browser-local. Preserve clear account identity display separately.
  6. Update personal-history copy only where necessary to say the list is stored in this browser; do not imply it is server-synced or account-portable.
- **App test cases** in `src/App.test.tsx`:
  - Stub cloud auth with signed-in account and verify the app still selects the browser-local gateway and presents local record labels.
  - Verify sign-in is still required before starting when cloud auth is signed out.
  - Verify account name/username and sign-out remain available after sign-in.
  - Verify a finished run is saved through the local gateway and no API token acquisition is attempted.
  - Preserve existing local-mode ranking, run-submission, and resume-flow tests.

## Acceptance Criteria

- [x] Entra sign-in is configured with tenant ID and SPA client ID even when the custom API scope is absent.
- [x] The interactive login request contains only OIDC scopes; no API or Graph scope is requested.
- [x] The configured API scope remains optional and isolated from sign-in; no protected API request is made by the app.
- [x] Entra company sign-in remains required in cloud mode, and account display and logout continue working.
- [x] Best runs, run history, run submissions, and rankings use existing browser-local storage in both local and cloud-auth modes.
- [x] UI explicitly presents those records as browser-local, not as a community leaderboard or cloud-synced account data.
- [x] Existing session checkpoint account separation and local record contents are unchanged.

## Validation

- `npm test -- --run src/auth/entraConfig.test.ts src/App.test.tsx` — passed (2 files, 12 tests).
- `npm run typecheck` — blocked by existing runner-session resume typing errors in `src/App.tsx`, `ResumeSessionDialog`, `RunnerScene`, and their tests; these are outside this login task and were not changed here.
- `npm run lint` — passed.
- `npm run build` — skipped because typecheck did not pass.

## Commit Message

```text
feat(auth): allow OIDC login without API consent

Plan: 2026-11-12-entra-login-without-api-consent
Phase: P01-login-and-local-records
Task: T01-login-and-local-records

- Make the runner API scope optional for sign-in
- Keep cloud-authenticated run records in browser storage
- Label local rankings separately from Entra account identity
```

## Progress
- [x] Implementation complete
- [x] Focused tests and lint passed; full typecheck has unrelated resume-session failures noted above.
- Commit: `feat(auth): allow OIDC login without API consent`
