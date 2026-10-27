# Task: T04 Safe-Route Pickups

## Status: done

## Goal

Increase visible coin collecting opportunities to a predictable safe-route stream while retaining optional jump rewards and ensuring no pickup is unreachable or obscured by a pit, hazard, or gate.

## Decision Summary

- Safe-route pickups use a 125m target interval, within the approved 100–150m range; occasional short coin lines may be rendered as a visual grouping of adjacent authored coins.
- Preserve the current optional jump coin cadence, +3-second time-item base value, time-item frequency, coin scoring, and local-ranking tiebreak rule.
- Resolve collisions with generated obstacle and pit schedules deterministically; do not make safe-route pickups require a jump.

## Implementation

### I01. Configurable pickup schedule

- Related Files:
  - `src/game/runner/runnerConfig.ts` :: pickup scheduling values — modify.
  - `src/game/runner/CollectibleSpawner.ts` :: `PickupDefinition`, schedule generation, `getPickupBodySize`, `PICKUP_SCHEDULE` — modify.
  - `src/game/runner/CollectibleSpawner.test.ts` :: pickup interval and safe separation — modify.

#### Details

- Add tuning values `safePickupSpacingMeters: 125`, `timePickupFirstDistanceMeters: 1360`, `timePickupSpacingMeters: 2400`, and `optionalJumpCoinSpacingMeters: 600`. Keep `RUNNER_CONFIG.timePickupMs = 3000`.
- Replace the fixed 24×600m paired schedule with an exported deterministic `generatePickupSchedule(maxDistanceMeters: number): readonly PickupDefinition[]` and `PICKUP_SCHEDULE` generated through at least 15,000m.
- Define safe pickups at 125m target spacing starting at 160m. Every safe slot is a coin except the time-item slots, starting at 1,360m and repeating every 2,400m; those slots replace a nearby safe coin so they do not stack.
- Keep an optional upper coin every 600m, beginning at the existing 480m position. Mark every such pickup `optionalJump: true` and keep it distinct from the ground path.
- Keep IDs unique and stable, sorted by `distanceMeters`; use `heightUnits: 52` for ground-safe pickups and `heightUnits: 116` for optional jump coins.
- For each candidate, inspect generated hazard centers and `getPitDefinitions(maxDistanceMeters)`. Keep at least `PICKUP_HAZARD_CLEARANCE_METERS = 40` from a ground hazard and at least 40m from pit edges. Keep pickups at least 40m from gates. Relocate a candidate only to a valid safe-route gap while preserving the neighboring safe-slot interval within 100–150m; if no valid location exists, omit the optional jump coin, never move a safe item into a hazard lane.
- Keep `getPickupBodySize(characterId: CharacterId): number`; after P02 reassigns the magnet passive, this function must derive expansion only from Mary's `radiusPx` and return `24 + radiusPx * 2`.

### I02. Rendering and simulation integration

- Related Files:
  - `src/game/runner/CollectibleSpawner.ts` :: `CollectibleSpawner.update`, `spawnPickup`, `destroy` — modify.
  - `src/game/runner/RunnerSimulation.ts` :: `collectPickup` — preserve base time and coin behavior; modify only if schedule integration needs no logic change.
  - `src/game/runner/CollectibleSpawner.test.ts` :: gate and per-biome art assertions — modify.
  - `src/game/runner/RunnerIntegration.test.ts` :: collect frequent items while gates progress — modify.

#### Details

- Keep distance-based screen positioning, collect-once IDs, biome-themed coin/time art, and Phaser object cleanup.
- Use the five configured gates from T01 when enforcing gate clearances.
- `collectPickup` continues to award one coin per coin and `timePickupMs` plus any character-specific bonus defined by P02; this task does not change effect values.

## Acceptance Criteria

- [x] Safe-route pickup gaps remain 100–150m wherever a safe point exists; time items replace safe coins instead of stacking.
- [x] Optional upper coins retain their cadence and can be omitted when a hazard/pit makes a position unsafe.
- [x] No generated pickup overlaps a ground hazard, pit safety zone, or gate-clearance zone.
- [x] All IDs and distances remain deterministic and pickups can be collected at most once.

## Validation

- `npm run test -- src/game/runner/CollectibleSpawner.test.ts src/game/runner/RunnerSimulation.test.ts src/game/runner/RunnerIntegration.test.ts` — spacing, safety, pickup value, and repeat-collection cases pass.
- `npm run typecheck` — pickup generator and character radius types compile.

## Commit Message

```text
feat(runner): add frequent safe-route coin pickups

Plan: 2026-10-27-runner-course-gates-pits-ui-polish
Phase: P01-runner-course
Task: T04-safe-pickups

- Schedule safe coins at a 125m target cadence
- Keep optional rewards and all pickups clear of hazards
```

## Progress

- [x] Implementation complete
- [x] Validation passed (16 targeted tests and typecheck)
- commit: pending
