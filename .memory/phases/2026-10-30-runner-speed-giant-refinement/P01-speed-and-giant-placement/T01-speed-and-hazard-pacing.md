# Task: T01 Speed and Hazard Pacing

## Status: done

## Goal

Increase initial and capped runner speed by 10% and preserve late-game obstacle reaction time by recalculating dense pattern gaps from the true effective cap.

## Decision Summary

- Set initial speed to 275 and maximum base speed to 357.5 world units/second; keep ramp duration 90,000ms, gate bonus 5%, and passives unchanged.
- Dense spacing is 400m, recovery 720m, three patterns per wave, total wave period 1,520m. At the new cap with five gates and Rin's passive, this gives 2.56s between patterns and 4.60s after the wave.

## Implementation

### I01. Update central speed and spacing values

- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG.initialSpeedUnitsPerSecond`, `maxSpeedUnitsPerSecond`, `densePatternSpacingMeters`, `denseRecoveryGapMeters`; modify
  - `src/game/runner/RunnerSimulation.ts` :: `getSpeed`, `traveledWorldUnits`; read-only unless an assumption fails
  - `src/game/runner/hazardPatterns.ts` :: `MAX_RUN_SPEED_UNITS_PER_SECOND`, `DENSE_WAVE_PERIOD_METERS`, `getPatternStartDistance`; read-only unless a derived value needs correction

#### Details

- Set `initialSpeedUnitsPerSecond: 275`, `maxSpeedUnitsPerSecond: 357.5`, `densePatternSpacingMeters: 400`, and `denseRecoveryGapMeters: 720`.
- Keep `speedRampMs: 90_000`, `gateSpeedBonusRatio: 0.05`, and five gate distances unchanged.
- Do not change the existing multiplicative Rin speed passive. The resulting effective maximum is `357.5 * (1 + 5 * 0.05) * 1.05 = 469.21875` units/second; with `metersPerWorldUnit: 1/3`, that is about 156.40625m/s.
- Dense wave period is `(3 - 1) * 400 + 720 = 1,520m`. Expected first starts remain 2,000m, 2,400m, and 2,800m; the next wave starts at 3,520m.
- Do not change animation frame rates, collision shapes, timer, time rewards, or player action physics.

### I02. Update speed and spacing regression coverage

- Related Files:
  - `src/game/runner/hazardPatterns.test.ts` :: wave positions, speed window, reaction/recovery assertions; modify
  - `src/game/runner/RunnerSimulation.test.ts` :: start speed and speed-ramp expectations; modify

#### Details

- Assert initial snapshot speed is 275 and speed after the 90-second ramp with all five gates and Rin passive is 469.21875 units/second.
- Assert Toa's no-speed-passive cap with five gates is 446.875 units/second.
- Assert dense starts advance by 400m within a wave, 720m from its last pattern to the next wave, and 1,520m between first patterns of waves.
- Calculate `400 / (MAX_RUN_SPEED_UNITS_PER_SECOND * METERS_PER_WORLD_UNIT) >= 2.5` and `720 / (...) >= 4.5`.
- Update any test hard-coding initial speed 250 or prior dense starts; retain gate, biome, pit-clearance, timer, and early tutorial coverage.

## Acceptance Criteria

- [ ] Initial and maximum base speed are 10% higher; ramp and bonuses are unchanged.
- [ ] Dense spacing and recovery meet 2.5s and 4.5s at maximum effective speed.
- [ ] No animation FPS, collision geometry, timer, or item reward changed.

## Validation

- `npm run test -- src/game/runner/hazardPatterns.test.ts src/game/runner/RunnerSimulation.test.ts`
- `npm run build`

## Commit Message

```text
feat(runner): increase base speed and retune hazard spacing

Plan: 2026-10-30-runner-speed-giant-refinement
Phase: P01-speed-and-giant-placement
Task: T01-speed-and-hazard-pacing

- Raise initial and maximum speed by ten percent
- Keep dense hazards readable at the new effective cap
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm run test -- src/game/runner/hazardPatterns.test.ts src/game/runner/RunnerSimulation.test.ts`; `npm run build`)
- commit: pending
