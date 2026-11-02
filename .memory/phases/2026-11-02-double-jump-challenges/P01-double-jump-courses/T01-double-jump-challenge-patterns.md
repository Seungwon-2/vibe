# Task: T01 Double-Jump Challenge Patterns

## Status: done

## Goal
Add fair, readable high barriers and wide pits that require two jumps in Endless and Story modes, guide the first encounter once, and keep safely passed overhead hazard art visible until it scrolls out of view.

## Decision Summary
- Introduce barriers in Endless dense waves after 2,000m and wide pits from 8,600m; add barriers and one wide pit to each Story course, beginning in Stage 1's latter half.
- A high barrier occupies the ground up to a height beyond the one-jump ceiling but below a well-timed double-jump ceiling. A wide pit is wider than the single-jump travel range and fits inside a well-timed double-jump flight.
- Display first-run-only instruction at the first high barrier and wide pit; preserve current Hiyori pit rescue and fatal pit behavior.
- A safe slide pass disables the hazard collider, but its art keeps scrolling and is removed only after it exits the viewport.

## Implementation

### I01. Add a third hazard kind with double-jump geometry and themed art
- Related Files:
  - `src/game/runner/hazardTypes.ts` :: `HazardKind`, `HazardDefinition`; modify.
  - `src/game/runner/runnerConfig.ts` :: jump impulse, gravity, high-barrier dimensions, and challenge cadence; modify.
  - `src/game/runner/createRunnerGameConfig.ts` :: Arcade gravity; modify/read-only to consume centralized gravity.
  - `src/game/runner/RunnerPlayer.ts` :: jump impulses; modify to consume centralized impulse values without changing action timing.
  - `src/game/runner/CollisionSystem.ts` :: `getHazardGeometry`, `getHazardCollisionGeometry`, `isHazardDodgedBySlide`; modify.
  - `src/game/visuals/runnerHazards.ts` :: `drawRunnerHazard`; modify with four biome-specific tall barrier silhouettes.
  - `src/game/runner/ObstacleSpawner.ts` :: art, hitbox, and first-run warning positioning; modify.
  - `src/game/runner/CollisionSystem.test.ts`, `src/game/visuals/runnerHazards.test.ts`, `src/game/runner/ObstacleSpawner.test.ts`; modify.
- Details:
  - Add `double-jump` to `HazardKind`. Use width 64px and a central config height of 156px. Its collision geometry is `{x, y: RUNNER_GROUND_Y - 156, width: 64, height: 156}`. Existing `ground` and `overhead` dimensions stay unchanged.
  - Centralize `gravityY: 900` and `jumpImpulseY: -420` in `RUNNER_CONFIG`; have the Arcade config and `RunnerPlayer.jump()` read these values. Rang's existing double-jump multiplier remains applied to only the second jump.
  - Keep overhead as full-lane collision with grounded-slide-only dodge. A `double-jump` barrier is an ordinary damaging hazard until the runner's physics body rises completely above its top. Sliding does not bypass it.
  - In Endless, use a deterministic subset of dense patterns for `double-jump` starting after 2,000m. Use the existing 250–350m slot spacing and 500–600m recovery cadence; don't alter the tutorial or practice band.
  - In Story, add one double-jump barrier in each fixed course. Stage 1's first is at 1,100m; later course barriers use their authored fixed distances and are clearance-checked against the course hazards and wide pit.
  - Draw the new barrier separately from collision geometry: city barricade tower, forest thorn trunk, mine crystal column, and cloud updraft pillar. Make each silhouette clearly run from floor to its configured top. Keep graphics within its declared art bounds.
  - The first-run `ObstacleSpawner` warning for this kind reads `DOUBLE JUMP`; show once through the existing `tutorialEnabled` and `warnedKinds` logic. Position it above the barrier top. Later runs have no label.

