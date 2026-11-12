# Task: T04 GitHub Actions Deployment from project02

## Status: in_progress

## Goal

Connect `Seungwon-2/vibe` to the dedicated SWA so pushes to `project02` build and deploy the Vite frontend. Entra OIDC sign-in is enabled; records remain browser-local. Do not deploy or call `api/` until tenant consent and Cosmos credential policy are separately approved.

## Decision Summary

- Build command `npm run build`; upload the prebuilt `dist/` output with `skip_app_build: true`. Do not set `api_location`.
- Only `project02` push should trigger production deployment.
- Repository `ADMIN` permission and `workflow` scope are verified.
- Public Entra tenant/client IDs are GitHub Actions variables. SWA deployment token is a GitHub Actions secret. No Cosmos key is configured or copied to GitHub.

## Implementation

### I01. Workflow and secret configuration

- Related Files:
  - `.github/workflows/azure-static-web-apps-project02.yml` :: workflow; new.
  - `package.json` :: `build` script; read-only.
  - `public/staticwebapp.config.json` :: SPA navigation fallback copied by Vite into `dist/`; no platform access-control rules that conflict with MSAL.
  - `docs/azure-deployment-preflight.md` :: workflow run URL/status and secret names only; update.

#### Details

- **Workflow**: trigger `push` on `project02`; include `workflow_dispatch` only if useful for maintainer recovery. Pull requests may run build/lint/test checks, but must not receive `AZURE_STATIC_WEB_APPS_API_TOKEN` or any cloud secret.
- Use `actions/checkout` and a Node version supported by the project/runtime; install with lockfile (`npm ci`), build root app, and deploy with official `Azure/static-web-apps-deploy` action pinned to a reviewed major/version. Configure `app_location: /`, `api_location: api`, `output_location: dist`, and `skip_app_build: false` unless the action's current supported pattern requires an explicit `npm run build` pre-step.
- Configure client validation before deploy: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test -- --run`, and `npm run build`. The build receives only public `VITE_ENTRA_TENANT_ID` and `VITE_ENTRA_CLIENT_ID`; do not set the API scope or API URL.
- Add GitHub repository/environment secret `AZURE_STATIC_WEB_APPS_API_TOKEN` using the SWA's deployment token. Never include token in workflow YAML or output. Do not copy `COSMOS_CONNECTION_STRING` to GitHub because it belongs only to the server-side SWA app setting.
- Workflow triggers only on `project02` pushes and manual maintainer dispatch. No pull-request event gets a deploy token.
- No API app settings are configured; the frontend must use `browserRunGateway` for records in both signed-in and guest flows.

### I02. Automated deployment verification

- Related Files:
  - `.github/workflows/azure-static-web-apps-project02.yml` :: workflow; modify only if observed run failure requires correction.
  - `docs/azure-deployment-preflight.md` :: successful run evidence; update.

#### Details

- Push/merge the approved change to `project02` only after branch and permission confirmation. Inspect run result, commit SHA, branch, build summary, and deploy URL; do not dump environment or secrets.
- Check that workflow did not run privileged deployment for an untrusted PR. Verify public repo PR logs contain no secret values.

## Acceptance Criteria

- [ ] Workflow targets `project02` and uploads only the frontend build.
- [ ] Client checks pass before deploy.
- [ ] Deployment token is a GitHub secret and never appears in repository or logs.
- [x] Cosmos API and records remain deferred; no Cosmos connection string is configured for this release.
- [ ] Untrusted pull requests cannot access deployment credentials.
- [ ] Successful Actions run and live Static Web App are verified.

## Validation

- `npm ci` — dependency installation succeeds from lockfile.
- `npm run lint` — client lint passes.
- `npm run typecheck` — client types pass.
- `npm test -- --run` — client tests pass.
- Inspect the generated `dist/` bundle to confirm no API scope, credential, or server-only value is included.
- GitHub Actions run for branch `project02` — all validation and deploy jobs succeed.
- Review workflow trigger/security configuration and confirm PR event cannot access deploy secret.

## Commit Message

```text
ci(deploy): deploy project02 to Stella Runner Static Web App

Plan: 2026-11-11-azure-swa-github-deployment
Phase: P02-cloud-delivery
Task: T04-github-actions

- Add branch-scoped static frontend deployment workflow
- Keep deployment token protected and exclude PR secret access
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
