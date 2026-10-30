# Task: T02 Giant Before Dense Waves

## Status: done

## Goal

Make giant pickups a deliberate lead-in to dense obstacle waves and refine their visual size without distorting the selected character's action animation or changing its collision hitbox.

## Decision Summary

- Set giant duration to 6,000ms; keep automatic activation, refresh-on-recollect, ordinary obstacle immunity, and lethal pits.
- Schedule the item near `denseWaveStart - 100m`, one safe giant per eligible dense wave. After T01, waves start at `2,000m + n * 1,520m`, so initial targets are 1,900m, 3,420m, 4,940m, etc. Search only positions guaranteed to remain before the wave; omit a target if none is safe.
- Increase giant art scale from 1.25x to 1.35x, inverse-scale Arcade source body dimensions/offsets, and keep the current contextual action animation (run on ground, jump/fall in air, slide while sliding).

## Implementation

### I01. Schedule a safe giant pickup before each dense wave

- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `giantDurationMs`, `giantPickupLeadMeters`, `giantPickupSearchRadiusMeters`; modify
  - `src/game/runner/CollectibleSpawner.ts` :: `generatePickupSchedule`, giant safe-candidate search; modify
  - `src/game/runner/CollectibleSpawner.test.ts` :: giant cadence, lead distance, safety and uniqueness; modify

#### Details

- Set `giantDurationMs: 6_000`, `giantPickupLeadMeters: 100`, and search radius `35m`. Derive each wave start from the dense-section settings, then place its giant target at `waveStart - 100m`.
- Bound candidate positions to `target +/- 35m` and strictly before the wave. This keeps the furthest pickup lead at 135m, so the 935m path through the third pattern remains within six seconds at the maximum effective pace.
- Search integer-meter offsets nearest-first. Reuse `isPickupDistanceSafe` so hazards, pits, gates, and artwork/collider extents remain clear. Keep at least 30m from other pickups. If no safe candidate exists in the search range, skip that wave's item without moving it into or past the hazard wave.
- Generate targets only for actual dense wave starts (`denseSectionStartMeters + n * ((densePatternsPerSection - 1) * densePatternSpacingMeters + denseRecoveryGapMeters)`), with giant target exactly 100m before each wave. Guard against a schedule horizon shorter than a target.
- Keep sorted deterministic pickup IDs and retain existing coin/time/optional coin placement.

At the maximum effective speed (about 156.41m/s), the maximum 135m lead-in plus the 800m to the third pattern takes about 5.98 seconds; six seconds covers all three patterns.

### I02. Refine giant sprite scale while preserving actions and collision geometry

- Related Files:
  - `src/game/runner/RunnerPlayer.ts` :: `RunnerPlayer.setGiant`, `applyPose`, `update`; modify
  - `src/game/runner/RunnerScene.ts` :: giant-state propagation and pit/finish cleanup; modify
  - `src/game/runner/RunnerPlayer.test.ts` :: scaled body dimensions for standing/slide/action frames; modify
  - `src/game/runner/RunnerScene.test.ts` :: giant state propagation if a focused harness is practical; modify only for this feature

#### Details

- Change the single giant visual scale constant from `1.25` to `1.35`; use it for both axes and both standing/sliding poses.
- Preserve the normal 40x76 standing and pose-specific sliding world hitboxes by dividing source body width/height and offsets by the same scale factor before applying it to the sprite. Restore original dimensions when giant ends. Do not multiply physics velocity or jump impulse by the art scale.
- Do not call `play()` as a consequence of toggling giant. During grounded running, the regular run animation must keep advancing; jump, double-jump/fall, slide, hurt, pit-fall, and terminal animations remain selected by the existing action state machine.
- Keep `setGiant` idempotent so per-frame snapshot propagation does not repeatedly resize the body or reset the animation. Ensure completion and pit fall clear the size boost; Hiyori pit rescue clears it according to the existing pit-rescue behavior.
- Verify giant collision still ignores ordinary hazards but does not prevent pit fall.

## Acceptance Criteria

- [x] Giant pickups appear just before eligible dense waves at safe positions and never inside the wave; waves that cannot fit a safe pickup within the six-second coverage window are skipped.
- [x] Giant remains six seconds and refreshes without stacking; pits remain dangerous.
- [x] Giant character art is 1.35x, its normal action animation continues, and collision dimensions remain unchanged.

## Validation

- `npm run test -- src/game/runner/CollectibleSpawner.test.ts src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerSimulation.test.ts src/game/runner/CollisionSystem.test.ts`
- `npm run build`

## Commit Message

```text
feat(runner): place giant boosts before dense waves

Plan: 2026-10-30-runner-speed-giant-refinement
Phase: P01-speed-and-giant-placement
Task: T02-giant-before-dense-waves

- Move giant pickups to safe pre-wave positions
- Refine giant scale while preserving action animations and hitboxes
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm run test -- src/game/runner/CollectibleSpawner.test.ts src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerSimulation.test.ts src/game/runner/CollisionSystem.test.ts`; `npm run build`)
- commit: recorded in Git history on `project02`
