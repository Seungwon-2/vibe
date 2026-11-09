# Decision: Azure Deployment Readiness

## Goal
Prepare the current React/Vite runner for company-only play, Entra-authenticated rankings and player data, and repeatable Azure deployment. This plan does not provision resources or publish the app.

## Confirmed Decisions
- Host the SPA on Azure Static Web Apps; use Azure Functions for the API and Azure Cosmos DB for persistence.
- Restrict sign-in to the company's single Microsoft Entra tenant.
- Use MSAL in the SPA and request a delegated access token for the API.
- Derive player identity from validated `(tid, oid)` token claims. Never trust a client-provided player ID, email, ranking position, wallet balance, or unlock state.
- Continue deployment work on the `project02` branch.
- Target resource group shown by the user: `grill-me-edu` in subscription `CR-Project-01`.
- Reuse the existing Cosmos DB account whose name starts with `maze-rescue-ms-`; add a runner-owned database/container only. Do not read, modify, rename, or delete anyone else's database/container.
- Create a new runner-owned Static Web App in `grill-me-edu`; do not deploy over the existing Static Web App.

## Working Assumptions To Reconfirm Before Provisioning
- Create a new runner-dedicated Static Web App and Function App in `grill-me-edu`. Reuse only the existing `maze-rescue-ms-*` Cosmos DB account; do not reuse the existing SWA.
- In the shared Cosmos account, create a runner-owned database `stella-runner` and container `PlayerRecords` with partition key `/playerId`. Do not alter any existing database/container or account-level settings.
- Use a separate Function App linked to the new Static Web App API route. Scope its managed-identity Cosmos DB data-plane permission to the runner-owned database/container; no Cosmos key in the browser or repository.
- Use Bicep and GitHub Actions from `project02`; prefer GitHub OIDC. Use Static Web Apps Standard if required for linking the separate Function App.
- Do not import localStorage records automatically. Keep local records local; cloud history begins with authenticated server submissions until a migration policy is approved.

## Data and Ranking Rules
- Cloud identity is the validated `(tid, oid)` pair, not an email/display name.
- Endless ranking order remains distance descending, coins descending, finish timestamp ascending, stable run ID ascending. Story runs are not part of the endless leaderboard.
- Profile includes the existing `PlayerProfile` fields: wallet, unlocked characters/stages, cleared stages, challenge and achievement progress, cosmetics, equipped cosmetics, processed run IDs, and claimed reward keys.
- Run and reward operations must be idempotent. A retry cannot duplicate coins or unlocks.
- First release adds server-side validation and basic plausibility checks. Client-side simulation cannot provide strong anti-cheat; server-authoritative simulation is out of scope.

## Security and Operations
- `VITE_*` settings are public configuration only. No client secrets, Cosmos keys, or deployment credentials in source control.
- Functions reject missing, invalid, wrong-tenant, wrong-audience, or insufficient-scope tokens.
- Keep local development usable with local stores and separate local settings.
- Production resource creation, app registration changes, role assignment, GitHub OIDC trust, and publishing wait until the user reviews the plan and organizational access is confirmed.

## Open Verification Items For Execution
- Confirm the `maze-rescue-ms-*` Cosmos account name, target database/container naming policy, permission to add child data resources, and available throughput/cost before deployment.
- Confirm the resource group is approved for a new runner Static Web App and Function App and check quotas before deployment.
- Confirm SWA Standard and permitted regions with the Azure owner.
- Confirm GitHub OIDC and protected deployment environments are allowed.
- Confirm tenant admin can create/approve the SPA and API app registrations and delegated API scope.
- Confirm Cosmos region, backup, throughput, and cost policy.
