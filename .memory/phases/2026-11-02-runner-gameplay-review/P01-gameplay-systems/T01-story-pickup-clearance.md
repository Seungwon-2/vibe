# Task: T01 Story Pickup Clearance

## Status: done

## Goal
Ensure every Story coin, time boost, and giant pickup is scheduled outside that Story stage's pit openings and safety margins, while preserving current Endless pickup behavior.

## Decision Summary
- Story schedules use `getStoryPitDefinitions(stageId, horizon)`; Endless schedules continue to use `getPitDefinitions(horizon)`.
- Keep current pickup spacing, collision-size margins, hazard and milestone clearance, nearest-safe search, and omit-if-no-safe-slot behavior.
- Cover regular pickups, optional post-jump coin rows, and giant pickups with the same mode-specific pit list.

## Implementation

### I01. Make pickup clearance consume a mode-specific pit schedule
- Related Files:
  - `src/game/runner/CollectibleSpawner.ts` :: `isPickupDistanceSafe`, `nearestSafeDistance`, `generatePickupSchedule`; modify.
  - `src/game/runner/storyPitSchedule.ts` :: `getStoryPitDefinitions`; read-only.
  - `src/game/runner/PitSpawner.ts` :: `getPitDefinitions`, `isPitClearance`; read-only.
- Details:
  - Add a local helper or equivalent typed logic in `CollectibleSpawner.ts` that returns `getStoryPitDefinitions(storyStageId, horizonMeters)` when `storyStageId !== null`, otherwise `getPitDefinitions(horizonMeters)`.
  - `isPickupDistanceSafe` must receive the resolved `readonly PitDefinition[]` instead of re-enumerating Endless pits internally. Keep `PICKUP_PIT_CLEARANCE_METERS` and pickup-body radius expansion in its clearance calculation.
  - `generatePickupSchedule(maxDistanceMeters, storyStageId)` must build one horizon and one pit list and pass that same list to regular safe-route placement, optional coin rows, and giant candidates.
  - Do not include Story pits beyond the selected stage length; `getStoryPitDefinitions` already enforces stage length. Preserve Story milestone collision checks and existing Endless five-gate behavior.
  - Retain nearest candidate ordering and fallback: search inside the existing local slot; if no safe position exists, omit the pickup rather than place it in unsafe space.

### I02. Add Story schedule regression coverage
- Related Files:
  - `src/game/runner/CollectibleSpawner.test.ts` :: Story pickup schedule tests; modify.
  - `src/game/runner/storyPitSchedule.ts` :: `getStoryPitDefinitions`; read-only.
- Details:
  - For all four `STORY_STAGES`, call `generatePickupSchedule(stage.lengthMeters, stage.id)` and assert every generated pickup kind is outside every stage pit with `PICKUP_PIT_CLEARANCE_METERS` plus its visual/body margin.
  - Include safe-route, optional coin, and giant pickup kinds in the assertion; an absent kind is allowed when no valid slot exists.
  - Assert that Story pickups remain sorted, have unique IDs, and stay within the stage length.
  - Keep the existing Endless schedule tests unchanged in expected behavior.

## Acceptance Criteria
- [x] Story pickups never overlap the narrow or wide pit clearance region for their own stage.
- [x] Endless pickup positions and cadence remain unchanged.
- [x] Unsafe Story slots are relocated only within the existing search rules or omitted.

## Validation
- `npm test -- src/game/runner/CollectibleSpawner.test.ts src/game/runner/pitChallengeSchedule.test.ts -t "fixed pits|five milestone gates|story"` — passed (2 tests).
- `npm run typecheck` — passed.
- The full focused suite currently has three unrelated baseline expectation failures: no optional Endless coin rows are emitted, and two assertions still assume the older giant-wave cadence/optional-row behavior. Endless generation is unchanged in this task.

## Commit Message
```text
fix(game): keep story pickups clear of stage pits

Plan: 2026-11-02-runner-gameplay-review
Phase: P01-gameplay-systems
Task: T01-story-pickup-clearance

- Use each Story stage's fixed pit schedule for pickup safety
- Cover all pickup types with schedule regression tests
```

## Progress
- [x] Implementation complete
- [x] Scoped validation passed
- commit: pending
