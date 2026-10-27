# Task: T03 First-Run Tutorial

## Status: done

## Goal

Show jump and slide guidance only during the first browser run, with contextual cues at their first respective obstacles, then suppress repeated controls and obstacle labels.

## Decision Summary

- Persist a browser-local tutorial-seen flag; do not synchronize it with accounts or ranking.
- RunScreen help and `JUMP`/`SLIDE` obstacle labels are first-run-only. T02 places the first slide obstacle at 600m.

## Implementation

### I01. Add a guarded browser-local tutorial store

- Related Files:
  - `src/game/runner/runnerTutorial.ts` :: tutorial storage functions — read/write first-run state safely; new
  - `src/game/runner/runnerTutorial.test.ts` :: storage behavior — test first-run, persistence, and failures; new

#### Details

- **Signatures & Types**:
  ```typescript
  export type RunnerTutorialStorage = Pick<Storage, 'getItem' | 'setItem'>;
  export const RUNNER_TUTORIAL_STORAGE_KEY: string;
  export function shouldShowRunnerTutorial(storage?: RunnerTutorialStorage): boolean;
  export function markRunnerTutorialSeen(storage?: RunnerTutorialStorage): void;
  ```
- Use key `runner-action:tutorial:v1:seen` and value `1`. Resolve `window.localStorage` inside browser-safe functions and catch storage getter/read/write exceptions.
- If browser storage is unavailable, use a module-local fallback flag so the tutorial works at most once in the app session without preventing play.
- Mark the tutorial seen on entering the first tutorial run, so result/retry, reload, or a later run does not show a second tutorial run.

### I02. Pass tutorial state to the scene and gate controls

- Related Files:
  - `src/game/runner/RunnerGame.tsx` :: `RunnerGameProps`, config creation — pass tutorial state; modify
  - `src/game/runner/createRunnerGameConfig.ts` :: `RunnerGameCallbacks`, `preBoot` — put state in Phaser registry; modify
  - `src/game/runner/RunnerScene.ts` :: `create` — pass state to obstacle spawner; modify
  - `src/game/runner/ObstacleSpawner.ts` :: constructor, `spawn` — create first-run-only warnings; modify
  - `src/app/screens/RunScreen.tsx` :: `RunScreen` — select state, show first-run keyboard help; modify
  - `src/app/screens/MainMenu.tsx` :: `MainMenuProps`, help paragraph — hide static controls after tutorial; modify
  - `src/App.tsx` :: menu and run route props — pass `showControlsHelp` from the tutorial store; modify

#### Details

- Add required boolean `tutorialEnabled` to `RunnerGameProps` and the `createRunnerGameConfig` inputs. Store it in Phaser registry under literal key `runnerTutorialEnabled`.
- Add `tutorialEnabled: boolean` as the fifth argument to `createRunnerGameConfig(parent, characterId, inputBridge, callbacks, tutorialEnabled)` and set it in `preBoot`. `RunnerScene.create` reads that registry boolean and passes it as the fourth constructor argument to `new ObstacleSpawner(scene, player, onOverlap, tutorialEnabled)`.
- `RunScreen` reads `shouldShowRunnerTutorial()` once on mount, records `markRunnerTutorialSeen()` when starting that first tutorial run, and passes the captured boolean into `RunnerGame`. A rerender must not turn off first-run cues mid-run.
- Render `.run-screen__help` only when `tutorialEnabled`. It contains Space/ArrowUp jump, held ArrowDown slide, and P pause. Keep touch controls visible and usable in every run.
- Add `showControlsHelp: boolean` to `MainMenuProps`, pass the current tutorial availability from `App.tsx`, and render `.main-menu-help` only while the tutorial is still available. Menu actions and record summary remain visible.
- `ObstacleSpawner` accepts `tutorialEnabled`, tracks warned `HazardKind`s per instance, and creates a warning only for the first spawned obstacle of each kind when true. All hazard art and colliders spawn normally.
- First ground hazard (360m) shows jump guidance; first overhead hazard (600m after T02) shows slide guidance. Later obstacles and every obstacle in later runs have no action label.
- No blocking overlay or pause is added. Tutorial behavior is independent of character, input device, passives, and pause/resume.

### I03. Add tutorial state and rendering tests

- Related Files:
  - `src/game/runner/runnerTutorial.test.ts` — storage cases; new
  - `src/game/runner/ObstacleSpawner.test.ts` :: warning creation — verify per-kind first-run behavior; modify
  - `src/app/screens/RunScreen.test.tsx` — first-run and repeat-run help/prop assertions; modify
  - `src/App.test.tsx` — menu help state plumbing; modify

#### Details

- Assert absent key => show, stored `1` => hide, marking writes `1`, and throwing storage access does not throw.
- Assert first RunScreen mounts with tutorial enabled and help visible; subsequent run mounts disabled with help hidden. Reset injected storage between cases.
- Assert one warning for the first ground and first overhead hazard, none for second hazards, and no warning objects when tutorial is disabled while all colliders still spawn.
- Assert menu control help is conditional and menu start/rank buttons always remain.

## Acceptance Criteria

- [x] First browser run shows actionable jump and slide cues at their first respective obstacles only.
- [x] Later runs and later obstacles have no repeated movement instructions; touch buttons remain functional.
- [x] Menu and run key hints disappear after the first tutorial run.
- [x] Storage restrictions do not prevent the game from starting.

## Validation

- `npm run test -- src/game/runner/runnerTutorial.test.ts src/game/runner/ObstacleSpawner.test.ts src/app/screens/RunScreen.test.tsx src/App.test.tsx` — focused tutorial cases pass.
- `npm run typecheck` — React props, route state, and Phaser registry wiring compile.

## Commit Message

```text
feat(runner): teach controls once on the first browser run

Plan: 2026-10-27-runner-object-tutorial-polish
Phase: P01-runner-presentation
Task: T03-first-run-tutorial

- Persist the first-run tutorial state locally
- Show jump and slide hints only at their first safe obstacles
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: see Git history
