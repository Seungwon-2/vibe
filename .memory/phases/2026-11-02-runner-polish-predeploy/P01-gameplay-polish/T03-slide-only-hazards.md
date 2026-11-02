# Task: T03 Slide-only Hazards

## Status: pending

## Goal
Make overhead hazards require a grounded slide. Jumping above or through their art must still register a hit, while a held slide passes safely; ground hazards retain their existing jump-clearance behavior.

## Decision Summary
- Use hazard-kind-aware collision behavior. Keep gameplay collision code separate from artwork dimensions.
- Sliding is valid only while grounded, as already enforced by `RunnerPlayer.isSliding`.

## Implementation

### I01. Overhead hazard collision lane
- Related Files:
  - `src/game/runner/ObstacleSpawner.ts` :: `ActiveHazard`, constructor callback type, `update`, `spawn` — modify.
  - `src/game/runner/RunnerScene.ts` :: `handleHazardOverlap`, `create` spawner callback — modify.
  - `src/game/runner/CollisionSystem.ts` :: `getHazardGeometry`, `tryResolveHazardHit` — modify only if required to keep geometry and hit rules coherent.
  - `src/game/runner/hazardTypes.ts` :: `HazardKind` — read-only unless adding a specific collision response type is necessary.

#### Details
- Preserve the visible overhead bar at the current ceiling position and height.
- For overhead hazards, use an invisible overlap region that covers the active runner lane from `y = 0` through `RUNNER_GROUND_Y`; for ground hazards, keep the existing visible collision box geometry.
- Change the spawner overlap callback to pass `HazardDefinition` or at minimum `HazardKind` to the scene.
- In the scene, when the hazard kind is `overhead` and `player.isSliding` is true, treat it as a successful dodge and remove that hazard without calling damage resolution, consuming passive charges, or applying time/life penalties.
- Otherwise route the overlap through the current `tryResolveHazardHit` flow. Thus jumping cannot evade overhead hazards; a non-sliding grounded runner and an airborne runner are hit.
- Keep tutorial warnings, obstacle artwork, pit/gate clearance, and ground hazard behavior unchanged.

### I02. Collision tests
- Related Files:
  - `src/game/runner/ObstacleSpawner.test.ts` :: overhead overlap — extend.
  - `src/game/runner/CollisionSystem.test.ts` :: hazard resolution — extend if kind-level logic is moved there.
  - `src/game/runner/RunnerScene.test.ts` :: callback routing — extend.
- Verify overhead while jumping causes one hit, grounded slide causes no hit, ground obstacle still permits jump clearance, and a hazard is consumed once.

## Acceptance Criteria
- [ ] Jumping cannot bypass an overhead slide obstacle.
- [ ] Grounded sliding passes overhead obstacles without damage or passive consumption.
- [ ] Ground obstacles remain avoidable by jumping.
- [ ] Visible art remains aligned with its warning and keeps its current appearance.

## Validation
- `npm test -- src/game/runner/ObstacleSpawner.test.ts src/game/runner/CollisionSystem.test.ts src/game/runner/RunnerScene.test.ts`
- `npm run typecheck`

## Commit Message
```text
fix(runner): require sliding for overhead hazards

Plan: 2026-11-02-runner-polish-predeploy
Phase: P01-gameplay-polish
Task: T03-slide-only-hazards

- Keep overhead collision active through the jump arc
- Allow grounded sliding to pass without damage
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
