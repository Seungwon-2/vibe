# Task: T01 Account-Scoped Session Store

## Status: done

## Goal
Persist versioned active and terminal runner sessions in browser storage, isolate data by account, expire it after seven days, and report storage failures without throwing into gameplay.

## Implementation
- `src/game/runner/runnerSessionTypes.ts`
  - Defines `RunnerSessionEnvelope`, `RunnerActiveSession`, `RunnerTerminalSession`, `RunnerSessionScope`, and the versioned `RunnerEngineCheckpoint` boundary.
  - The engine checkpoint is intentionally extensible; Phaser-specific fields belong to T02.
- `src/services/RunnerSessionStore.ts`
  - Exposes `RunnerSessionStore`, `BrowserRunnerSessionStore`, `browserRunnerSessionStore`, and `createRunnerSessionKey`.
  - Uses `stella-runner:session:v1:guest` or an encoded account-scoped key.
  - Validates envelope version, discriminator/payload pairing, scope, paused active snapshot, timestamps, and terminal result fields.
  - Removes only the requested scope's invalid or expired key. Expiry is `now - savedAt >= 7 days`.
  - Converts inaccessible storage and quota failures into typed results. It never logs session data.
- `src/services/RunnerSessionStore.test.ts`
  - Covers guest/account key isolation, active and terminal round trips, scope mismatch, expiry boundary, corrupt and unsupported data, storage denial, quota, and scoped removal.

## Validation
- `npm test -- --run src/services/RunnerSessionStore.test.ts` — passed (7 tests).
- `npm run lint` — passed.

## Commit
`feat(session): add account-scoped local session store`

Plan: `2026-11-12-runner-session-resume`  
Phase: `P01-session-recovery`  
Task: `T01-session-store`

## Progress
- [x] Implementation complete
- [x] Validation passed
- Commit hash: recorded in execution report.
