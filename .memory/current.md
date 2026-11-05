# Current Context

## Active Plan
[Azure Deployment Readiness](./plans/2026-11-03-azure-deployment-readiness.md)

## Active Phase
[P01 Entra Auth, API, and Data](./phases/2026-11-03-azure-deployment-readiness/P01-auth-api-data/phase.md)

## Active Task
[T01 Entra SPA Authentication](./phases/2026-11-03-azure-deployment-readiness/P01-auth-api-data/T01-entra-spa-auth.md)

## Status
- UI/UX interview decisions are confirmed in `./decisions/2026-11-04-predeploy-ui-ux-polish.md`.
- Speed power-up decisions are confirmed in `./decisions/2026-11-05-runner-speed-powerups.md`.
- Runner Speed Power-Ups P01 is complete: simulation, safe pickup placement/high-speed collision handling, and distinct HUD/audio feedback are implemented. Focused tests, typecheck, and production build pass.
- Azure deployment readiness is the next plan. Its release guard remains active: review the concrete configuration and required organizational access before provisioning or publishing any Azure resources.

## Next Step
T03 is complete. Run the local preview for user verification, then resume Azure readiness at P01-T01. Do not provision or publish Azure resources without the separate plan review.
