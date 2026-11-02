# Task: T03 Mode-Specific Giant Pickups

## Status: pending

## Goal
Keep Endless giant items tied to Endless dense waves and generate Story giant items only when an authored obstacle group is actually covered by the six-second effect.

## Decision Summary
- Endless uses the existing deterministic `getDenseWaveSchedule` placement and six-second coverage rule.
- Story uses each stage's fixed hazard schedule and fixed pits; never use Endless wave positions as its targets.
- Every candidate remains subject to collision/art clearance, stage bounds, milestone, pit, and other-pickup separation.

## Implementation

### I01. Derive Story giant pickup candidates from authored hazards
- Related Files:
  - `src/game/runner/CollectibleSpawner.ts` :: `generatePickupSchedule`, giant candidate loop; modify.
  - `src/game/runner/storyCourses.ts` :: `getStoryHazardSchedule`; read-only.
  - `src/game/runner/storyConfig.ts` :: stage lengths and IDs; read-only.
  - `src/game/runner/runnerConfig.ts` :: `giantDurationMs`, `giantPickupLeadMeters`, `giantPickupSearchRadiusMeters`, speed ceiling; read-only unless a central adjustment is required.
- Details:
  - Branch giant target creation on `storyStageId`. Endless retains the existing wave loop and deterministic outputs.
  - For Story, identify authored hazard groups in distance order. A group includes consecutive hazards with center-to-center gaps no greater than 350m; a candidate must precede the first hazard and its travel duration to the last hazard must be no greater than `giantDurationMs` at the maximum effective mode speed.
  - Reuse the existing pickup candidate search around the group's first hazard minus `giantPickupLeadMeters`; reject candidates outside the stage, overlapping a hazard visually or physically, inside the Story pit clearance, within milestone clearance, or within 30m of another pickup.
  - Do not create a Story giant when the course contains no qualifying group. Do not alter giant effect duration, collision behavior, or animation.
  - Ensure Story safety calls use the stage pit list established in T01; do not regress Endless pickup schedule identity or placement.

### I02. Verify per-mode giant schedules
- Related Files:
  - `src/game/runner/CollectibleSpawner.test.ts` :: Story and Endless giant schedule tests; modify.
  - `src/game/runner/storyCourses.ts` :: fixed challenge groups; read-only.
- Details:
  - Assert Endless giants remain deterministic and linked to dense waves with six-second coverage.
  - For each Story stage, assert any generated giant is tied to an authored hazard group, precedes it, is within six-second coverage, and avoids that stage's hazards/pits/milestones.
  - Assert no Story giant is emitted if that stage has no qualifying group.

## Acceptance Criteria
- [ ] Story giant items are tied to actual authored challenges and can cover the targeted group.
- [ ] Story giants do not overlap stage pits, hazards, milestones, or other pickups.
- [ ] Endless giant placements and six-second duration are unchanged.

## Validation
- `npm test -- src/game/runner/CollectibleSpawner.test.ts src/game/runner/pitChallengeSchedule.test.ts`
- `npm run typecheck`

## Commit Message
```text
fix(game): align giant pickups with each mode's challenges

Plan: 2026-11-02-runner-gameplay-review
Phase: P01-gameplay-systems
Task: T03-mode-specific-giant-pickups

- Keep Endless giants paired with dense waves
- Pair Story giants with authored hazard groups
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
