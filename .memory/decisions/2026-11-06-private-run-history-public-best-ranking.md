# Decision: Private Run History and Public Best Ranking

- Date: 2026-11-06
- Status: Confirmed
- Related plan: [Azure Deployment Readiness](../plans/2026-11-03-azure-deployment-readiness.md)

## Goal

After Azure deployment, let each signed-in player review their own run history while publishing only one best endless run per player on the shared leaderboard.

## Confirmed Decisions

- Keep every authenticated run submission in the runner-owned Cosmos data scope so the owner can review their personal history.
- Authorize personal-history reads using the validated Entra `(tid, oid)` identity and derive the player partition on the server. A player cannot read another player's runs by changing request parameters.
- The public endless leaderboard contains at most one row per player: that player's best distance run. When that player's runs tie on distance, use the higher coin count to select the public best run.
- Order the selected per-player rows by distance descending, coins descending, finish time ascending, then stable run ID ascending.
- Story-mode runs remain outside the public endless leaderboard.
- Public rows show the validated Entra access-token `name` claim, with `Runner` when absent; never expose email, tenant ID, or object ID. Do not request Microsoft Graph permissions. Public row fields remain limited to rank, display name, character, distance, coins, and the best run's finish time.
- Existing browser-local history stays local and is not automatically imported into Azure, consistent with the existing deployment decision.
- Retain the existing single-tenant Entra authentication, server-side validation, idempotent submission/reward settlement, and shared Cosmos isolation rules. Only the runner-owned `stella-runner` database/container may be used.

## API and Data Implications for Planning

- Keep the authenticated `POST /api/runs` submission and store run records in the submitting player's `/playerId` partition.
- Add or define an authenticated owner-only personal history query, for example `GET /api/runs?limit=...`; derive `playerId` from validated claims and return only that player's run rows.
- Change `GET /api/leaderboard` so it selects one qualifying best run per player before ranking. It must not expose private history or internal identity keys.
- Update the Cosmos access/query design and tests for per-player best selection, coin tie-breaks within one player's runs, public rank ordering, story exclusion, and cross-player privacy.
- Keep personal history and the public leaderboard as separate UI destinations and data contracts. Label the private destination as the player's own records and the public destination as user rankings.

## Compatibility Notes

- This decision supersedes any earlier plan wording that implies every endless run is a separate public leaderboard entry.
- It does not authorize deployment, app registration changes, role assignments, resource creation, or automatic migration of local browser records.
