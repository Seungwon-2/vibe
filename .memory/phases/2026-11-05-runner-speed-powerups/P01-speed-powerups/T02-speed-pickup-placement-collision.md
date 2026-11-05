# T02 Pickup Placement and High-Speed Collision

- Status: planned
- Plan: `2026-11-05-runner-speed-powerups`
- Phase: `P01-speed-powerups`

## Goal

Schedule the new speed pickup at a regular but safe cadence in both modes and ensure high-speed movement cannot skip collisions or pickups.

## Decision summary

- Place one speed pickup approximately every 1,200 meters in Endless and Story.
- Keep visible and collision bounds clear of hazards, pits, gates, coins, time pickups, giant items, and other speed pickups.
- Preserve deterministic schedules and all existing mode-specific pickup rules.
- At 2.5x speed, relevant hazards and pickups must not be skipped due to a large frame step.

## Implementation blueprint

### Related files and symbols

- `src/game/runner/runnerConfig.ts`
  - Add centrally tunable speed pickup first distance and interval, targeting approximately 1,200m spacing.
- `src/game/runner/CollectibleSpawner.ts`
  - Extend pickup definition/rendering and `generatePickupSchedule` to insert speed pickups in both modes.
  - Reuse `hasPickupVisualClearance` / `isPickupDistanceSafe` or extend them to account for both art extents and collision bounds.
  - Keep seeded/deterministic generation and preserve coin lines, Story time pickups, and giant placements.
  - Draw a sky-blue lightning silhouette with clear separation from gold coins, Story time pickups, and the violet-pink giant comet.
  - Inspect `update`/`spawnPickup` for fast-crossing pickup overlaps; use a swept overlap or bounded simulation steps if ordinary Phaser overlap can miss an item.
- `src/game/runner/ObstacleSpawner.ts`
  - Review obstacle placement coordinates and active overlap flow under the higher world speed. Add a swept crossing check if an obstacle can pass through the runner between frames.
  - Keep slide-dodging behavior and duplicate-hit prevention intact.
- `src/game/runner/PitSpawner.ts`
  - Review pit crossing and fall detection at high speed. Prevent crossing the pit/floor gap between updates from bypassing pit resolution.
  - Preserve Hiyori rescue and fatal-fall rules.

### Placement and collision invariants

- Candidate speed pickups must be repositioned to the nearest valid safe distance or omitted if no valid location exists; never overlap a gate, pit, or hazard.
- Collision geometry remains separate from illustrations.
- Swept checks use the existing player and object collision bounds, not enlarged bounds. Deduplicate a swept hit before invoking existing collision resolution.
- Speed items must remain collectible in both game modes without changing Story's existing time-item cadence.

## Acceptance criteria

- Both Endless and Story schedules contain speed pickups at roughly 1,200m cadence with deterministic IDs/locations.
- Generated pickup visuals and collision regions are clear of hazards, pits, gates, and other pickups.
- Fast movement cannot tunnel through a hazard, pit edge, or collectible.
- Existing giant placement, Story time pickup, safe coin paths, slide dodge, and Hiyori pit recovery continue to work.

## Validation

- `npx vitest run src/game/runner/CollectibleSpawner.test.ts src/game/runner/ObstacleSpawner.test.ts src/game/runner/PitSpawner.test.ts`
- `npm run typecheck`

Add/update tests for both-mode speed scheduling, safe extents, deterministic placement, high-speed hazard/pit crossing, and swept pickup collection without duplicate collection.

## Commit message

```text
feat(runner): schedule safe speed pickups

Plan: 2026-11-05-runner-speed-powerups
Phase: P01-speed-powerups
Task: T02-speed-pickup-placement-collision
```

## Progress

- [ ] Implementation complete
- [ ] Validation complete
- [ ] Task status set to done\n