# Task: T04 Story Session Persistence

## Status: done

## Goal
Find and correct the reported story-mode “save failed” message so successful story-session persistence is not reported as a failure while real storage failures remain visible.

## Decision Summary
- Both endless and story runs use the existing browser `RunnerSessionStore`; story autosave must not be disabled or silently downgraded.
- Warning text must reflect the actual `SessionStoreResult.reason` and operation that failed.

## Implementation

### I01. Trace and correct story session writes and warning state
- Related Files:
  - `src/App.tsx` :: session-scope effect, `writeEnvelope`, `saveActiveSession`, `saveTerminalSession`, `sessionStorageWarning`; modify.
  - `src/services/RunnerSessionStore.ts` :: `BrowserRunnerSessionStore.write`, `parseEnvelope`, `isActivePayload`; read-only unless the source of a story-only rejection is proven here.
  - `src/game/runner/runnerSessionTypes.ts` :: `RunnerActiveSession`, `RunnerEngineCheckpoint`, `RunnerSessionEnvelope`; read-only unless the persisted shape is inconsistent with runtime output.

#### Details
- **Existing persistence model**:
  - `RunnerSessionEnvelope` has `schemaVersion: 1`, `kind: 'active' | 'terminal'`, ISO `savedAt`, account/guest scope, stable `runId`, and mode-specific payload.
  - Story active payload uses `RunnerActiveSession` plus `storyStageId: StoryStageId`; endless payload uses `storyStageId: null`.
  - `RunnerSessionStore.write` returns success or failure reason `unavailable | quota | expired | invalid`.
- **Diagnostic flow**:
  1. Trace calls to `saveActiveSession` from `RunScreen` and app callbacks, including story startup, pause, checkpoint/autosave, collision recovery, and terminal transition.
  2. Identify whether the reported message comes from `RunnerSessionStore.write`, an unrelated run-record API, or stale warning state carried across `sessionScope`/mode transitions.
  3. Reproduce with valid story-stage envelopes in fake/in-memory storage and distinguish `invalid` payload from unavailable/quota errors.
  4. Fix the earliest proven cause: runtime checkpoint shape, mode/stage normalization, storage scope, stale warning lifecycle, or invalid result serialization. Do not swallow failed writes.
  5. Map failure reasons to concise feedback. `quota` and `unavailable` explain that the run may not be recoverable. `invalid` is treated as an implementation/data error and must not claim success.
  6. Clear old warnings only after successful read/write or explicit dismissal; a new successful story run must not inherit an unrelated prior warning.
- **Constraints**: Keep 7-day TTL, account-scoped storage, exact checkpoint restoration, and local profile/coin settlement unchanged.

### I02. Add story save regression coverage
- Related Files:
  - `src/App.sessionRecovery.test.tsx` :: story active-session save/reload cases; modify.
  - `src/services/RunnerSessionStore.test.ts` :: story envelope write/read validation; modify if present, otherwise new.
  - `src/app/screens/RunScreen.tsx` :: `onSessionSave` call sites; read-only unless a call-site correction is required.

#### Details
- Verify a valid story session writes and reads under the same account/guest scope.
- Verify the first checkpoint and paused story checkpoint save without a warning when storage succeeds.
- Verify simulated quota/unavailable failure still surfaces a recoverability warning.
- Verify a dismissed error does not reappear as stale warning on a successful subsequent story run.

## Acceptance Criteria
- [x] A successful story-mode session save does not display a save-failure warning.
- [x] Story runs remain recoverable after reload when browser storage succeeds.
- [x] Real storage/validation failures remain visible and do not claim the run was saved.
- [x] Endless persistence, expiration, account scoping, and physics restoration remain intact.

## Validation
- `npm test -- src/App.sessionRecovery.test.tsx src/services/RunnerSessionStore.test.ts`
- `npm run typecheck`
- `npm run lint`

## Commit Message
```text
fix(session): correct story save warning behavior

Plan: 2026-11-12-p0-feedback-recovery
Phase: P01-critical-flow-guards
Task: T04-story-session-persistence

- Trace story checkpoint writes and correct the proven failure source
- Keep genuine storage failures visible with recovery guidance
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: see Git history
