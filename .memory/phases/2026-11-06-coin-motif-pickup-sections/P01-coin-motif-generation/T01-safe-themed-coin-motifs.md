# Task: T01 Safe Themed Coin Motifs

## Status: done

## Goal
Generate deterministic coin placements that visibly trace one biome-specific motif in both Endless and Story modes, while preserving safe play, existing power-up schedules, and the baseline coin economy.

## Decision Summary
- Endless: schedule one motif at each 2,500m interval; Story: schedule one motif per stage.
- Fixed mapping: dawn city → star, moonlit forest → flower, crystal mine → music note, cloud skyway → cloud.
- Motifs use coin pickups only. Their section is hazard-free and some elevated coins are optional jump rewards.
- Replace ordinary safe-route coins inside the motif section; do not add motif coins on top of those coins.
- Keep gates, hazards, pits, speed/giant/time pickups, collision geometry, and the existing coin art unchanged.
- If a valid safe window cannot be found, do not force coins into a dangerous location; omit that motif section.

## Implementation

### I01. Deterministic motif point generation and schedule integration
- Related Files:
  - `src/game/runner/CollectibleSpawner.ts` :: `PickupDefinition`, motif coordinate helpers, `generatePickupSchedule`, `isPickupDistanceSafe`, `hasPickupVisualClearance`; modify
  - `src/game/runner/runnerConfig.ts` :: motif cadence, search radius, safe-window margin, motif horizontal/vertical bounds; modify

#### Details
- **Types**:
  ```ts
  type CoinMotifId = 'star' | 'flower' | 'music-note' | 'cloud';
  type MotifPoint = Readonly<{ x: number; y: number }>;
  type PickupDefinition = Readonly<{
    id: string;
    kind: RunnerPickupKind;
    distanceMeters: number;
    heightUnits: number;
    optionalJump: boolean;
    guideAction?: 'jump' | 'slide';
    guideHazardId?: string;
    motifId?: CoinMotifId;
    motifSectionId?: string;
  }>;
  ```
- **Configuration**:
  - `coinMotifEndlessIntervalMeters: 2_500`
  - `coinMotifSafeWindowMeters: 160` total motif width, centered on an anchor and with the same clearance checked on both edges.
  - `coinMotifSearchRadiusMeters: 1_000` around each Endless anchor or Story course midpoint; search integer-meter centers in nearest-first order, breaking ties toward the lower distance. The wider Story search accommodates fixed course hazard and gate clearances.
  - `coinMotifSearchStepMeters: 5`
  - `coinMotifHazardClearanceMeters: RUNNER_CONFIG.pitHazardClearanceMeters` for conservative safe-window screening.
  - Keep motif point art bounds at least 22px apart in 2D screen coordinates (horizontal world distance converted using `METERS_PER_WORLD_UNIT`, plus vertical height). This allows stacked points that form vertical parts of a symbol while preventing visible coin overlap. Do not alter general pickup cadence.
- **Motif geometry**:
  - Add a pure helper that returns a frozen point array for each `CoinMotifId`, in normalized coordinates `x ∈ [0, 1]`, `y ∈ [0, 1]`.
  - Sample each outline with 10–17 distinct points. Shape requirements: five-point star outline; five-lobed flower outline with a small center ring; music note with two noteheads, shared stem and flag; cloud outline with three lobes and a low connecting baseline.
  - Transform `x` linearly into the 160m section. Transform `y` into coin `heightUnits` from 48 through 132. Points at height 48–68 are safe-route coins; points above 68 are `optionalJump: true`. Keep the transforms deterministic and retain the point's order for IDs.
  - Name IDs `motif-${motifSectionId}-${pointIndex}`; `motifSectionId` must be unique across mode, stage/biome and interval. Set `kind: 'coin'`; do not add new pickup kinds or change `drawPickupArt`.
- **Theme resolution**:
  - Story mode uses the selected stage's `biomeId` and its fixed motif.
  - Endless mode resolves the biome at the target interval using `getBiomeForDistance(anchorMeters)` and uses the same fixed mapping.
