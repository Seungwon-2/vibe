# Task: T01 Presentation Presets

## Status: done

## Goal
Make calm presentation the default and allow switching to the existing presentation while paused without resetting gameplay.

## Decision Summary
- Presentation only; no simulation/collision/schedule or cloud schema changes.
- New browser-local key, invalid/unavailable storage falls back to calm; reduced-motion forces calm presentation.

## Implementation
### I01. Model and preferences
- New `src/game/runner/runnerVisualPreferences.ts`: `RunnerVisualMode = 'calm' | 'standard'`; `readRunnerVisualMode(): RunnerVisualMode`; `saveRunnerVisualMode(mode: RunnerVisualMode): void`; `getEffectiveVisualMode(mode: RunnerVisualMode, reducedMotion: boolean): RunnerVisualMode`.
- Store only `{version:1, mode:RunnerVisualMode}` at `runner-action:visual:v1`; catch read/write/JSON errors. Default calm.
### I02. Live presentation flow
- `src/app/screens/RunScreen.tsx`: read preference once, subscribe OS reduced-motion changes, effective mode on stage data attribute and RunnerGame prop. Pass stored mode and change callback to PauseOverlay. Save on deliberate user selection, keep run paused.
- `src/app/components/PauseOverlay.tsx`: optional mode/callback, native select with label `화면 효과`, calm/standard choices and motion-only explanation. Preserve existing keyboard focus and button navigation.
- `src/game/runner/RunnerGame.tsx`: optional `visualMode` prop; current value through ref/preBoot registry, separate effect calls `RunnerScene.setVisualMode` without adding it to game-construction dependencies.
- `createRunnerGameConfig.ts`: final optional mode argument, set registry in preBoot.
- `RunnerScene.ts`: public `setVisualMode(mode)` updates backdrop/trail; fatal-pit shake only standard. Default calm in create.
- `RunnerTrailEffect.ts`: calm smaller steady particles, no sparkle/glow, reduced spawn count; OS reduced-motion still clears trail.
- `RunnerBackdrop.ts`: optional mode, setVisualMode preserves distance, calm offsets far=0/middle=.12/near=1. Standard uses existing .15/.4/1. Quiet backdrop-only palette and detail alpha; unchanged hazard palette and world geometry. Mode changes release outgoing layers and redraw backdrop at current distance.
- `RunScreen.css`: calm selectors suppress gate/giant screen effects and moving bonus text; OS reduced-motion applies suppression regardless of mode.
### I03. Tests
- New preference tests: default, invalid/storage errors, standard round-trip, effective reduced-motion.
- RunScreen/PauseOverlay tests: calm default, switching while paused, correct prop, reload preference.
- RunnerGame test: mode changes do not construct a new game or alter pause/checkpoint input.
- Backdrop tests: explicit standard retains old offsets; calm ground=world distance and modes preserve biome.

## Acceptance Criteria
- [x] Presentation switch leaves distance/timers/input/checkpoint unchanged.
- [x] Standard remains selectable, OS reduced-motion honored, persistence failure is safe.
- [x] Existing run/menu behavior and all targeted tests pass.

## Validation
- `npx vitest run src/game/runner/runnerVisualPreferences.test.ts src/game/visuals/RunnerBackdrop.test.ts src/game/runner/RunnerGame.test.tsx src/app/screens/RunScreen.test.tsx`
- `npm run build` and `npm run lint`

## Commit Message
```text
feat(game): add calmer default presentation and comparison control

Plan: 2026-11-17-runner-visual-comfort
Phase: P01-comfort-and-measurement
Task: T01-presentation-presets
```

## Progress
- [x] Implementation complete
- [x] Validation passed — 32 focused tests, build and lint; includes sparse trail and reduced-motion coverage.
- commit: 70e74dc
