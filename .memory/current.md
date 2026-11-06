# Current Context

## Active Plan
[Azure Deployment Readiness](./plans/2026-11-03-azure-deployment-readiness.md)

## Active Phase
[P01 Auth, API, and Data](./phases/2026-11-03-azure-deployment-readiness/P01-auth-api-data/phase.md)

## Active Task
[T01 Entra SPA Authentication](./phases/2026-11-03-azure-deployment-readiness/P01-auth-api-data/T01-entra-spa-auth.md)

## Status
- Pre-Run Controls and Items Guide P01-T01 is complete; Azure Deployment Readiness is active again.
- Confirmed behavior is recorded in `./decisions/2026-11-06-pre-run-guide.md`.
- UI/UX interview decisions are confirmed in `./decisions/2026-11-04-predeploy-ui-ux-polish.md`.
- Speed power-up decisions are confirmed in `./decisions/2026-11-05-runner-speed-powerups.md`.
- Private run history and public best-ranking decisions are confirmed in `./decisions/2026-11-06-private-run-history-public-best-ranking.md`; Azure readiness P01 now includes the API, Cosmos projection, and separate UI contracts. Public names use validated Entra `name` or `Runner`, with no Graph permission or email exposure.
- Runner Speed Power-Ups P01 is complete: simulation, safe pickup placement/high-speed collision handling, and distinct HUD/audio feedback are implemented. Focused tests, typecheck, and production build pass.
- Azure deployment readiness is active again at pending P01-T01. Its release guard remains active: review the concrete configuration and required organizational access before provisioning or publishing any Azure resources.

## Next Step
Continue Azure Deployment Readiness P01-T01 Entra SPA Authentication. Review the concrete configuration and required organizational access before provisioning or publishing Azure resources.
