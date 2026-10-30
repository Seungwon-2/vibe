# Task: T01 Gate Feedback and Hazard Pacing

## Status: done

## Goal

Make each existing gate speed increase perceptible and adjust dense obstacle timing so the player receives at least 2.5 seconds between patterns and 4.5 seconds of recovery at the maximum supported speed.

## Decision Summary

- Keep the existing permanent +5% speed increase per gate and all current timer rewards.
- The maximum speed calculation must include five gate increases and Rin's multiplicative 5% speed passive: `325 * 1.25 * 1.05 = 426.5625` world units/second, or about `142.19` meters/second.
- Set dense pattern spacing to 360m and recovery spacing to 640m. These yield at least 2.53 seconds and 4.50 seconds at maximum speed.
- Show a 650ms pastel wind streak overlay on the runner stage when a gate is crossed. Do not change simulation speed, animation FPS, or collider sizes for the visual effect.

## Implementation

### I01. Tune dense course spacing and the maximum speed reference

- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG.densePatternSpacingMeters`, `RUNNER_CONFIG.denseRecoveryGapMeters`; modify
  - `src/game/runner/hazardPatterns.ts` :: `MAX_RUN_SPEED_UNITS_PER_SECOND`, `getPatternStartDistance`; modify/read
  - `src/game/runner/hazardPatterns.test.ts` :: dense-wave tests; modify

#### Details

- **Configuration values**:
  - `densePatternSpacingMeters: 360`
  - `denseRecoveryGapMeters: 640`
  - The period between the first pattern of adjacent dense waves is `(densePatternsPerSection - 1) * densePatternSpacingMeters + denseRecoveryGapMeters`, which is 1,360m.
- **Maximum speed calculation**:
  - `MAX_RUN_SPEED_UNITS_PER_SECOND` is `RUNNER_CONFIG.maxSpeedUnitsPerSecond * (1 + RUNNER_GATE_DISTANCES_M.length * RUNNER_CONFIG.gateSpeedBonusRatio) * (1 + rinPassive.speedBonusRatio)`.
  - Import `getCharacterPassive` from `src/game/characters/characterAbilities.ts` and read the Rin passive using character id `'player-default'`; narrow to `id === 'rin-speed'` before reading `speedBonusRatio`.
  - Convert to meters/second using `RUNNER_CONFIG.metersPerWorldUnit` when computing reaction durations.
- **Pattern positions**:
  - Preserve the first dense wave at 2,000m.
  - Its three patterns start at 2,000m, 2,360m, and 2,720m; the next wave begins at 3,360m.
  - Preserve pattern alternation and all gate/pit clearance behavior.
- **Validation cases**:
  - Assert the exact wave start positions and 360m pattern spacing.
  - Assert `360 / (MAX_RUN_SPEED_UNITS_PER_SECOND * metersPerWorldUnit) >= 2.5` seconds and `640 / (...) >= 4.5` seconds.
  - Retain coverage that gate and pit clearances do not split or overlap a scheduled hazard pattern.

### I02. Add a short gate wind-burst overlay

- Related Files:
  - `src/app/screens/RunScreen.tsx` :: `RunScreen`, `handleEvent`, timer cleanup; modify
  - `src/styles/global.css` :: `.runner-stage`, gate-burst pseudo-element and keyframes; modify
  - `src/app/screens/RunScreen.test.tsx` :: gate event feedback lifecycle; modify

#### Details

- Add `gateBurstActive` state and a `gateBurstTimeout` ref typed as `ReturnType<typeof setTimeout> | null`.
- When `handleEvent` receives a `gate` event, restart a 650ms timer, set `gateBurstActive` to `true`, then preserve the current gate sound and bonus cue behavior.
- Clear and null the timer on unmount. Clear it when pausing or switching to portrait, and set the state to `false` so the overlay cannot remain frozen on screen.
- Add `is-gate-boosting` to the `.runner-stage` class only while the state is active.
- Use a `pointer-events:none` `::after` overlay with short, diagonal pastel streaks that travel outward and fade within 650ms. Keep it clipped to the stage, below HUD controls, and readable across all four biome palettes. Do not apply `transform` or scale to the player or the physics canvas.
- Test that a gate event activates the class, repeated gates restart the duration, and the class is removed after the timer. Existing gate reward and audio behavior remains intact.

## Acceptance Criteria

- [x] Dense wave starts and maximum-speed reaction times match the specified values.
- [x] Gate event briefly shows a non-blocking speed streak effect and then clears it.
- [x] Animation FPS, collision dimensions, gate timer bonus, and permanent speed bonus remain unchanged.

## Validation

- `npm run test -- src/game/runner/hazardPatterns.test.ts src/app/screens/RunScreen.test.tsx`
- `npm run build`

## Commit Message

```text
feat(runner): pace dense hazards and show gate speed bursts

Plan: 2026-10-30-runner-gameplay-polish
Phase: P01-runner-feel-and-powerups
Task: T01-gate-feedback-and-hazard-pacing

- Set late-course pattern and recovery gaps by maximum-speed reaction time
- Add a short, non-interactive wind streak effect at gates
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm run test -- src/game/runner/hazardPatterns.test.ts src/app/screens/RunScreen.test.tsx`; `npm run build`)
- commit: pending
