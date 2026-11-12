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

- Latest successful `project02` deployment is GitHub Actions run `43188676923`, commit `ddf0c22e5a5157405bf6f4bb8d81fe098bcecfb9` (2026-11-12 18:07 KST): https://github.com/Seungwon-2/vibe/actions/runs/43188676923
- Live HTTP checks after deployment on 2026-11-12: root `200 text/html`, title `스텔라 러너`, unknown SPA route `200 text/html`. The user confirmed the deployed resume prompt now has the requested dismissal option.
- The deployed SHA matches local `project02`; P0 fixes are now included in the published frontend.
- Inspected deployed JavaScript and CSS (2 assets). No Cosmos connection string/key, deployment token, JWT literal, or API scope in login configuration was found. Current app wiring uses `LocalRunGateway`; deployed records remain browser-local.
- The computer-use browser host is unavailable in this session. The user confirmed the deployed resume-prompt behavior; explicit confirmation of account display, logout/re-login, full in-game pause/resume/result flow, and authenticated network inspection remains pending.
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