### I02. Add wide pit schedules and a one-time challenge hint
- Related Files:
  - `src/game/runner/pitTypes.ts` :: `PitDefinition`; modify only if schedule metadata is necessary.
  - `src/game/runner/runnerConfig.ts` :: wide pit width and Endless interval; modify.
  - `src/game/runner/PitSpawner.ts` :: `getPitDefinitions`, `PitSpawner` constructor, `spawn`, `update`; modify.
  - `src/game/runner/RunnerScene.ts` :: `PitSpawner` construction; pass the existing first-run `runnerTutorialEnabled` registry setting; modify.
  - `src/game/runner/storyCourses.ts` or a new `src/game/runner/storyPitSchedule.ts` :: fixed Story pit positions and spacing validation; modify/new.
  - `src/game/runner/PitSpawner.test.ts`, `src/game/runner/pitChallengeSchedule.test.ts`; modify.
  - `src/game/runner/storyPitSchedule.ts`; add fixed Story pit schedules and boundary validation.
- Details:
  - Keep the existing 30m regular pit schedule and its 850m first-pit warning. Add 150m Endless gaps on a deterministic 6,000m cadence, first at 8,600m after clearance checks. In Story, author one 130m wide gap per stage, with Stage 1 at 2,300m and later stages at 2,600m.
  - Define each pit with its absolute center distance and width. For Story, schedule against `storyStageId` and stage-local distance; do not accidentally spawn Endless-only repeats in a completed stage.
  - Place both hazard kinds using actual widths/heights. Add validation that each wide pit has the configured clearance from hazards, gates, the goal, and other pits. Preserve the existing 200m obstacle clearance policy plus each object's half-width.
  - Preserve the current floor-opening fall detection and Hiyori rescue path. A missed wide pit is fatal under the existing rules.
  - A first-run warning for the first wide pit reads `DOUBLE JUMP`; later wide pits and repeat runs have no label. Use the already captured browser first-run tutorial flag.
  - Keep the themed pit art anchored through falling and shake until the result screen, as established by the prior pit-visual fix.

### I03. Make a safe slide pass scroll out naturally
- Related Files:
  - `src/game/runner/ObstacleSpawner.ts` :: active hazard overlap and `update`; modify.
  - `src/game/runner/ObstacleSpawner.test.ts` :: safe slide pass tests; modify.
- Details:
  - On a valid slide overlap, set a `passed` guard and disable `hazard.box.body.enable`; do not tween alpha and do not call `remove` from the overlap callback.
  - Continue updating the hazard art position with the course. The disabled collider stays in active cleanup tracking. Remove the art and collider only when `geometry.x + geometry.width < 0` or scene destruction.
  - Repeated overlap callbacks after `passed` do nothing. A real collision still calls `onOverlap` once and removes the hazard immediately as before.

## Acceptance Criteria
- [x] Single jump cannot clear the high barrier or wide pit at configured speeds; a properly timed double jump can.
- [x] Endless challenges begin after 2,000m; each Story stage has a fixed themed challenge position and safe goal/obstacle spacing.
- [x] First-run guidance appears once for a high barrier and once for a wide pit; it does not recur on later runs.
- [x] Successful slide artwork remains visible while scrolling past and is removed only after leaving the screen; no fade is applied only to slide hazards.
- [x] Existing ground/overhead collision, slide-only clearance, pit death/rescue, time, gates, and collectibles remain correct.
- [ ] Unrelated pre-existing working-tree edits remain unstaged.

## Validation
- `npm test -- src/game/runner/CollisionSystem.test.ts src/game/runner/ObstacleSpawner.test.ts src/game/runner/PitSpawner.test.ts src/game/runner/RunnerScene.test.ts src/game/runner/hazardPatterns.test.ts src/game/runner/pitChallengeSchedule.test.ts src/game/visuals/runnerHazards.test.ts`
- `npm run typecheck`
- `npm run build`
- Manually check first-run instructions, high-barrier and wide-pit double-jump clearance, single-jump failure, slide art exit, each Story stage, and both characters with relevant passives.

## Commit Message
```text
feat(game): add double-jump challenge courses

Plan: 2026-11-02-double-jump-challenges
Phase: P01-double-jump-courses
Task: T01-double-jump-challenge-patterns

- Add double-jump-only barriers and wide pits to both modes
- Show one-time guidance and align safe-slide cleanup
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

## Validation Results
- Focused Vitest suite: 7 files, 37 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; Vite reports the existing large JavaScript chunk advisory.
