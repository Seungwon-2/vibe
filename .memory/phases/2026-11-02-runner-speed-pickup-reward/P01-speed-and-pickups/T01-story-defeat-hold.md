# Task: T01 Story Defeat Hold

## Status: done

## Goal
After the third Story hit depletes the stage's last life, keep the RunnerScene visible with the character's game-over animation for 1 second before firing the finish event and showing StoryResult. Do not add this hold to pit falls or Endless endings.

## Decision Summary
- Story life depletion alone receives the 1,000ms terminal-pose hold; Story victory already has its own 800ms hold.
- Freeze input, course simulation, and trail effects for the hold. Use the existing centralized animation playback configuration.

## Implementation

### I01. Delay Story life-depletion result emission
- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG` — add the Story defeat hold setting; modify.
  - `src/game/runner/RunnerScene.ts` :: `update`, `beginStoryFinish`, `emitFinished`, timer fields — start a terminal game-over hold for `finishReason === 'lives-exhausted'`; modify.

#### Details
- **Signatures & Types**:
  ```ts
  RUNNER_CONFIG.storyDefeatHoldMs: 1_000
  ```
- **Data & Schema Fields**:
  - Add the immutable numeric config field `storyDefeatHoldMs` to `RUNNER_CONFIG`; use milliseconds.
  - Reuse `finishPending: boolean` and `storyFinishTimer: Phaser.Time.TimerEvent | null`; do not change `RunnerResult` or persistence schemas.
- **Execution Flow / Logic**:
  1. In `RunnerScene.update`, on a non-clear Story result with reason `lives-exhausted`, clear input, stop trail effects, set `finishPending`, and call `player.finish('gameOver')` immediately.
  2. Schedule `emitFinished(result)` with `scene.time.delayedCall(RUNNER_CONFIG.storyDefeatHoldMs, ...)`.
  3. Do not run this delay for `pit`, `stage-complete`, or Endless results. Keep the existing pit fall and Story victory timing unchanged.
  4. `emitFinished` remains guarded by `finishEmitted`; timer shutdown cleanup continues to remove the event.
- **Error & Exception Handling**: If the scene shuts down during the hold, remove the timer and emit no late callback. Duplicate finish notifications remain prevented by existing guards.

### I02. Verify terminal timing
- Related Files:
  - `src/game/runner/RunnerScene.test.ts` :: Story finish tests — modify.
  - `src/game/runner/RunnerSimulation.test.ts` :: final-life result fixture — read-only or modify only if a fixture is needed.

#### Details
- Assert Story victory still emits after `storyVictoryHoldMs`.
- Assert `lives-exhausted` plays `gameOver`, does not emit immediately, emits once after exactly `storyDefeatHoldMs`, and freezes inputs/effects.
- Assert pit-fall and Endless finish paths do not receive the added Story hold.

## Acceptance Criteria
- [ ] Story final-life loss visibly holds the game-over pose for 1,000ms before the result callback.
- [ ] Story victory, pit-fall cinematic, and Endless result timing remain unchanged.
- [ ] Timer cleanup prevents late callbacks after scene shutdown.

## Validation
- `npm test -- src/game/runner/RunnerScene.test.ts` — passed (7 tests).
- `npm run typecheck`
- `git diff --check` — passed.

## Findings Outside This Task
- The two stale `RunnerSimulation.test.ts` expectations identified during T01 were updated with T02's speed curve and result shape; the combined suite now passes.

## Commit Message
```text
feat(game): hold story defeat pose before results

Plan: 2026-11-02-runner-speed-pickup-reward
Phase: P01-speed-and-pickups
Task: T01-story-defeat-hold

- Hold Story game-over pose for one second after final life loss
- Keep victory and pit-fall timing unchanged
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: bd51f44
