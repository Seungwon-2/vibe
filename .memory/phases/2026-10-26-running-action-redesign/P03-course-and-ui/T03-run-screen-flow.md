# Task: T03 Run Screen Flow

> **Dependency update:** Execute after `2026-10-26-rin-unified-motion`. That plan adds a five-character roster (three currently playable), `PersonalBestStore`, and a `RunnerFinishOutcome` callback for victory/cry. Reuse those contracts when replacing this minimal `RunnerPreview`; do not create a second personal-best store or revert to a four-card selector.

## Status: done

## Goal

Replace the starter/platformer route with the complete runner menu, character selection, countdown, run, pause, and result flow.

## Decision Summary

- Keep the simple main menu, character selector, and rankings entry. Remove world map, stage map, continue-save, stage-clear, checkpoint-retry, and life/game-over routes.
- After selecting a character and pressing start, begin the 3-second countdown; after timeout, offer retry with the same character or return to character selection.
- Present the run as one landscape play surface with Phaser scenery underneath React HUD/touch overlays; the first screenshot's action-first composition is a reference, not a new stage map or score system.

## Implementation

### I01. Add screen components and app state transitions

- Related Files:
  - `src/App.tsx` :: `AppScreen`, selected-character state, start/finish/retry handlers; replace starter landing body.
  - `src/app/screens/MainMenu.tsx` :: `MainMenu` start/ranking actions; new.
  - `src/app/screens/RunResult.tsx` :: `RunResultProps`, final result and actions; new.
  - `src/app/screens/RunScreen.tsx` :: combines `RunnerGame`, `RunnerHud`, countdown, touch controls, pause; new.
  - `src/App.test.tsx` :: route transition tests; replace starter copy assertion.

#### Details

- `AppScreen = 'menu' | 'character-select' | 'run' | 'result' | 'rankings'`.
- `App` selected ID starts as `player-default`; main-menu start opens `CharacterSelect`; confirmation stores the selected ID and mounts `RunScreen`; no world/stage query parameter or stage selection.
- `RunScreenProps = { characterId: CharacterId; onFinish(result: RunnerResult, outcome: RunnerFinishOutcome): void; onExit(): void }`. It owns `countdown | running | paused` presentation state and passes the finish outcome from `RunnerGame` through to `App`.
- Give `RunScreen` a 16:9 game viewport that scales the 960x540 Phaser canvas as one unit. Layer `RunnerHud`, countdown, pause, and `TouchControls` over that viewport instead of adding separate tall panels that push the controls below the fold. If the browser aspect ratio differs, letterbox without cropping canvas content; use the P03-T02 portrait pause prompt on upright phones.
- Keep the HUD layer above backdrop, hazards, and pickups, with touch controls above the canvas only at the two lower corners. The scene's ground top (y=470) and player's x=170 remain the shared reference for visual QA. Ensure starting, pausing, finishing, and retrying do not flash a stale character or old course frame.
- Forward `RunnerGame`'s one-off `pickup`/`gate` events to `RunnerHud` as `recentBonus: { id, kind, awardedMs } | null`; replace the cue on a new event and clear it after roughly 900ms or on run restart/unmount. Ignore zero-award capped events. Keep this presentation timer separate from the simulation clock and pause/clear it with the run so it cannot leak across retries.
- `RunResultProps = { result: RunnerResult; bestDistanceMeters: number; onRetry(): void; onChooseCharacter(): void; onRankings(): void }`. Show rounded final distance, collected coins, personal best, character and its victory/game-over result animation. Retry preserves the selected character and starts a fresh 3-second countdown; choosing a character returns to the existing five-card roster (three playable, two marked as coming soon).
- Keep a small main menu with “달리기 시작” and “랭킹”; no “이어하기” or stage/world data. Exiting an active run opens a confirmation dialog before discarding the attempt.
- Replace all visible starter copy and platformer UI references in `App.tsx`/`global.css`. Avoid stage/life/checkpoint terminology.
- Handle stale callbacks by keying game lifecycle to a unique run ID; unmount/cleanup the previous Phaser game before retry or character change.

### I02. Verify route behavior

- Related Files:
  - `src/App.test.tsx` :: menu→selector→run→result→retry/selector/rankings tests; modify.
  - `src/app/screens/RunResult.test.tsx` :: result content and callbacks; new.

#### Details

- Test that invalid character selection resolves to Rin, selecting each other character persists through countdown/run/result, timeout shows results once, retry uses the same character with a fresh timer, character selection can be re-opened, and exit confirmation discards only the current run.
- Mock the `RunnerGame` event boundary in React tests; physics rules remain covered by P02 tests.

## Acceptance Criteria

- [x] Navigation follows menu → character select → 3-second countdown → runner → result.
- [x] Retry keeps the current character; selecting another character returns to the existing five-card roster (three playable, two marked as coming soon).
- [x] Rankings is reachable from the main menu and result screen.
- [x] No platformer stage map, checkpoint, lives, boss, or stage-save screen is reachable.
- [x] Phaser is destroyed once when leaving or restarting a run; unique run IDs ignore stale finish callbacks.
- [x] The run screen preserves the full 16:9 course with HUD and touch controls in one viewport.

## Validation

- `npm test -- src/App.test.tsx src/app/screens/RunResult.test.tsx src/app/screens/RunScreen.test.tsx` — validates transitions, results, and exit confirmation.
- `npm run typecheck` — validates callback and route types.
- `npm run build` — confirms the app can bundle all screens.
- Full `npm test` (72 tests) and `npm run lint` passed.

## Commit Message

```text
feat(app): connect character selection to runner flow

Plan: 2026-10-26-running-action-redesign
Phase: P03-course-and-ui
Task: T03-run-screen-flow

- Replace platformer routes with menu, runner, and result screens
- Preserve selected character through retries and results
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending
