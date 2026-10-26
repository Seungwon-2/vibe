# Task: T03 Run Screen Flow

## Status: pending

## Goal

Replace the starter/platformer route with the complete runner menu, character selection, countdown, run, pause, and result flow.

## Decision Summary

- Keep the simple main menu, character selector, and rankings entry. Remove world map, stage map, continue-save, stage-clear, checkpoint-retry, and life/game-over routes.
- After selecting a character and pressing start, begin the 3-second countdown; after timeout, offer retry with the same character or return to character selection.

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
- `RunScreenProps = { characterId: CharacterId; onFinish(result: RunnerResult): void; onExit(): void }`. It owns `countdown | running | paused` presentation state and passes `characterId` and callbacks to `RunnerGame`.
- `RunResultProps = { result: RunnerResult; bestDistanceMeters: number; onRetry(): void; onChooseCharacter(): void; onRankings(): void }`. Show rounded final distance, collected coins, personal best, character and its result animation. Retry preserves the selected character and starts a fresh 3-second countdown; choosing a character returns to selection.
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

- [ ] Navigation follows menu → character select → 3-second countdown → runner → result.
- [ ] Retry keeps the current character; selecting another character returns to the four-card selector.
- [ ] Rankings is reachable from the main menu and result screen.
- [ ] No platformer stage map, checkpoint, lives, boss, or stage-save screen is reachable.
- [ ] Phaser is destroyed exactly once when leaving or restarting a run.

## Validation

- `npm test -- src/App.test.tsx src/app/screens/RunResult.test.tsx` — validates screen transitions.
- `npm run typecheck` — validates callback and route types.
- `npm run build` — confirms the app can bundle all screens.

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

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
