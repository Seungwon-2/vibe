# Current Context

## Active Plan
[Azure Static Web Apps and GitHub Deployment](./plans/2026-11-11-azure-swa-github-deployment.md)

## Active Phase
[P01 App Readiness](./phases/2026-11-11-azure-swa-github-deployment/P01-app-readiness/phase.md)

## Active Task
[T02 Signed-in Account Area](./phases/2026-11-11-azure-swa-github-deployment/P01-app-readiness/T02-account-area.md)

## Status
- The 2026-11-03 Azure Deployment Readiness plan delivered the MSAL SPA authentication foundation (`f8a9230`) and protected Functions/Cosmos API routes (`2740953`). Its remaining personal-history/ranking UI, account-area, and managed API credential setup are carried into the active plan.
- Coin Motif Pickup Sections and Runner Speed Power-Ups work are recorded as complete in the prior plan/history.
- Current branch is `project02`. Existing unrelated working-tree changes are preserved; planning has not staged, committed, or reverted them.
- Confirmed deployment target: GitHub `Seungwon-2/vibe`, branch `project02`; Azure subscription `CR-Project-01`, resource group `grill-me-edu`; new Free SWA `stella-runner-project02`; existing Cosmos account `maze-rescue-ms-b7af62a9` with only `stella-runner` / `PlayerRecords` to be added.
- The dedicated single-tenant Entra registrations, SWA resource, Cosmos child resources, GitHub secret/workflow, and deployment have not yet been created. The earlier observed GitHub connector was read-only; write permission must be rechecked before adding/pushing a workflow.
- Cosmos owner approval for use of the account-scoped key is reported by the user. Because this key is account-wide and managed API has no managed identity, cloud API connection is gated on secure server-side SWA setting configuration and no-secret logging.
- Plan execution includes live checks for SWA/API region/runtime support, app-name availability, shared Cosmos capacity and incremental cost, Entra configuration, what-if isolation, successful Actions deployment, real app URL, privacy validation, employee guide, and versioned release notes.
- No Azure resources were provisioned during planning.

## Next Step
Read T02's blueprint and complete the signed-in account area with Entra name, username/email, and logout. Do not begin Azure resource creation or secret configuration until P01 is complete and the P02 preflight/cost/what-if results have been reviewed.
