# Task: T02 Global Speed Increase

## Status: done

## Goal
Increase the base course speed curve by exactly 10% at both its start and maximum. In Endless, increase hazard/recovery intervals by 10% to preserve current action time; keep Story's authored route spacing unchanged so its challenge becomes faster. Keep ramp time, gate bonuses, passives, animation rates, and collision boxes unchanged.

## Decision Summary
- Current `initialSpeedUnitsPerSecond` is 275 and `maxSpeedUnitsPerSecond` is 357.5. Multiply both by 1.1, yielding 302.5 and 393.25 units/second.
- Gate bonuses and Rin's +5% passive remain additive/multiplicative in their existing order; derived maximum-speed consumers must follow the updated config automatically.
- Scale only Endless pacing settings by 1.1. Keep all Story hazard coordinates, pit placement, stage lengths, and milestone locations unchanged.

## Implementation

### I01. Update central speed values and expectations
- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG.initialSpeedUnitsPerSecond`, `maxSpeedUnitsPerSecond` — change values.
  - `src/game/runner/runnerConfig.ts` :: Endless tutorial slide, early spacing, dense spacing/recovery bases, per-tier reductions, and floors — increase by 10%.
  - `src/game/runner/hazardPatterns.ts` :: `getPatternStartDistance` — retain the same number of early lessons after scaling spacing.
  - `src/game/runner/RunnerSimulation.test.ts` :: initial and gate-ramp tests — update expectations.
  - `src/game/runner/hazardPatterns.test.ts` :: derived maximum-speed expectations — update if present.

#### Details
- **Data & Schema Fields**:
  - Set `initialSpeedUnitsPerSecond: 302.5` (`275 * 1.1`).
  - Set `maxSpeedUnitsPerSecond: 393.25` (`357.5 * 1.1`).
  - Keep `speedRampMs: 90_000`, gate bonus `0.05`, and passive values unchanged.
  - Set Endless values to `tutorialSlideDistanceMeters: 620`, `earlyPatternSpacingMeters: 594`, `densePatternSpacingMeters: 330`, `denseRecoveryGapMeters: 605`, `endlessDenseSpacingDecreasePerTierMeters: 22`, `endlessDenseSpacingFloorMeters: 253`, `endlessDenseRecoveryDecreasePerTierMeters: 66`, `endlessDenseRecoveryFloorMeters: 385`, and `endlessDenseWidePitRecoveryGapMeters: 715`.
- **Execution Flow / Logic**:
  1. `RunnerSimulation.getBaseSpeed` and `baseTraveledWorldUnits` already read these central values; do not duplicate speed constants.
  2. `hazardPatterns.MAX_RUN_SPEED_UNITS_PER_SECOND` is derived from config and existing gate/passive values; verify it reflects the new base max.
  3. Leave Story course distances untouched. In Endless, keep action-recovery windows by scaling its obstacle intervals with the 10% speed increase, while preserving progressive late-course interval reductions.
- **Error & Exception Handling**: Keep speed finite and preserve existing delta chunk-size invariance.

### I02. Verify speed curve
- Related Files:
  - `src/game/runner/RunnerSimulation.test.ts` :: speed tests.
  - `src/game/runner/CollectibleSpawner.test.ts` :: giant challenge duration test that consumes derived maximum speed.

#### Details
- Assert the configured base starts at 302.5 and the Rin countdown snapshot is 317.625 after the existing +5% passive.
- Assert the no-gate base ramp endpoint is 393.25; with five 5% gate bonuses and Rin's 5% passive it is 516.140625 (`393.25 * 1.25 * 1.05`).
- Assert Endless patterns retain safe action-recovery time and progressive late-course spacing reduction; verify Story authored schedules are unchanged.
- Assert non-Rin and Story mode retain their current passive/gate rules, and existing giant duration constraints still pass.

## Acceptance Criteria
- [x] Initial and max course speeds are both 10% higher.
- [x] Gate/Rin bonuses remain composed as before and all derived speed checks pass.
- [x] Animation FPS, jump physics, collision geometry, Story routes, stage lengths, pits, and gates are unchanged.
- [x] Endless obstacle and recovery intervals scale by 10% while progressive late-course tightening remains.

## Validation
- `npm test -- src/game/runner/RunnerSimulation.test.ts src/game/runner/hazardPatterns.test.ts src/game/runner/CollectibleSpawner.test.ts`
- `npm run typecheck`
- `npm test -- src/game/runner/RunnerSimulation.test.ts src/game/runner/hazardPatterns.test.ts src/game/runner/CollectibleSpawner.test.ts` — passed (28 tests).
- `npm run typecheck` — passed.
- `git diff --check` — passed.

## Commit Message
```text
feat(game): increase runner base speed by ten percent

Plan: 2026-11-02-runner-speed-pickup-reward
Phase: P01-speed-and-pickups
Task: T02-global-speed-increase

- Raise initial and maximum course speed values by ten percent
- Scale Endless action spacing while preserving the authored Story routes
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
