# Plan: Entra Login Without API Consent

## Goal

Allow a user in the configured company Entra tenant to sign in and view their account identity without requesting the runner API permission. Keep run history, personal bests, and rankings in this browser until API consent and the cloud data path are separately approved. A missing API scope must not prevent sign-in.

## Decisions

- Follow [login permissions decision](../decisions/2026-11-12-login-permissions-with-contributor.md).
- The single-company tenant and the SPA client ID are sufficient configuration for sign-in. The custom `access_as_user` scope remains optional and is not requested by login.
- Do not acquire API tokens or call the Cosmos-backed API in this implementation.
- Continue requiring company sign-in when Entra is configured; preserve account identity display and sign-out.
- Use the existing browser-local `RunGateway` for every signed-in run as well as local mode. Records remain browser-local and are not automatically migrated later.
- Clearly label rankings and history as browser-local even while the account is signed in.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Make Entra OIDC sign-in independent from API consent and keep records local | [P01](../phases/2026-11-12-entra-login-without-api-consent/P01-login-and-local-records/phase.md) |
