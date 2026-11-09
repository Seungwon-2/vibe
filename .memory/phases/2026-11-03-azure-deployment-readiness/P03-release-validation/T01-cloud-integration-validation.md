# Task: T01 Cloud Integration Validation

## Status: pending

## Goal
Prove the staging app enforces the configured tenant, stores cloud profiles and rankings safely, preserves ranking order, and keeps local play available.

## Decision Summary
- Validate staging before production. Use approved tenant test accounts and disposable run IDs.
- Do not automatically migrate browser-local ranking/profile records.
- Basic plausibility checks are not a strong anti-cheat guarantee while game simulation is client-side.

## Implementation

### I01. Integration, privacy and failure verification
- Related Files:
  - `api/test/integration/*.test.ts` :: API integration scenarios; new
  - `src/services/AuthenticatedRunGateway.test.ts` :: client contract tests; modify/new
  - `docs/azure-staging-validation.md` :: reproducible staging checklist; new
  - `api/src/functions/health.ts` :: API health endpoint if absent; new
- Scenarios:
  1. Configured company-tenant account signs in; signed-out and external-tenant accounts cannot call private profile or submit APIs.
  2. Wrong audience, missing scope, expired token and client-forged player ID are rejected.
  3. Player A cannot read or change Player B profile, wallet, unlocks, claims, or run data.
  4. Authenticated history returns all of its owner's runs across endless/story modes, paginates safely, and never returns another account's records; public endpoints never expose that history.
  5. Public ranking contains at most one row per account, only for endless mode. Same-account best selection uses distance DESC then coins DESC; global order uses distance DESC, coins DESC, finish time ASC, stable best-run ID ASC.
  6. Public names use validated Entra `name`, fall back to `Runner`, and never expose email, tenant/object IDs, playerId, or run IDs.
  7. Story runs appear in private history but never in public leaderboard; a non-best endless run does not replace the public row.
  8. Repeating a submission creates one private run and awards coins/rewards once.
  9. API/DB outage displays a recoverable error and does not claim a cloud save succeeded.
  10. Local mode without Entra config runs on localhost, preserves localStorage behavior, and does not automatically migrate local records to cloud.
  11. Logs have correlation IDs but no access token, secret, or unnecessary personal data.
- Document the limited server plausibility checks and explicitly do not promise client simulation is cheat-proof.

## Acceptance Criteria
- [ ] Auth, authorization, user isolation, idempotency, ranking, and failure scenarios pass in staging.
- [ ] Local mode is usable and cloud save status is truthful.
- [ ] Logs avoid credentials and unnecessary personal data.
- [ ] Test cleanup is documented and does not require broad database access.

## Validation
- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run assets:validate`
- `npm run build`
- `npm --prefix api test`
- `npm --prefix api run lint`
- `npm --prefix api run build`
- Execute `docs/azure-staging-validation.md` against staging.

## Commit Message
```text
test(azure): verify authenticated runner cloud flows

Plan: 2026-11-03-azure-deployment-readiness
Phase: P03-release-validation
Task: T01-cloud-integration-validation

- Verify Entra tenant and API scope enforcement
- Verify isolated profile, idempotent rewards and ranking order
- Document staging and local fallback checks
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
