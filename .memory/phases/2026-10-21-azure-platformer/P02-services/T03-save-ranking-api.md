# Task: T03 Save and Ranking API

## Status: pending

## Goal
Provide authenticated APIs for one auto-save slot per player and an all-time top-10 best-score leaderboard per stage.

## Decision Summary
- API ownership comes from validateAccessToken, never request-body identity.
- Server recomputes score from bounded counters and updates one best record per user-stage.

## Implementation

### I01. Save API
- Related Files:
  - api/src/repositories/saveRepository.ts :: get/upsert/delete; new
  - api/src/functions/saveFunctions.ts :: GET/PUT/DELETE /api/saves/me; new
  - api/src/functions/saveFunctions.test.ts :: ownership/validation tests; new
  - src/services/gameDtos.ts :: client DTO types; new
  - src/services/ApiGameGateway.ts :: client service; new
- Details
  - PlayerSave DTO = { characterId:string; worldId:string; stageId:string; checkpointId:string; lives:number; stageScore:number; unlockedStageOrdinal:number; updatedAt:string }.
  - GET returns {save:PlayerSave|null}. PUT validates known character/world/stage/checkpoint ids, lives integer 1..9, score integer >=0, ordinal 1..8; inject tid/oid from token and atomically upsert. DELETE removes only authenticated user's slot. All routes require token.
  - Malformed JSON/unknown ids return 400; missing token 401; absent row 200 with null; DB error 503 generic. Do not disclose another user's data.

### I02. Stage clear and leaderboard
- Related Files:
  - api/src/domain/stageCatalog.ts :: ids and numeric score bounds; new
  - api/src/repositories/rankingRepository.ts :: best record upsert/query; new
  - api/src/functions/rankingFunctions.ts :: GET/POST /api/rankings/{stageId}; new
  - api/src/functions/rankingFunctions.test.ts :: bounds/tie tests; new
  - src/services/ApiGameGateway.ts :: save/ranking mapping; modify
- Details
  - Request StageClearSubmission = { coinCount:number; enemyStompCount:number; extraLifeOverflowCount:number; clearTimeMs:number; completed:boolean }. Reject client score; recompute coinCount*100 + enemyStompCount*200 + 500 + extraLifeOverflowCount*1000.
  - Stage catalog contains exact IDs ruins-1..4 and mine-1..4, max coins/stomps/overflow and plausible minimum/maximum clear time per stage. Reject unknown id, completed not true, counts outside bounds, or time outside bounds with 400. This is basic validation, not server-side gameplay simulation.
  - Upsert only when score is higher, or equal score with faster time. Store verified token name as displayName. GET returns top 10 {rank,displayName,bestScore,bestClearTimeMs} sorted score desc then time asc. Never return internal keys.
  - Use parameterized SQL and a transaction so worse submissions cannot replace a best record.

## Acceptance Criteria
- [ ] Player can access only their own save.
- [ ] Save bounds and stage catalog are enforced.
- [ ] Score is recomputed server-side; leaderboard preserves higher score and tie-break.
- [ ] Public ranking contains only display name, score, time, and rank.

## Validation
- cd api; npm test -- --run src/functions/saveFunctions.test.ts src/functions/rankingFunctions.test.ts — API cases pass.
- npm test -- --run src/services — gateway mapping passes.
- cd api; npm run typecheck; npm run build; cd ..; npm run typecheck; npm run build — pass.

## Commit Message
feat(api): persist saves and stage leaderboards

Plan: 2026-10-21-azure-platformer
Phase: P02-services
Task: T03-save-ranking-api

- add single-slot save endpoints
- validate and rank stage-clear records

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
