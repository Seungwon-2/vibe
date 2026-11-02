# Task: T01 Overhead Hazards and Giant Effect

## Status: done

## Goal
Make each overhead hazard visually occupy the jump-blocking path while retaining an underpass sized for the slide pose, animate successful slide passes instead of destroying them instantly, and remove only the undersized giant aura.

## Decision Summary
- Keep the full-lane overhead collider and slide-only dodge logic; keep the visual footprint independently described.
- Use existing code-based, biome-specific Phaser artwork. Preserve ground hazards, damage, spacing, giant scale, and character animation priorities.

## Implementation

### I01. Give overhead hazards a matching visual footprint
- Related Files:
  - `src/game/runner/CollisionSystem.ts` :: `HazardGeometry`, `getHazardGeometry`, `getHazardCollisionGeometry` —keep existing collision geometry and add an independently testable art geometry; modify.
  - `src/game/visuals/runnerHazards.ts` :: `drawRunnerHazard` —accept the visual height and draw a dawn-city barricade curtain, forest vine hedge, mine crystal screen, or cloud-wind screen that continues from the top of the lane to just above the existing slide clearance; modify.
  - `src/game/visuals/runnerHazards.test.ts` :: themed hazard art tests —verify all art primitives stay inside the visual footprint, every biome remains distinct, and the overhead drawing reaches the defined crawl-gap edge; modify.
  - `src/game/runner/CollisionSystem.test.ts` :: overhead geometry tests —assert existing collision remains `{ x, y: 0, width, height: RUNNER_GROUND_Y }`, art begins at the top of the lane and fills only to the slide-clearance boundary, and ground geometry is unchanged; modify.
  - `src/game/runner/ObstacleSpawner.ts` :: `ObstacleSpawner.update`, `ObstacleSpawner.spawn` —position overhead art using art geometry while leaving hitbox and tutorial warning placement independent; modify.
  - `src/game/runner/ObstacleSpawner.test.ts` :: spawner geometry tests —verify art receives full-height visual extent while Arcade body retains the current collision size; modify.

#### Details
- **Signatures & Types**:
  ```typescript
  export type HazardGeometry = Readonly<{ x: number; y: number; width: number; height: number }>;
  export function getHazardVisualGeometry(hazard: HazardDefinition, x: number): HazardGeometry;
  export function drawRunnerHazard(
    graphics: Phaser.GameObjects.Graphics,
    definition: HazardDefinition,
    biome: RunnerBiomeDefinition,
    visualHeight?: number,
  ): void;
  ```
- Keep `getHazardCollisionGeometry(overhead, x)` unchanged: `x`, `y: 0`, hazard width, and `height: RUNNER_GROUND_Y`.
- Keep `getHazardGeometry` as the existing narrow hazard/art reference used by collectible clearance and warning placement; do not change collectible spacing logic.
- `getHazardVisualGeometry` returns `y: 0` and `height: RUNNER_GROUND_Y` for overhead artwork; for ground hazards it returns `getHazardGeometry(hazard, x)` unchanged.
- Set `SLIDE_CLEARANCE_PX = 54` in the overhead visual renderer, matching the existing obstacle lower edge at y=416 and ground at y=470. Draw the visible themed blocker through `visualHeight - SLIDE_CLEARANCE_PX`; leave the lower 54px open. Keep the existing six-pixel safety clearance between the blocker's lower edge and the sliding pose top.
- Build every themed overhead silhouette from the biome palette and within `0 <= x <= definition.width`, `0 <= y <= visualHeight`. Use multiple recognizable details rather than one flat rectangle. Ground hazard branches remain untouched.
- `ObstacleSpawner.spawn` calls `drawRunnerHazard(art, definition, biome, visualGeometry.height)` and positions `art` at `visualGeometry.x/y`. Its Arcade box continues to use `getHazardCollisionGeometry`.
- Keep tutorial label attached to the existing overhead hazard edge from `getHazardGeometry`, not at the top edge of the new tall art.

