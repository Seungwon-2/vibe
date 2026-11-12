# Task: T01 Deployed Smoke and Privacy Validation

## Status: in_progress

## Goal

Verify the deployed frontend, company OIDC sign-in experience, browser-local data behavior, and release privacy boundaries. Cloud API, Cosmos, and shared-user ranking are explicitly deferred.

## Decision Summary

- Production URL: `https://thankful-beach-01ab67d00.5.azurestaticapps.net/`.
- Entra sign-in is single-tenant OIDC only; no Graph permission or custom API scope is requested.
- Run history and rankings remain local to the browser. They are not shared between users/devices and will not be automatically migrated.
- The current task must not exercise or configure the Cosmos database or API.

## Implementation

### I01. Public deployment smoke check

- Related Files:
  - `.github/workflows/azure-static-web-apps-project02.yml` :: successful deployment run; read-only.
  - `docs/azure-deployment-preflight.md` :: sanitized deployment evidence and limitations; update.

#### Details

- Confirm latest deployment run is successful on `project02` and deployed to the real HTTPS hostname.
- Verify root document/title, loaded JS/CSS assets, and SPA fallback response. Do not capture tokens or private user data.
- In a browser, verify the sign-in redirect, company account display, logout, re-login, character selection, game start, pause/resume, and results.
- Check that personal history/ranking remain browser-local and no request is made to a cloud records API. Verify no deployment token, Cosmos secret, or API access token is present in the static bundle.
- Record sanitized evidence: URL, date, workflow URL/SHA, response checks, and any manual cases that still need user confirmation.

## Acceptance Criteria

- [x] Latest production Actions run succeeds on `project02` and the real app URL responds over HTTPS.
- [x] The root HTML and application assets are served by the deployed SWA.
- [ ] User confirms company Entra sign-in/account display/logout and an in-app play session in a browser.
- [x] Records remain browser-local; the current build does not call Cosmos/API endpoints.
- [x] No deployment token or Cosmos key is included in the frontend bundle.
- [x] Sanitized evidence and the remaining manual verification status are recorded.

## Validation

- Latest successful `project02` deployment is GitHub Actions run `43161348309`, commit `da9735c71cde9a67cb8f73da37141f1145b9bdfd` (2026-11-12 14:25 KST): https://github.com/Seungwon-2/vibe/actions/runs/43161348309
- Live HTTP checks on 2026-11-12: root `200 text/html`, title `스텔라 러너`, unknown SPA route `200 text/html`, and `/.auth/login/aad` returns `302` into the SWA AAD login flow. Unauthenticated `/.auth/me` contains no client principal.
- The latest deployed SHA is an ancestor of local `project02`, but local has seven newer commits. P0 changes in local HEAD are not deployed because the branch has not been pushed.
- Inspected deployed JavaScript and CSS (2 assets). No Cosmos connection string/key, deployment token, JWT literal, or API scope in login configuration was found. Current app wiring uses `LocalRunGateway`; deployed records remain browser-local.
- The computer-use browser host is unavailable in this session. An authorized company account was not used, and authenticated sign-in, account display, logout/re-login, gameplay, and authenticated network inspection remain pending user confirmation.
- No Cosmos database, API, deployment secrets, or user account data were accessed.
- The pre-existing dirty deployment preflight files were left untouched; verification evidence is recorded here so unrelated user edits are preserved.

## Progress

- [x] Latest successful deployment and current commit identified.
- [x] Production root, title, SPA fallback, and SWA AAD redirect checked.
- [x] Browser-local records and static-bundle secret/API-scope checks recorded.
- [ ] Manual company-account sign-in, logout/re-login, and in-game browser smoke check confirmed by user.
- [ ] Authenticated browser network inspection confirmed by user.
- commit: bc8dfe0
## Commit Message

```text
docs(deploy): verify live frontend and document smoke status

Plan: 2026-11-11-azure-swa-github-deployment
Phase: P03-release-handoff
Task: T01-cloud-smoke-and-privacy-validation

- Record deployed frontend checks and OIDC-only pilot scope
- Keep cloud API and Cosmos integration deferred
```

