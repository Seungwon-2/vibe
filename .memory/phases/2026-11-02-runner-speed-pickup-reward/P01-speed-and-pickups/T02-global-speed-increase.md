# Task: T02 Global Speed Increase

## Status: pending

## Goal
Increase the base course speed curve by exactly 10% at both its start and maximum while keeping ramp time, gate speed bonuses, character passives, animation frame rates, collision boxes, and world-distance hazard spacing unchanged.

## Decision Summary
- Current `initialSpeedUnitsPerSecond` is 275 and `maxSpeedUnitsPerSecond` is 357.5. Multiply both by 1.1, yielding 302.5 and 393.25 units/second.
- Gate bonuses and Rin's +5% passive remain additive/multiplicative in their existing order; derived maximum-speed consumers must follow the updated config automatically.

## Implementation

### I01. Update central speed values and expectations
- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG.initialSpeedUnitsPerSecond`, `maxSpeedUnitsPerSecond` — change values.
  - `src/game/runner/RunnerSimulation.test.ts` :: initial and gate-ramp tests — update expectations.
  - `src/game/runner/hazardPatterns.test.ts` :: derived maximum-speed expectations — update if present.

#### Details
- **Data & Schema Fields**:
  - Set `initialSpeedUnitsPerSecond: 302.5` (`275 * 1.1`).
  - Set `maxSpeedUnitsPerSecond: 393.25` (`357.5 * 1.1`).
  - Keep `speedRampMs: 90_000`, gate bonus `0.05`, and passive values unchanged.
- **Execution Flow / Logic**:
  1. `RunnerSimulation.getBaseSpeed` and `baseTraveledWorldUnits` already read these central values; do not duplicate speed constants.
  2. `hazardPatterns.MAX_RUN_SPEED_UNITS_PER_SECOND` is derived from config and existing gate/passive values; verify it reflects the new base max.
  3. Preserve world-distance placement and game animation FPS; only the time to traverse a distance changes.
- **Error & Exception Handling**: Keep speed finite and preserve existing delta chunk-size invariance.

### I02. Verify speed curve
- Related Files:
  - `src/game/runner/RunnerSimulation.test.ts` :: speed tests.
  - `src/game/runner/CollectibleSpawner.test.ts` :: giant challenge duration test that consumes derived maximum speed.

#### Details
- Assert countdown snapshot starts at 302.5.
- Assert the no-gate ramp endpoint is 393.25; with five 5% gate bonuses and Rin's 5% passive it is 517.021875 (`393.25 * 1.25 * 1.05`).
- Assert non-Rin and Story mode retain their current passive/gate rules, and existing giant duration constraints still pass.

## Acceptance Criteria
- [ ] Initial and max course speeds are both 10% higher.
- [ ] Gate/Rin bonuses remain composed as before and all derived speed checks pass.
- [ ] Animation FPS, jump physics, collision geometry, and meter-based obstacle spacing are unchanged.

## Validation
- `npm test -- src/game/runner/RunnerSimulation.test.ts src/game/runner/hazardPatterns.test.ts src/game/runner/CollectibleSpawner.test.ts`
- `npm run typecheck`

## Commit Message
```text
feat(game): increase runner base speed by ten percent

Plan: 2026-11-02-runner-speed-pickup-reward
Phase: P01-speed-and-pickups
Task: T02-global-speed-increase

- Raise initial and maximum course speed values by ten percent
- Preserve ramp, animation, collision, and gate tuning
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
