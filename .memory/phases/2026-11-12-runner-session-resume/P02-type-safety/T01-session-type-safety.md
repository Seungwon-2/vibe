# T01 Session Type Safety

**Status:** `done`

## Objective
Fix TypeScript errors in runner-session persistence, restore, UI, and fixtures while keeping session recovery behavior intact.

## Files and symbols
- `src/game/runner/runnerSessionTypes.ts`: define `RunnerSessionEnvelope` as a discriminated union, correlating `kind: 'active'` with `RunnerActiveSession` and `kind: 'terminal'` with `RunnerTerminalSession`.
- `src/App.tsx`: retain required run `mode` and `storyStageId` in `sessionRunRef`; populate these values when starting/resuming/recovering a run. Use run metadata when saving terminal envelopes so optional legacy `RunnerResult.mode` cannot leak into required session metadata.
- `src/game/runner/RunnerScene.ts`: save a normalized mode from the active snapshot/configuration when creating checkpoints, with story stage ID normalized to `null` for endless runs.
- `src/services/RunnerSessionStore.ts`: validate the engine checkpoint shape beyond its version tag before accepting browser data as `RunnerEngineCheckpoint`.
- `src/App.test.tsx`, `src/app/components/ResumeSessionDialog.test.tsx`, `src/services/RunnerSessionStore.test.ts`: build valid checkpoint fixtures and narrow `SessionStoreResult` before reading `value`.
- `src/app/components/ResumeSessionDialog.tsx`: rely on discriminated envelope narrowing for active-only payload fields.

## Acceptance criteria
- Active and terminal envelope payloads narrow from `kind` without casts.
- Legacy optional result/snapshot mode fields are normalized before creating required saved-session fields.
- Malformed or incomplete engine checkpoints are rejected instead of being asserted valid from `version: 1` alone.
- Test fixtures conform to `RunnerEngineCheckpoint`; storage result values are accessed only after success narrowing.
- No unrelated files or runtime behavior are changed.

## Validation
- `npm run typecheck`
- `npm run lint`

## Commit
- `fix(runner): resolve session resume type errors`
