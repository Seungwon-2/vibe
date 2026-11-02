# Task: T02 Story First Course Pacing

## Status: done

## Goal
Place the first Story course's double-jump wall in the latter half of its 2,500m course and retime neighboring hazards so the introduction respects hazard, milestone, pit, and goal spacing.

## Decision Summary
- Set the first wall at or after 1,300m.
- Retiming neighboring Story Stage 1 hazards is allowed and expected; keep the 2,000m milestone and 2,300m wide pit clear.
- Preserve all other Story course schedules unless required by shared validation.

## Implementation

### I01. Retune the Dawn City Stage 1 hazard schedule
- Related Files:
  - `src/game/runner/storyCourses.ts` :: `STORY_COURSES`, `validateStoryCourses`; modify.
  - `src/game/runner/storyConfig.ts` :: Dawn City course length; read-only (2,500m).
  - `src/game/runner/storyPitSchedule.ts` :: Dawn City pit positions; read-only (850m and 2,300m).
  - `src/game/runner/runnerConfig.ts` :: `gateClearanceMeters`, pit clearance; read-only.
- Details:
  - Move `dawn-wall-01` from 1,100m to a late-half position at or beyond 1,300m.
  - Move neighboring Stage 1 hazards as needed so successive damaging hazards are at least 220m apart, as required by `validateStoryCourses`.
  - Do not place any hazard inside `RUNNER_CONFIG.pitHazardClearanceMeters` plus both object half widths from either Stage 1 pit. Keep the 2,000m milestone clear using `isGateClearance`'s object half-width rule.
  - Keep the wide pit at 2,300m and ensure the final damaging hazard leaves the existing pit and goal approach clear.
  - Do not change pickup contents in this task; T01 owns pickup recalculation and clearance.

### I02. Add schedule assertions
- Related Files:
  - `src/game/runner/pitChallengeSchedule.test.ts` :: Story barrier placement assertions; modify.
  - `src/game/runner/storyCourses.ts` :: `validateStoryCourses`, `getStoryHazardSchedule`; read-only.
- Details:
  - Assert Dawn City's double-jump wall is in the latter half (`distanceMeters >= stage.lengthMeters / 2`) and no later than `stage.lengthMeters - 500`.
  - Run `validateStoryCourses()` and assert the moved schedule keeps 220m hazard spacing, pit clearance, and milestone clearance.

## Acceptance Criteria
- [x] Dawn City's wall is placed in the latter half and remains reachable by a correctly timed double jump.
- [x] Neighboring hazards respect the 220m minimum and milestone/pit safe zones.
- [ ] Story stages 2–4 remain unchanged.

## Validation
- `npm test -- src/game/runner/pitChallengeSchedule.test.ts -t "Dawn City|fixed wide pit"` — passed (2 tests).
- `npm run typecheck` — passed.

## Commit Message
```text
fix(game): introduce story double jump in the late course

Plan: 2026-11-02-runner-gameplay-review
Phase: P01-gameplay-systems
Task: T02-story-first-course-pacing

- Retiming the first course wall and neighboring hazards
- Validate milestone and pit clearances
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
