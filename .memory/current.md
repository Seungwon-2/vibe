# Current Context

## Active Plan
[Azure Deployment Readiness](./plans/2026-11-03-azure-deployment-readiness.md)

## Active Phase
[P01 Entra Auth, API, and Data](./phases/2026-11-03-azure-deployment-readiness/P01-auth-api-data/phase.md)

## Active Task
[T01 Entra SPA Auth](./phases/2026-11-03-azure-deployment-readiness/P01-auth-api-data/T01-entra-spa-auth.md)

## Status
- Pre-Run Controls and Items Guide P01-T01 and Coin Motif Pickup Sections P01-T01 are complete. Azure Deployment Readiness resumes at P01-T01.
- Confirmed behavior is recorded in `./decisions/2026-11-06-pre-run-guide.md`.
- UI/UX interview decisions are confirmed in `./decisions/2026-11-04-predeploy-ui-ux-polish.md`.
- Speed power-up decisions are confirmed in `./decisions/2026-11-05-runner-speed-powerups.md`.
- Private run history and public best-ranking decisions are confirmed in `./decisions/2026-11-06-private-run-history-public-best-ranking.md`; Azure readiness P01 now includes the API, Cosmos projection, and separate UI contracts. Public names use validated Entra `name` or `Runner`, with no Graph permission or email exposure.
- Runner Speed Power-Ups P01 is complete: simulation, safe pickup placement/high-speed collision handling, and distinct HUD/audio feedback are implemented. Focused tests, typecheck, and production build pass.
- Coin Motif Pickup Sections P01-T01 is complete: safe, deterministic themed coin formations are implemented for Endless and Story courses.

## Next Step
Read `./phases/2026-11-03-azure-deployment-readiness/P01-auth-api-data/T01-entra-spa-auth.md`; continue Azure deployment readiness from the single-tenant Entra SPA sign-in task.
