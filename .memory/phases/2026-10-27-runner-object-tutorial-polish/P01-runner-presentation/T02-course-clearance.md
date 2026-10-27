# Task: T02 Course Object Clearance

## Status: pending

## Goal

Keep hazards and pickups out of pit and gate safety zones and prevent pickup artwork or collision bodies from intersecting low or overhead hazards.

## Decision Summary

- Reserve 200m before and after every gate for hazards and pickups; preserve the existing pit exclusion zone.
- Check all hazard kinds against pickup visual/collision bounds, and place the first slide hazard near 600m without changing later pattern cadence.

## Implementation

### I01. Add shared landmark and obstacle clearance rules

- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG` — configure 200m gate clear radius; modify
  - `src/game/runner/hazardPatterns.ts` :: early pattern start calculation — move only the second authored start from 900m to 600m; modify
  - `src/game/runner/ObstacleSpawner.ts` :: `ObstacleSpawner.update` — skip whole patterns that conflict with pit or gate zones; modify
  - `src/game/runner/PitSpawner.ts` :: `isPitClearance` — reuse current pit-radius check; read-only
  - `src/game/runner/hazardPatterns.test.ts` — assert first slide and later starts; modify
  - `src/game/runner/ObstacleSpawner.test.ts` — assert gate/pit exclusions; modify

#### Details

- Add one shared `RUNNER_CONFIG.gateClearanceMeters = 200` setting used by both hazard and pickup generation.
- **Signatures & Types**:
  ```typescript
  export function isGateClearance(
    distanceMeters: number,
    gateDistanceMeters: number,
    objectHalfWidthMeters: number,
  ): boolean;
  ```
  Export the predicate from `hazardPatterns.ts`; it returns `Math.abs(distanceMeters - gateDistanceMeters) <= RUNNER_CONFIG.gateClearanceMeters + Math.max(0, objectHalfWidthMeters)` so the whole object footprint stays outside the zone.
- Keep `getPatternStartDistance(0) === 360`; make index 1 start at 600m; for index >= 2 return the existing cadence formula unchanged. Keep action kinds alternating by index. Verify subsequent starts remain 1,440m, 1,980m, 2,000m, and 2,300m.
- In `ObstacleSpawner.update`, build each entire candidate pattern before enqueueing. Skip the whole pattern when any member's full horizontal footprint falls in the inclusive gate interval `[gate - 200, gate + 200]`; account for half the hazard width in meters at each boundary. Also skip pit clearances; never split a multi-obstacle pattern.
- Do not change dense-section spacing, pit clearance, physics boxes, warnings, or obstacle kind selection beyond moving the first slide.

### I02. Check pickup bounds against both hazard lanes

- Related Files:
  - `src/game/runner/CollectibleSpawner.ts` :: `getGroundHazardDistances`, `isPickupDistanceSafe`, `nearestSafeDistance`, `generatePickupSchedule` — check all hazard kinds and landmark zones; modify
  - `src/game/runner/CollisionSystem.ts` :: `getHazardGeometry` — obtain hazard lane bounds; read-only
  - `src/game/runner/RunnerPlayer.ts` :: `RUNNER_GROUND_Y` — pickup baseline; read-only
  - `src/game/runner/CollectibleSpawner.test.ts` — test pickup and all-hazard bounds; modify

#### Details

- Replace ground-only hazard collection with `{ distanceMeters, definition }` records for both kinds, generated to the requested horizon using `getPatternStartDistance`, `getPatternForDistance`, and `getHazardDistance`.
- Represent each scheduled hazard as `{ distanceMeters, definition }`. Update safety helper signature to `isPickupDistanceSafe(distanceMeters: number, heightUnits: number, hazards: readonly ScheduledHazard[], maxDistanceMeters: number): boolean` and pass pickup height from both safe-route and optional-item generators.
- Evaluate pickup candidates using the largest supported square collision body, `getPickupBodySize('tokino-mary')` (84px, half extent 42px), unioned with the 11px coin art radius; add 12px margin. This character-independent reservation prevents Mary's enlarged pickup body from catching through an adjacent obstacle.
- Derive hazard vertical bounds from `getHazardGeometry(definition, 0)` and pickup center y from `RUNNER_GROUND_Y - heightUnits`. Expand both vertical bounds by 12px. Reject a candidate when expanded vertical intervals overlap and the center distance in meters is at most `(hazard.width / 2 + pickupHalfWidthPx + 12) * RUNNER_CONFIG.metersPerWorldUnit`.
- Reject all pickups inside pit clearance or the inclusive 200m interval around any gate, accounting for each pickup's maximum half-width at the interval boundaries. Apply this to safe coins, time items, and optional elevated coins.
- Preserve deterministic nearest-safe-slot selection, stable IDs, 125m cadence target, time-item value/frequency, optional coin cadence, and the local-slot fallback search. Never use an unsafe fallback.

### I03. Add schedule regression assertions

- Related Files:
  - `src/game/runner/CollectibleSpawner.test.ts` :: deterministic schedule tests — assert low/high hazard, pit, and gate clearance; modify

#### Details

- Test generated hazards through 15,000m and assert no hazard's full horizontal footprint lies in pit exclusions or gate +/- 200m.
- Test all pickups, including optional coins, against all generated low/overhead hazard bounds, pits, and gate zones using the maximum visual/collision footprint.
- Assert schedules remain sorted and IDs unique; any larger-than-target pickup gap must be caused by a real excluded hazard or landmark.
- Assert starts begin `[360, 600, 1_440, 1_980, 2_000, 2_300]` for the relevant early/dense transition, updating index-based expectations if required by the established cadence formula.

## Acceptance Criteria

- [ ] Hazards and pickups are absent from gate safety zones.
- [ ] Pickups do not intersect low or overhead hazard art/collision bounds, including Mary's largest pickup body.
- [ ] First jump remains at 360m, first slide is at 600m, and later cadence remains stable.
- [ ] Pit exclusions, dense recovery spacing, IDs, and reward values remain intact.

## Validation

- `npm run test -- src/game/runner/hazardPatterns.test.ts src/game/runner/ObstacleSpawner.test.ts src/game/runner/CollectibleSpawner.test.ts` — schedule and clearance tests pass.
- `npm run typecheck` — helper and hazard-record types compile.

## Commit Message

```text
fix(runner): keep hazards and pickups clear of course landmarks

Plan: 2026-10-27-runner-object-tutorial-polish
Phase: P01-runner-presentation
Task: T02-course-clearance

- Reserve gate safety zones from hazards and pickups
- Check pickups against both hazard lanes and move the tutorial slide
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