- **Section scheduling**:
  1. Construct candidate anchors: `2_500, 5_000, 7_500, ...` through `maxDistanceMeters` for Endless; one anchor at `getStoryStage(stageId).lengthMeters / 2` for Story.
  2. For each anchor, search nearest-first in 5m steps within ±1,000m. Reject candidates whose full 160m footprint is outside `[SAFE_PICKUP_START_METERS, maxDistanceMeters]`, crosses a biome boundary, or is within the existing gate-clearance envelope.
  3. Reject candidates if any scheduled hazard's collision/art horizontal footprint intersects the motif footprint, if a pit's footprint or `PICKUP_PIT_CLEARANCE_METERS` intersects it, or if any non-coin pickup (time, giant, speed) is within the footprint plus its visual clearance.
  4. For every generated motif point, call the existing `isPickupDistanceSafe(distanceMeters, heightUnits, hazards, pits)`; check 2D visual bounds against other motif points, and check non-coin pickups by their existing horizontal visual clearance. If any point fails, reject that entire candidate center and try the next one.
  5. On a valid candidate, remove only ordinary safe-route `kind === 'coin'` pickups within the motif footprint; keep time, giant, speed, and hazard-guide pickups. Insert the motif points. If no candidate succeeds, retain the ordinary schedule and omit the motif.
  6. Return the existing frozen, increasing-distance schedule with deterministic IDs so repeated calls and Endless horizon extensions are stable.

### I02. Schedule safety and motif tests
- Related Files:
  - `src/game/runner/CollectibleSpawner.test.ts` :: `authored collectible schedule`; modify
  - `src/game/runner/CollectibleSpawner.ts` :: exported pure motif helper, only if required for direct geometry assertions; modify

#### Details
- Add tests that assert each motif helper returns enough unique normalized points, all values are finite and in bounds, and each outline is stable across calls.
- For Endless schedules through at least 15,000m, assert motif IDs are unique, there is one valid motif per eligible 2,500m anchor, themes map to the expected shapes, and no motif coin appears when a motif section is omitted for safety.
- For each Story stage, assert exactly one valid motif with the stage's fixed motif, all motif points are within the stage length, and all non-motif base safe coins inside that motif section have been replaced.
- Reuse the existing `pickupOverlapsHazard`, `isPitClearance`, and `isGateClearance` helpers to assert no motif point's physical/visual bounds overlap hazards, pits, or gates; also assert each motif section has no hazard/pit/gate in its full footprint.
- Assert elevated motif points have `optionalJump: true`, low points have `optionalJump: false`, and every motif point is a coin.
- Assert motif insertion does not change counts or timing of `time`, `giant`, or `speed` pickups, and no motif duplicates the ordinary safe coin at the same position.
- Preserve existing tests for stable IDs, ordinary safe pickup spacing, guide rows, power-up spacing, and all-mode pickup collision clearances.

## Acceptance Criteria
- [x] Endless and all four Story courses generate the confirmed motif cadence/mapping whenever a complete safe window exists.
- [x] Motifs replace ordinary safe-route coins in their window, include low and optional-jump points, and leave non-coin power-up schedules unchanged.
- [x] Every motif point and its full section respect hazard, pit, gate, and pickup clearance; unsafe sections are omitted rather than forced.
- [x] Existing pickup schedule and collision safety tests continue to pass.

## Validation
- `npm test -- --run src/game/runner/CollectibleSpawner.test.ts` — all focused placement tests pass.
- `npm run typecheck` — TypeScript check passes.
- `npm run lint` — ESLint passes.

## Commit Message
```text
feat(runner): add themed coin motif sections

Plan: 2026-11-06-coin-motif-pickup-sections
Phase: P01-coin-motif-generation
Task: T01-safe-themed-coin-motifs

- Add deterministic star, flower, music note, and cloud coin formations
- Place motifs in verified safe course gaps and replace baseline coins
- Cover Endless and Story placement, collision, and spacing rules
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: `feat(runner): add themed coin motif sections`
