# Task: T01 Authored Story Courses

## Status: done

## Goal

For each existing Story stage, keep the stage's biome fixed and run a deterministic authored obstacle sequence that differs from the other stages, while retaining safe spacing and non-rewarding milestone gates.

## Decision Summary

- Use the stage ID as the source for both the Story backdrop biome and the hazard schedule.
- Keep stage lengths and all Endless schedules unchanged.
- Story landmarks do not transition the biome or grant time/speed; their label reports stage progress rather than `+20s`.

## Implementation

### I01. Define deterministic stage-specific hazard routes

- Related Files:
  - `src/game/runner/storyCourses.ts` :: stage route data and lookup API; new
  - `src/game/runner/storyConfig.ts` :: expose Story stage biome/length lookup; read-only unless required for type alignment
  - `src/game/runner/hazardTypes.ts` :: reuse `HazardKind`, `HazardDefinition`; read-only
  - `src/game/runner/ObstacleSpawner.ts` :: select authored route for Story mode, keep Endless procedural route; modify

#### Details

- Define:
  ```ts
  export type StoryHazardPlacement = Readonly<{
    id: string;
    distanceMeters: number;
    kind: HazardKind;
    offsetMeters?: number;
  }>;
  export function getStoryHazardSchedule(stageId: StoryStageId): readonly StoryHazardPlacement[];
  ```
- Provide a fixed ordered schedule for `dawn-city`, `moonlit-forest`, `crystal-mine`, and `cloud-skyway`. Each schedule must contain both ground and overhead actions, vary its ordering/spacing by stage, and end before `lengthMeters`.
- First tutorial hazards stay simple and readable. Authored placements use the existing `HazardDefinition` dimensions and art; no collision dimensions are changed.
- Validate schedule data at module initialization or in a pure helper: every distance is finite, positive, less than stage length, monotonically ordered, and has at least 220m separation from the previous hazard; its full footprint must not overlap the story milestone clearance or a pit clearance. Keep the goal approach free of hazards for the final 180m.
- `ObstacleSpawner.update(snapshot)` uses the route for `snapshot.storyStageId` only when `snapshot.mode === 'story'`; it spawns only entries inside the existing visible lead. Endless continues to use `getPatternStartDistance` and existing gate/pit filtering.
- Avoid duplicate spawns after pause/resume by using the current next-index/pending lifecycle. Destroy removes active and pending Story hazards as before.

### I02. Lock backdrop and landmark presentation in Story

- Related Files:
  - `src/game/visuals/RunnerBackdrop.ts` :: `RunnerBackdrop` constructor and `update`; modify
  - `src/game/visuals/runnerBiomes.ts` :: `getBiomeForDistance`; do not change Endless mapping
  - `src/game/runner/CollectibleSpawner.ts` :: Story landmark label and route biome lookup; modify
  - `src/game/runner/runnerConfig.ts` :: milestone constants; read-only

#### Details

- Pass `storyStageId` to `RunnerBackdrop` at scene creation. In Story mode resolve the biome by `getStoryStage(storyStageId).biomeId` for the entire run; in Endless mode keep `getBiomeForDistance(snapshot.distanceMeters)` and its crossfade behavior.
- Story pickups use the stage biome for their art, not the biome that Endless would select at the same local distance.
- Story milestone gates remain decorative and non-colliding. Their label must not claim a time bonus; display the selected stage name and the milestone distance. Do not change Endless gate bonuses, labels, or visuals.

## Acceptance Criteria

- [x] Four Story stages retain their own biome throughout the run and each has a distinct fixed obstacle sequence.
- [x] Story milestone gates neither change the biome nor imply/grant time or speed rewards.
- [x] Endless backdrop transitions, procedural obstacle routes, and gate rewards are unchanged.
- [x] Authored hazards respect recovery spacing and do not overlap pit, milestone, or finish-clearance zones; pickup scheduling continues to use existing geometry-based filtering.

## Validation

- `npm run typecheck` — passed
- `npm run build` — passed (Vite reports existing large-chunk advisory)
- Automated test commands are omitted for this task.

## Commit Message

```text
feat(story): author distinct stage courses

Plan: 2026-10-31-story-stage-maps-and-goal
Phase: P01-story-courses
Task: T01-authored-story-courses

- Lock biome presentation to the selected Story stage
- Add deterministic stage-specific obstacle schedules
- Keep Story milestones non-rewarding and clearly labeled
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: `feat(story): author distinct stage courses`
