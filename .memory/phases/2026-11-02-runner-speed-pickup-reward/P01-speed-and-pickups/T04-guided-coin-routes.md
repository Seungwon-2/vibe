# Task: T04 Guided Coin Routes

## Status: in_progress

## Goal
Increase coin collection opportunities in both Endless and Story by generating visible lines along the safe ground route and along the intended jump and slide paths. Keep coin patterns deterministic and prevent unfair overlap with hazards, pits, gates, or each other.

## Decision Summary
- The safe ground-route target cadence is currently 125m, post-jump strings currently contain 3 coins every fourth ground hazard, and no dedicated slide-guide string exists.
- Tighten the safe-route cadence to 90m; retain nearest-safe relocation and omit a pickup if no valid point exists.
- Generate jump strings after ground hazards and slide strings through the low clearance of overhead hazards; strings must remain coin-only and have stable IDs.

## Implementation

### I01. Generate safe, jump, and slide coin strings
- Related Files:
  - `src/game/runner/runnerConfig.ts` :: pickup cadence and coin-string settings — modify.
  - `src/game/runner/CollectibleSpawner.ts` :: `PickupDefinition`, `isPickupDistanceSafe`, `generatePickupSchedule`, `getPickupBodySize` — modify.
  - `src/game/runner/CollisionSystem.ts` :: `getHazardGeometry` — read-only reference for overhead opening geometry.

#### Details
- **Signatures & Types**:
  ```ts
  type PickupDefinition = Readonly<{
    id: string;
    kind: RunnerPickupKind;
    distanceMeters: number;
    heightUnits: number;
    optionalJump: boolean;
    guideAction?: 'jump' | 'slide';
    guideHazardId?: string;
  }>;
  ```
- **Data & Schema Fields**:
  - Set `safePickupSpacingMeters` to `90`, `safePickupMinimumGapMeters` to `65`, and `safePickupMaximumGapMeters` to `115`.
  - Set `postJumpCoinRowSpacingMeters` to `18`, `postJumpCoinRowEveryNthHazard` to `2`, `slideCoinRowEveryNthHazard` to `2`, and `pickupCoinVisualClearanceMeters` to `16` (giant clearance stays 24m).
  - Keep `postJumpCoinRowSearchRadiusMeters` and step configurable.
  - Keep existing time, giant, and coin pickup kinds. Action guidance rows are coin pickups and get IDs prefixed `jump-guide-` or `slide-guide-`.
- **Execution Flow / Logic**:
  1. Keep safe-route coin/time candidates on the ground lane; preserve time-item slot replacement. Reduce local minimum/maximum spacing proportionally so safe slots can target the new 90m cadence while still relocating around hazards, pits, and gates.
  2. For jump guidance, generate a 3-coin elevated line after selected ground obstacles in both schedules; use `heightUnits: 132`, `optionalJump: true`, and `guideAction: 'jump'`. Increase the cadence from every fourth ground hazard to every second ground hazard. Search nearby candidate positions and skip the whole row if any coin is unsafe or conflicts with another pickup.
  3. For slide guidance, generate a 3-coin low line centered beneath selected overhead obstacles; use `heightUnits: 14`, `optionalJump: false`, and `guideAction: 'slide'`. This is an intentional safe slide tunnel: validate coin art bounds against the actual overhead bar, allow the line only for that matching overhead hazard, and still reject overlap with other hazards, pits, gates, or unrelated pickups.
  4. Keep spacing, coin row count, and hazard selection in `RUNNER_CONFIG`. Continue to call `generatePickupSchedule` with the matching Story stage id so Story lines use that stage's fixed route; Endless uses its own schedule.
  5. Ensure the larger Mary pickup body is included in safety checks, but don't let a pickup's larger trigger radius cause the pickup art to be placed inside a physical non-slide hazard.
- **Error & Exception Handling**: If a complete 3-coin row cannot be placed safely, omit that row rather than emit a partial or overlapping row. Bound searches to the local configured distance window.

### I02. Validate coin-line accessibility and clearance
- Related Files:
  - `src/game/runner/CollectibleSpawner.test.ts` :: authored schedule and clearance tests — modify.
  - `src/game/runner/pitChallengeSchedule.test.ts` :: Story pit and route tests — read-only reference.

#### Details
- For Endless and all Story stages, assert safe-route pickups target approximately 90m cadence while gaps caused by hazards/landmarks relocate or omit safely.
- Assert selected ground hazards have elevated 3-coin jump lines with stable IDs and that all lines remain within the stage limit.
- Assert selected overhead hazards have low 3-coin slide lines, each line clears the actual overhead bar and does not conflict with pits/gates/other hazards.
- Assert jump/slide guide lines and safe pickups never overlap each other within the configured pickup clearance and schedule generation is deterministic.
- Re-run existing giant challenge coverage and Mary pickup-radius separation tests.

## Gameplay Finding
- The 10% faster Endless speed made the existing 150m-wide Endless double-jump pit crossable by a single jump at the maximum pre-pit speed. Widened only Endless wide pits to 160m so the established single-vs-double-jump distinction remains. Story pit widths and authored schedules are unchanged.

## Acceptance Criteria
- [x] Both modes show more frequent safe-route coin lines.
- [x] Jump and slide routes each have distinct 3-coin strings that align with their intended maneuver.
- [x] All generated schedules are deterministic, within route bounds, and clear of unrelated hazards, pits, gates, and other pickups.
- [x] No animation, hazard collision, giant effect, time award, or ranking rule changes. The Endless wide-pit width adjustment preserves its prior intended jump requirement.

## Validation
- `npm test -- src/game/runner/CollectibleSpawner.test.ts src/game/runner/pitChallengeSchedule.test.ts src/game/runner/hazardPatterns.test.ts` — passed (22 tests).
- `npm run typecheck` — passed.
- `npm run build` — passed (Vite emitted its existing large-chunk advisory).
- `git diff --check` — passed.

## Commit Message
```text
feat(game): add safe and action-guided coin routes

Plan: 2026-11-02-runner-speed-pickup-reward
Phase: P01-speed-and-pickups
Task: T04-guided-coin-routes

- Tighten safe-route coin cadence and add jump/slide strings
- Preserve mode-specific hazard and pit clearance
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: ace62a6
