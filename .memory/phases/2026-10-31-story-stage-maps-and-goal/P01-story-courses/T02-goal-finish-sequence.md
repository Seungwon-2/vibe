# Task: T02 Goal Finish Sequence

## Status: done

## Goal

Show a thematic goal arch, finish stripe, and `GOAL` at each Story endpoint, then play a brief victory pose before entering Story results.

## Decision Summary

- Goal art is visual-only and located at the exact stage length.
- Simulation stops at the existing stage-completion distance; display the victory animation for approximately 800ms before result notification.
- Failure, pit fall, Endless timeout, result rewards, and wallet settlement remain unchanged.

## Implementation

### I01. Render the stage-specific goal marker

- Related Files:
  - `src/game/visuals/runnerCourseObjects.ts` :: add `drawRunnerGoal`; modify
  - `src/game/runner/CollectibleSpawner.ts` :: goal marker lifecycle and positioning; modify
  - `src/game/runner/RunnerScene.ts` :: pass Story stage data to the course spawner; modify

#### Details

- Add `drawRunnerGoal(graphics, biome)` with a distinct silhouette/accent treatment for each of the four biome IDs. Include an arch, a visible ground finish stripe, and a central readable sign shape. Keep it visual only; do not add Arcade bodies.
- Create the marker when `lengthMeters <= snapshot.distanceMeters + visibleLead` and keep it at the x coordinate mapped from the exact stage endpoint. Remove the old goal display when it passes offscreen only for non-terminal/retry cleanup; scene shutdown destroys all goal art.
- Add a `GOAL` text label above the arch, using the stage palette for contrast. Do not render a goal marker during Endless runs.
- Keep the final 180m hazard-free as established in T01.

### I02. Hold the victory pose before showing Story results

- Related Files:
  - `src/game/runner/RunnerScene.ts` :: stage-complete branch and finish timer lifecycle; modify
  - `src/game/runner/RunnerEvents.ts` / `src/game/runner/runnerEvents.ts` :: only if event timing API needs a narrow change; inspect first

#### Details

- On `result.finishReason === 'stage-complete'`, stop simulation and input progression at the exact endpoint. Mark finish as pending to prevent duplicate result emissions.
- Call `player.finish('victory')` immediately and schedule final result emission after `800ms` using a Phaser `TimerEvent` (or scene time delayed call) so scene cleanup cancels it.
- Add a completion-delay guard to `emitFinished` so the victory animation is not restarted when the delayed event fires. All non-Story-complete finishes use the existing immediate path.
- On shutdown/destroy, remove the completion timer. Never delay coin settlement or alter the result distance; settlement still occurs when the result event is emitted.

## Acceptance Criteria

- [x] Each Story endpoint visibly has a theme-matched arch, finish stripe, and `GOAL` label.
- [x] Story simulation stops at the finish distance, shows victory pose for about 800ms, then opens the existing clear result screen.
- [x] No goal marker appears in Endless, and failure finish timing is unchanged.

## Validation

- `npm run typecheck`
- `npm run build`
- Automated test commands are omitted for this task.

Results: typecheck passed; production build passed. Vite reported its existing large JavaScript chunk advisory.

## Follow-up Runtime Fix (2026-10-31)

- Fixed a blank startup caused by route validation throwing during `storyCourses` module import. The explicit `validateStoryCourses()` check now runs only when requested, not while the app boots.
- Removed three late hazards that overlapped pit safety zones in the Moonlit Forest, Crystal Mine, and Cloud Skyway routes.
- Rechecked all authored routes with the explicit validator, confirmed the local browser rendered the title menu, and reran typecheck/build successfully.

## Commit Message

```text
feat(story): add clear goal finish sequence

Plan: 2026-10-31-story-stage-maps-and-goal
Phase: P01-story-courses
Task: T02-goal-finish-sequence

- Render biome-themed finish arch and GOAL marker
- Show the victory pose before Story results
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: `d3241ea`
