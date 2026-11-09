# Plan: Azure Deployment Readiness

## Goal
Design and implement a secure Azure release path for the React/Vite runner: single-tenant Entra sign-in, protected Functions API, Cosmos DB-backed profiles, owner-only run history, a public leaderboard with one best endless run per account, and repeatable deployment from `project02`. Preserve local play and local records. Do not provision or publish production resources until the user reviews the plan and organization prerequisites are confirmed.

## Plan Update — 2026-11-06
- Apply the confirmed decisions in [Private Run History and Public Best Ranking](../decisions/2026-11-06-private-run-history-public-best-ranking.md).
- Public ranking rows represent one per-player best run, selected by distance then coins. Personal run history remains private to the authenticated Entra account.
- Entra display names come only from the validated `name` token claim; use `Runner` if absent. Do not request Microsoft Graph permissions or publish email/identity IDs.

## Execution Order Update — 2026-11-06
- The [Pre-Run Controls and Items Guide](./2026-11-06-pre-run-guide.md) is a prerequisite for resuming this plan because it completes the player-facing pre-run flow before cloud integration.
- Azure work is deferred, not canceled. After the guide plan is complete, resume at the current pending P01-T01 task.

## Architecture
- A new Azure Static Web App in `grill-me-edu` hosts the Vite build; the existing Static Web App is not reused.
- A separate Node.js 22 Azure Functions app provides `/api` endpoints and validates Entra access tokens for the API audience and delegated scope.
- Reuse the existing `maze-rescue-ms-*` Cosmos DB account, adding a runner-owned `stella-runner` database and `PlayerRecords` container with partition key `/playerId`. Function App managed identity receives data-plane access only to this new runner data scope.
- Store every submitted authenticated run in the submitter's player partition. Store/update one `leaderboardBest` projection per player in that same partition; the public leaderboard queries only these projections, while the private history API queries run documents using the token-derived player partition.
- The public leaderboard selects one best endless run per account using distance DESC, coins DESC, finish time ASC, stable run ID ASC. Story runs remain visible only in the owner's private history.
- The SPA uses MSAL and the existing public `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_API_SCOPE`, and `VITE_API_BASE_URL` settings.
- Bicep and GitHub Actions define infrastructure and delivery. Target resource group: `grill-me-edu`. Create a new Static Web App and Function App; reuse only the existing Cosmos account and never alter its other databases/containers.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Add Entra SPA auth, owner-only run history, a one-best-run-per-player leaderboard API, Cosmos persistence, and signed-in UI | [P01](../phases/2026-11-03-azure-deployment-readiness/P01-auth-api-data/phase.md) |
| P02 | `pending` | Define isolated Azure resources in Bicep and deploy from `project02` using GitHub Actions | [P02](../phases/2026-11-03-azure-deployment-readiness/P02-infrastructure-delivery/phase.md) |
| P03 | `pending` | Verify security, ranking behavior, local-data handling, and release operations | [P03](../phases/2026-11-03-azure-deployment-readiness/P03-release-validation/phase.md) |

## Constraints
- Tenant IDs, app IDs, redirect URLs, resource names, and secrets are environment configuration; no credential values are committed.
- Existing browser records are not trusted for ranking or wallet migration; they remain local.
- The private personal-history destination and public user-ranking destination are separate screens and API contracts. Local development continues to use browser-local data without importing it into Azure.
- Basic server validation is not a strong anti-cheat guarantee while the simulation remains client-side.
- The portal screenshot identifies a target group and the shared Cosmos account; execution must verify ownership/permissions and prove by what-if that only the new SWA, Function App, and runner database/container are added.

## Release Guard
Do not deploy Bicep, create Azure resources, update Entra registrations, add GitHub secrets, or publish the SWA until the user reviews the concrete plan and required organizational access is available.
