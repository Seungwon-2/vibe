# Current Context

## Active Plan
[Azure Static Web Apps and GitHub Deployment](./plans/2026-11-11-azure-swa-github-deployment.md)

## Active Phase
[P02 Cloud Delivery](./phases/2026-11-11-azure-swa-github-deployment/P02-cloud-delivery/phase.md)

## Active Task
[T02 Dedicated Entra App Registration](./phases/2026-11-11-azure-swa-github-deployment/P02-cloud-delivery/T02-entra-registration.md)

## Status
- The 2026-11-03 Azure Deployment Readiness plan delivered the MSAL SPA authentication foundation (`f8a9230`) and protected Functions/Cosmos API routes (`2740953`). Its remaining personal-history/ranking UI, account-area, and managed API credential setup are carried into the active plan.
- Coin Motif Pickup Sections and Runner Speed Power-Ups work are recorded as complete in the prior plan/history.
- Current branch is `project02`. Existing unrelated working-tree changes are preserved; planning has not staged, committed, or reverted them.
- Confirmed deployment target: GitHub `Seungwon-2/vibe`, branch `project02`; Azure subscription `CR-Project-01`, resource group `grill-me-edu`; Standard SWA `stella-runner-project02` and app-owned Cosmos SQL database `stella-runner` / container `PlayerRecords` are provisioned per the user's successful ARM result. Actual charges and the SWA hostname remain to be checked.
- The dedicated single-tenant Entra registrations, GitHub secret/workflow, and application deployment remain pending. The SWA and Cosmos child resources were provisioned by the user; the pasted ARM deployment result reports `Succeeded` and lists the expected three resource IDs. This does not confirm live app reachability, Entra/API behavior, or actual billed cost.
- Cosmos owner approval for use of the account-scoped key is reported by the user. Because this key is account-wide and managed API has no managed identity, cloud API connection is gated on secure server-side SWA setting configuration and no-secret logging.
- T01 preflight (2026-11-11): the earlier Free SWA what-if was blocked by the 10-app quota. After the user selected Standard and authorized proceeding, a Standard what-if listed only the new SWA and Stella Runner Cosmos database/container. The user supplied ARM deployment output for `stella-runner-create-20261111`, reporting `Succeeded` and the expected resource IDs. Details and cost assumptions: [deployment preflight](../docs/azure-deployment-preflight.md).
- P02-T01 is complete. P02-T03 infrastructure apply is complete from the user's deployment output; its managed API secure settings remain pending until Entra identifiers are ready. Exact subscription billing and the live site URL are not yet verified.
- Existing unrelated worktree changes remain untouched.
- T03 SWA managed API Cosmos configuration is implemented and validated. Azure access setup was cancelled at the user's request; no Azure resource was changed.

## Next Step
Create the dedicated single-tenant Entra SPA and API registrations described in [T02](./phases/2026-11-11-azure-swa-github-deployment/P02-cloud-delivery/T02-entra-registration.md). Then configure public identifiers and secure server-side API settings in T03; do not expose credentials in code, shell output, logs, or chat.
