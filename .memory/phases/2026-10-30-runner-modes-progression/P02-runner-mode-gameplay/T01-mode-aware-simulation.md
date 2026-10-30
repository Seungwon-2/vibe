# Task: T01 Mode-Aware Simulation

## Status: pending

## Goal

Make the pure runner simulation accept mode and Story stage configuration, end finite Story courses at the finish distance, and convert Story time pickups into temporary speed boosts.

## Decision Summary

- Story has no countdown, uses its configured finite distance, and displays gates only as landmarks.
- Story time pickups grant +15% speed for 3000ms. Endless timer/gate rules remain unchanged.

## Implementation

### I01. Extend simulation factories and progression

- Related Files:
  - src/game/runner/RunnerSimulation.ts :: createRunnerSnapshot, startRunner, advanceRunner, collectPickup, finishRunner; modify
  - src/game/runner/runnerConfig.ts :: centralized Story speed boost and Endless tuning constants; modify
  - src/game/runner/runnerTypes.ts :: fields from P01-T01; read-only
  - src/game/runner/RunnerSimulation.test.ts :: mode-specific simulation cases; modify
  - src/game/runner/RunnerScene.ts :: mode/stage options passed to simulation and scene finish callbacks; modify
  - src/game/runner/RunnerGame.tsx :: mode/stage props; modify

#### Details

- Extend createRunnerSnapshot options with mode defaulting to endless and storyStageId defaulting to null; reject story mode without a known stage.
- For Endless, preserve 90,000ms initial timer and gate time bonuses. For Story, set remainingMs to Infinity or use a nullable timer model consistently; do not decrement timer or finish on timeout.
- In Story, derive target distance from STORY_STAGES. When distance crosses target, finish once with reason stage-complete and completedStage true.
- Story time pickup: add 3000ms stageSpeedBoostRemainingMs and multiply base course speed by 1.15 while remaining duration is positive. Do not change timer.
- In Story, gate event is landmark-only and does not add time. Keep gate feedback event if useful to UI.
- Ensure speed boost remaining duration advances only while running and pauses with game state.
- Keep mode/stage inputs immutable for the lifetime of a run.

## Acceptance Criteria

- [ ] Story run does not count down and completes at the configured course length.
- [ ] Story time pickup applies exactly +15% speed for 3 seconds.
- [ ] Endless timer, time pickups, and gate bonuses are unchanged.

## Validation

- npx vitest run src/game/runner/RunnerSimulation.test.ts src/game/runner/RunnerIntegration.test.ts
- npm run typecheck

## Commit Message

    feat(runner): add finite story course simulation

    Plan: 2026-10-30-runner-modes-progression
    Phase: P02-runner-mode-gameplay
    Task: T01-mode-aware-simulation

    - Add mode-aware timer, stage finish, and speed pickup rules
    - Preserve Endless timer and gate rewards

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
