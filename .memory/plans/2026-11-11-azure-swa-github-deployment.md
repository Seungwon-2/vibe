# Plan: Azure Static Web Apps and GitHub Deployment

## Goal

Prepare Stella Runner for a dedicated Azure Static Web App deployment that automatically publishes pushes to `project02` in `Seungwon-2/vibe`. The release must use the existing single-tenant Entra design, keep personal run history private, expose only each player's best endless record publicly, and use only app-owned Cosmos DB objects inside the approved shared account. The plan includes preflight cost/permission review, deployment verification, and user-facing operations documents. This is a plan only: no Azure resource, Entra registration, GitHub secret, workflow, or deployment is created by planning.

## Confirmed Target

- Repository: `https://github.com/Seungwon-2/vibe.git`; branch: `project02`.
- App: React 19 + TypeScript + Vite 8 + Phaser; root `/`; `npm run build`; output `dist/`.
- API: Azure Functions v4 Node API from `api/`, hosted as the Static Web Apps managed API (no separate Function App).
- Azure: subscription `CR-Project-01`; resource group `grill-me-edu`; new Free SWA `stella-runner-project02` (availability to verify); managed API in East Asia.
- Data: existing Cosmos account `maze-rescue-ms-b7af62a9` in Korea Central; add only database `stella-runner` and container `PlayerRecords`, partition key `/playerId`; do not change existing account configuration or data.
- Identity: new dedicated single-tenant Entra app registration; company tenant including guest accounts; MSAL; private account panel shows name and username/email and supports logout; public ranking uses `name` or `Runner` and never exposes email or identifiers.
- Public leaderboard: one best endless record per player, distance descending then coins descending. Personal history is accessible only to its authenticated owner. Browser-local records are not migrated.
- Cosmos access: SWA managed API has no managed identity; use a server-only account connection string setting. User reports owner approval for the account-scoped key. Since it grants account-wide access, plan execution must preserve that boundary and stop if secure configuration or approval cannot be verified.
- Cost: Free SWA has no base charge, but Cosmos throughput/storage and API consumption can incur charges. The existing account is shared; determine its actual capacity and estimate this app's incremental use before provisioning.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Complete the remaining app-side account/history experience and managed API Cosmos configuration. | [P01](../phases/2026-11-11-azure-swa-github-deployment/P01-app-readiness/phase.md) |
| P02 | `in_progress` | Verify access, cost, and target isolation; create dedicated cloud configuration and GitHub Actions delivery. | [P02](../phases/2026-11-11-azure-swa-github-deployment/P02-cloud-delivery/phase.md) |
| P03 | `pending` | Verify deployed behavior and prepare employee usage and versioned release documentation. | [P03](../phases/2026-11-11-azure-swa-github-deployment/P03-release-handoff/phase.md) |

## Gates and Scope

- Do not create Azure resources, Entra registrations, GitHub secrets, or deploy until P01 is implemented and the user has reviewed the concrete P02 preflight/what-if results.
- Proceed only if refreshed GitHub access can write to the requested repository and branch. Prior observed GitHub permissions were read-only; this remains unverified.
- Verify tenant/app registration permissions, SWA name availability, managed API region/runtime support, Cosmos account capacity/usage, and incremental cost at execution time.
- Use an infrastructure preview before applying. The preview must show only the new SWA and the new app-owned Cosmos database/container; no existing apps, databases, containers, or shared account settings may be altered.
- The deployment workflow must run for `project02` pushes and must not expose the SWA token to untrusted pull-request code. Frontend `VITE_*` values are public identifiers only; no credentials go into frontend environment variables or bundles.
- Add the Cosmos connection string only as a protected server-side API application setting. Do not print it in CLI output, logs, shell history, source, Bicep parameters, GitHub artifacts, or chat.
- If Cosmos owner approval, secure secret configuration, GitHub write permission, expected cost, or target isolation is not verified, stop before the dependent cloud mutation.

## Previous Work Carried Forward

The previous plan `.memory/plans/2026-11-03-azure-deployment-readiness.md` already delivered the MSAL SPA auth foundation and protected Functions/Cosmos API routes (commits `f8a9230` and `2740953`). Its remaining UI/account/configuration work is represented in P01 here. No cloud resource has been provisioned. This new plan supersedes the old plan for future deployment work while preserving its history and files.
