# Task: T02 Signed-in Account Area

## Status: done

## Goal

Show the signed-in employee's Entra display name and username/email in a private account area on the main menu and provide a clear logout action. Use claims already returned by MSAL; do not request Microsoft Graph permission.

## Decision Summary

- Single-tenant company accounts, including tenant guest accounts, are accepted by the dedicated Entra registration.
- Account identity details are private to the signed-in user's UI; no email is sent to or rendered in public rankings.
- No Graph scope is needed solely to display `AccountInfo.name` and `AccountInfo.username`.

## Implementation

### I01. Pass account identity into the menu

- Related Files:
  - `src/auth/AuthProvider.tsx` :: `RunnerAuthValue.account`, `CloudContextBridge`; read-only unless account fallback is missing.
  - `src/App.tsx` :: `useRunnerAuth` consumer and `<MainMenu>` props; pass account values.
  - `src/app/screens/MainMenu.tsx` :: `MainMenuProps`, account panel, sign-out callback; modify.
  - `src/app/screens/MainMenu.test.tsx` :: signed-in/signed-out account UI coverage; modify.
  - `src/styles/global.css` :: account panel responsive styles; modify.

#### Details

- **Signatures & Types**:
  - Add `accountUsername?: string | null` to `MainMenuProps`. Keep `accountName?: string | null` and `onSignOut?(): void`.
  - At the App boundary, map `auth.account?.name ?? null` to `accountName` and `auth.account?.username ?? null` to `accountUsername`.
  - Do not copy access tokens or `homeAccountId`, `localAccountId`, `tenantId`, or `environment` into presentation props.

- **Execution Flow / Logic**:
  1. In cloud mode and `authStatus === 'signed-in'`, render a compact account panel in the existing main-menu action/footer area. Show display name and username/email on separate lines with truncation/wrapping appropriate to narrow screens.
  2. Use a fallback display name `Runner` when the claim is absent and a neutral “계정 정보 없음” for missing username; never infer an email from unrelated data.
  3. Show an explicit `로그아웃` button bound to `onSignOut`; preserve the current MSAL `logoutRedirect({ account })` behavior.
  4. In signed-out/loading/error states, preserve sign-in prompts and disabled gameplay behavior already wired through `authStatus` / `authMode`.
  5. In local mode, do not fabricate an account panel. Do not change ranking display name source or API token claim validation.

### I02. Focused account UI tests

- Related Files:
  - `src/app/screens/MainMenu.test.tsx` :: `MainMenu`; modify.

#### Details

- Test name + username rendering, fallback when either field is missing, explicit logout callback, sign-in state, and no account block in local mode.
- Include a long username case to verify no horizontal overflow or button displacement at narrow widths.
- Assert there is no call path to Graph or new Graph scope in auth configuration.

## Acceptance Criteria

- [x] Signed-in cloud menu shows Entra name and username/email and an explicit logout action.
- [x] Missing name falls back to `Runner`; missing username is shown as unavailable without blocking the app.
- [x] Sign out invokes the MSAL-backed callback.
- [x] No Graph scope, email leaderboard field, or token identifier is introduced.

## Validation

- `npm run test -- src/app/screens/MainMenu.test.tsx src/auth/entraConfig.test.ts` — focused tests pass.
- `npm run typecheck` — no TypeScript errors.
- `npm run lint` — no lint errors.
- `npm run build` — production client build succeeds.

## Commit Message

```text
feat(auth-ui): show private account details and logout

Plan: 2026-11-11-azure-swa-github-deployment
Phase: P01-app-readiness
Task: T02-account-area

- Display the MSAL account name and username in the main menu
- Add a visible logout action without Graph permissions
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending
