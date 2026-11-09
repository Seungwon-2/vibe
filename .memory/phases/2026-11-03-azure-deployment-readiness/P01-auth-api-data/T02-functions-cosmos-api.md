# Task: T02 Functions and Cosmos API

## Status: done

## Goal
Implement the authenticated Functions APIs that save each signed-in player's runs privately, expose the player's own history and best run, and publish only one best endless run per player in the public leaderboard. Keep profile/reward settlement idempotent and isolated by the Entra identity-derived Cosmos partition.

## Decision Summary
- Azure Functions v4, Node.js 22, TypeScript HTTP triggers, and `@azure/cosmos`.
- Require a validated token for the API audience, configured single tenant, and delegated scope `access_as_user`; use one explicit validation boundary (Easy Auth claims only if Functions trust configuration is verified, otherwise verified JWT middleware).
- Derive `playerId = ${tid}:${oid}` from validated token claims; never accept a player ID or public name from the request body/query.
- Public `displayName` comes from the validated access-token `name` claim; use the literal `Runner` when absent. Do not request Graph permissions or expose email, `tid`, `oid`, or playerId.
- Store full run history privately in the runner-owned `stella-runner/PlayerRecords` container, partition key `/playerId`. Public ranking queries one `leaderboardBest` projection per player, not every run.
- Keep localStorage records local and do not import them automatically. Story results appear in private history but not public endless ranking.

## Implementation

### I01. HTTP contracts, authorization, and input validation
- Related Files:
  - `api/host.json` :: Functions host config; new
  - `api/package.json` :: API scripts/dependencies; new
  - `api/tsconfig.json` :: strict TypeScript build; new
  - `api/src/shared/contracts.ts` :: `RunSubmission`, `RunHistoryRow`, `RunHistoryPage`, `PlayerProfileDto`, `LeaderboardRow`, `SubmitRunResponse`, `ApiError`; new
  - `api/src/shared/auth.ts` :: verified claims extraction; new
  - `api/src/shared/validation.ts` :: payload/query validation; new
  - `api/src/functions/profile.ts` :: `GET/PUT /api/profile`; new
  - `api/src/functions/runs.ts` :: `POST /api/runs`, `GET /api/runs`, `GET /api/runs/best`; new
  - `api/src/functions/leaderboard.ts` :: `GET /api/leaderboard`; new
- `RunSubmission`: `{runId:string, characterId:CharacterId, mode:'endless'|'story', storyStageId:StoryStageId|null, distanceMeters:number, coins:number, durationMs:number, finishedAtIso:string, finishReason:RunnerFinishReason, hitsTaken:number, passedGateCount:number, completedStage:boolean}`. Validate known IDs/unions, safe non-negative integer counters, canonical ISO timestamps, and mode/stage consistency. Server receive time is stored separately and is authoritative for event ordering.
- `RunHistoryRow`: `{runId:string, characterId:CharacterId, mode:'endless'|'story', storyStageId:StoryStageId|null, distanceMeters:number, coins:number, durationMs:number, finishedAtIso:string, finishReason:RunnerFinishReason, hitsTaken:number, passedGateCount:number, completedStage:boolean}`. It contains no account identifiers or other players' data.
- `RunHistoryPage`: `{items:RunHistoryRow[], nextCursor:string|null}`. `GET /api/runs?limit=20&cursor=...` clamps limit to 1..50 and queries only the authenticated `playerId` partition, sorted by `finishedAtIso DESC`, then run ID ASC. Cursor is the opaque Cosmos continuation token. An invalid cursor returns HTTP 400 with `INVALID_CURSOR`; it must not fall back to a cross-partition query.
- `LeaderboardRow`: `{rank:number, displayName:string, characterId:CharacterId, distanceMeters:number, coins:number, finishedAtIso:string}`. Do not return runId, playerId, email, `tid`, or `oid`.
- `SubmitRunResponse`: `{savedRun:RunHistoryRow, personalBest:LeaderboardRow|null, personalBestUpdated:boolean}`. `personalBest` is the player's current public-best projection including its current rank, and may be null when the player has no public endless result yet (for example, after a story run). It never describes an ordinary non-best run as a public ranking entry.
- `PlayerProfileDto` mirrors `PlayerProfile` in `src/services/PlayerProfile.ts`: `version:1`, `walletCoins`, `unlockedCharacterIds`, `unlockedStageIds`, `clearedStageIds`, `completedChallengeKeys`, `achievementProgress`, `unlockedAchievementIds`, `unlockedCosmeticIds`, `equippedCosmeticIdsByCharacter`, `processedRunIds`, `claimedRewardKeys`.
- `GET /api/profile` returns the authenticated profile and creates defaults only when absent. `PUT /api/profile` accepts only user-editable cosmetic equipment/preferences; wallet, progress, unlocks, processed IDs, and reward claims are server-owned.
- `POST /api/runs` obtains `playerId` and public display name from validated claims. It rejects client identity/name/rank fields (or ignores them after strict schema validation); it does not use client-supplied account information. Story results are saved to personal history, but never update a public best projection.
- Duplicate `runId` returns its previously persisted outcome without reapplying profile settlement or reward changes. A retry also re-evaluates no different run data under the same id.
- `GET /api/runs/best` reads only the authenticated player's `leaderboardBest` projection, determines its current rank using the public ordering, and returns the `LeaderboardRow` (without run or account identity) or `null`.
- `GET /api/leaderboard?limit=20` clamps limit to 1..100 and queries only `kind='leaderboardBest'`. It sorts distance DESC, coins DESC, finishedAtIso ASC, stable best run ID ASC; assigns rank after sorting and returns no more than one row per player. A player's best-run comparator is distance DESC, coins DESC, finishedAtIso ASC, runId ASC.
- On every authorized run submission, refresh a stored projection's `displayName` from validated `name` or `Runner`, even when the new run does not replace its best score. Preserve the best score fields unless the new run wins the per-player comparator.
- Basic plausibility checks compare distance/time to configured maximum speed and allowed boosts with documented tolerance. Document that client-side simulation is not cheat-proof.
- Errors use `{code:string,message:string,correlationId:string}` without stack traces, token claims, or identifiers.

### I02. Cosmos model, transactional repository, and API tests
- Related Files:
  - `api/src/data/cosmosRepository.ts` :: `CosmosRepository`; new
  - `api/src/domain/profileDefaults.ts` :: `createDefaultProfile`; new
  - `api/src/domain/settleRun.ts` :: `settleRunOnce`; new
  - `api/src/domain/leaderboardBest.ts` :: `comparePersonalBest`, `toLeaderboardBest`; new
  - `api/test/functions/*.test.ts` :: auth, repository, privacy, idempotency and query tests; new
  - `api/local.settings.example.json` :: local placeholder settings; new
- `PlayerDocument` is a discriminated union with common `{id:string, playerId:string, kind:'profile'|'run'|'leaderboardBest', schemaVersion:1}`:
  - Profile: `{id:'profile', kind:'profile', updatedAtIso:string, profile:PlayerProfileDto}`.
  - Run: `{id:'run:<runId>', kind:'run', run:RunSubmission, receivedAtIso:string, serverOutcome:string}`.
  - Best projection: `{id:'leaderboard-best', kind:'leaderboardBest', displayName:string, bestRunId:string, characterId:CharacterId, distanceMeters:number, coins:number, finishedAtIso:string, updatedAtIso:string}`.
- Database `stella-runner`; container `PlayerRecords`; partition key `/playerId`. Index `kind`, `mode`, `finishedAtIso`, `distanceMeters`, and `coins` for partition-filtered run history and cross-partition projection ranking.
- `CosmosRepository` uses `DefaultAzureCredential`; endpoint from `COSMOS_ENDPOINT`. Local settings may hold a developer-only connection string outside git; Azure uses managed identity.
- Submission processing: validate claims/payload; derive partition; read existing run/profile/best; if the run ID exists, return its stored outcome; otherwise compute settlement and compare the new endless run with the current best. Execute run creation, profile settlement, and best-projection create/replace in one transactional batch on that player's partition. For a concurrent best projection ETag conflict, reload and retry comparison/batch a bounded number of times; return a retryable 409/503 rather than write a stale best. Story runs write run/profile only and never create/update a public best from the story result.
- Projection updates must preserve the higher-ranked existing run while refreshing displayName. Best comparison uses distance DESC, coins DESC, finishedAtIso ASC, runId ASC; one projection document ID per player enforces at most one public entry.
- Global leaderboard executes a cross-partition query only over `kind='leaderboardBest'` projections and never over full private run documents. Initial expected tenant scale is internal; document RU/cost monitoring and a future materialized leaderboard option without broadening data access.
- Tests cover: wrong tenant/audience/scope; missing identity claims; missing `name` fallback; client cannot spoof playerId/displayName; malformed query/body; invalid cursor; duplicate run/reward; GET history only returns token-derived partition; personal best distance/coin tie rules; public single-row-per-player; global ordering; story exclusion; projection name refresh; concurrent submission conflict retry; client cannot modify wallet/unlocks.

## Acceptance Criteria
- [ ] Unauthenticated and invalid-tenant/audience/scope requests are rejected before data access.
- [ ] Private run history and personal-best reads are scoped to the token-derived player partition and support bounded pagination.
- [ ] Every authenticated run is stored once; repeating a run never duplicates run history or rewards.
- [ ] Public leaderboard exposes at most one endless best row per player, with per-player distance/coin tie handling and global order as specified.
- [ ] Story runs appear in private history but never in public leaderboard projections.
- [ ] Public display name is validated token `name`, falling back to `Runner`; email and identity keys are absent from public DTOs.
- [ ] Cosmos uses managed identity in Azure; no DB key is in client code or git.
- [ ] Tests cover auth, validation, privacy, idempotency, projection concurrency, and ranking behavior.

## Validation
- `npm --prefix api test`
- `npm --prefix api run lint`
- `npm --prefix api run build`
- `npm test -- src/services`

## Commit Message
```text
feat(api): add private run history and per-player best leaderboard

Plan: 2026-11-03-azure-deployment-readiness
Phase: P01-auth-api-data
Task: T02-functions-cosmos-api

- Store all authenticated runs in owner-only Cosmos partitions
- Maintain one public endless best projection per player
- Enforce token-derived identity, display name and ranking rules
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: `2740953`