### I02. Fade a safely passed overhead blocker
- Related Files:
  - `src/game/runner/ObstacleSpawner.ts` :: `ActiveHazard`, `ObstacleSpawner.spawn`, new `fadePassedHazard` —prevent repeated overlaps, disable only the collider, then fade art before cleanup; modify.
  - `src/game/runner/ObstacleSpawner.test.ts` :: `consumes an overhead hazard as a safe pass only during grounded sliding` —assert the collider is disabled once, art remains until fade completion, and cleanup happens after the tween; modify.

#### Details
- Add `passed: boolean` to `ActiveHazard`, initialized to `false`.
- In the overlap callback, return immediately if `hazard.passed` is already true. For a grounded slide dodge, set `passed = true`, set the Arcade body's `enable` to `false`, and start a 180ms `Cubic.Out` alpha fade on `hazard.art`; destroy the hazard from the tween's completion callback. Do not call `onOverlap` on this path.
- For a real hit, retain current behavior: call `onOverlap` and remove the hazard immediately. `destroy()` must still clean active hazards even if their fade is incomplete.
- Mock `scene.tweens.add` in `ObstacleSpawner.test.ts` and capture the completion callback to verify lifecycle without real-time waits.

### I03. Remove the giant circle without changing giant mode
- Related Files:
  - `src/game/runner/RunnerScene.ts` :: `update`, `drawPassiveEffect` —remove the giant-mode argument and circle/spark drawing only; keep Hiyori and Toa branches; modify.
  - `src/game/runner/RunnerGiantEffect.test.ts` :: giant effect regression coverage —verify giant-only state does not draw circle/ellipse/outline primitives; new.
  - `src/game/runner/RunnerPlayer.ts` :: `setGiant`, `applyPose` —read-only; verify size and action animations are unchanged.

#### Details
- Change `drawPassiveEffect(remainingMs: number, slideGuardRemainingMs: number, giantRemainingMs: number)` to `drawPassiveEffect(remainingMs: number, slideGuardRemainingMs: number)` and update its sole call in `RunnerScene.update`.
- Remove only the `giantRemainingMs > 0` block that draws an accent-colored circle and spark marks. Do not clear or tint giant sprite state in `RunnerPlayer`; `setGiant` must keep its existing 1.35 scale and animation pose selection.
- New regression test calls the scene method with a giant-only snapshot and asserts the graphics mock's `fillCircle`, `strokeCircle`, `fillEllipse`, and `lineBetween` are unused. The same test confirms existing passive effects are not reclassified as giant effects; existing passive tests remain authoritative.

## Acceptance Criteria
- [x] Overhead art visibly fills the jump-blocking region, has a theme-specific silhouette, and leaves only the existing slide-height opening.
- [x] Overhead collision size and slide-only dodge remain unchanged; ground collision/art and collectible clearance remain unchanged.
- [x] On safe slide pass, the obstacle collider disables once and art fades for 180ms before removal; hits still remove and damage immediately.
- [x] Giant mode no longer draws a circle or spark aura; the enlarged character, timer, jump, double-jump, slide, and hurt animations continue unchanged.
- [x] Existing unrelated changes in `RunnerScene.ts` and its tests remain unstaged/uncommitted.

## Validation
- `npm test -- src/game/visuals/runnerHazards.test.ts src/game/runner/CollisionSystem.test.ts src/game/runner/ObstacleSpawner.test.ts src/game/runner/RunnerGiantEffect.test.ts`
- `npm run typecheck`
- `npm run build`
- Browser check: all four Story themes, grounded-slide pass animation, non-slide collision, and giant run/jump/slide pose; manual inspection still required if browser automation is unavailable.

## Commit Message
```text
fix(game): clarify slide-only hazard visuals

Plan: 2026-11-02-slide-hazard-readability-giant-aura-removal
Phase: P01-runner-obstacle-feedback
Task: T01-overhead-hazards-and-giant-effect

- Match themed overhead art to the slide-only collision lane
- Fade safe slide passes and remove giant circle aura
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: d125b34



