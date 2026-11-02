# Task: T04 Story Course Density

## Status: pending

## Goal
Reduce long empty stretches in the four fixed Story courses with additional themed hazards and short action combinations, and make Endless intervals tighten as distance increases while preserving readable recovery windows.

## Decision Summary
- Add authored hazards to Story schedules and tune Endless wave spacing/recovery to progressively tighten through central configuration.
- Keep at least 220m between consecutive Story hazards and maintain pit/milestone clearance.
- Preserve course lengths, existing double-jump walls, pits, stage unlocks, and pickup mechanics.

## Implementation

### I01. Fill eligible Story route gaps with authored patterns
- Related Files:
  - `src/game/runner/storyCourses.ts` :: `STORY_COURSES`, `validateStoryCourses`; modify.
  - `src/game/runner/storyPitSchedule.ts` :: fixed pit locations; read-only.
  - `src/game/runner/storyConfig.ts` :: course lengths; read-only.
  - `src/game/runner/runnerConfig.ts` :: Endless spacing and recovery tuning values; modify.
  - `src/game/runner/hazardPatterns.ts` :: `getDenseWaveSchedule`; modify to select progressively tighter intervals by wave progression.
  - `src/game/runner/PitSpawner.ts` :: bound wide-pit schedule search to the requested horizon; modify.
  - `src/game/runner/CollectibleSpawner.ts` :: place elevated post-jump coin rows in a nearby safe slot; modify.
  - `src/game/runner/hazardTypes.ts` :: hazard kinds; read-only.
- Details:
  - Preserve the existing four themes and their fixed hazard identities. Add single hazards or two-/three-action patterns only in route gaps that remain outside pit and milestone clearances.
  - Use sequences of 2–3 hazards with 220–320m gaps, followed by a 400–550m recovery where the remaining course length and safety zones allow. Do not force a placement into a pit, 2,000m milestone, goal approach, or stage boundary clearance zone.
  - Keep each Story stage's existing double-jump barrier as its 2-action skill check; do not add a second consecutive high barrier without an explicit recovery corridor.
  - Run `validateStoryCourses()` after the authored changes. If spacing validation rejects a planned hazard, revise the authored positions instead of weakening collision or clearance rules.
  - For Endless, start at 300m between patterns and 550m recovery; every two waves reduce these by 20m and 60m respectively, with floors at 230m and 350m. Every fourth wave keeps a 650m recovery corridor so the existing wide-pit mechanic still has a legal placement. Keep the values in `RUNNER_CONFIG`, wave pattern counts, and gate rewards unchanged.
  - Bound wide-pit searching at the requested distance horizon so a dense course with no legal future corridor cannot loop indefinitely.
  - Set post-jump coin rows to an elevated route and search nearby positions in 5m increments within 75m; omit rows with no safe location. Keep row count and spacing configurable.

### I02. Add Story pacing and safety assertions
- Related Files:
  - `src/game/runner/pitChallengeSchedule.test.ts` :: Story hazard schedule assertions; modify.
  - `src/game/runner/CollectibleSpawner.test.ts` :: Story pickup clearance and safe elevated rows after route changes; modify.
  - `src/game/runner/hazardPatterns.test.ts` :: progression-tier spacing and recovery checks; modify.
- Details:
  - Assert all Story schedules still pass `validateStoryCourses` and include the required double-jump wall and fixed pits.
  - Assert each stage has at least one authored 2-action sequence where safe clearances permit, and a recovery gap after the sequence.
  - Assert no Story hazard overlaps pit or milestone clearance and every Story pickup remains safe after schedule changes.
  - Assert Endless wave intervals are monotonic by progression tier, remain above the explicitly configured minimum, and that the existing speed ramp and gate rewards remain intact.

## Acceptance Criteria
- [x] Story routes have more varied, denser authored hazard rhythms with explicit recovery spaces.
- [x] All Story hazards, pickups, gates, pits, and goals preserve validated clearance.
- [x] Endless obstacle/recovery intervals tighten progressively and remain centrally tunable.
- [x] Story mode rules, rewards, lengths, and character abilities remain unchanged.

## Validation
- Validation: focused runner tests passed (21 tests).
- Validation: `npm run typecheck` passed.
- Validation: `npm run build` passed; Vite emitted a large JavaScript chunk advisory.

## Commit Message
```text
feat(game): add more varied story hazard rhythms

Plan: 2026-11-02-runner-gameplay-review
Phase: P01-gameplay-systems
Task: T04-story-course-density

- Add short themed Story hazard sequences and recovery gaps
- Validate Story clearance and progressive Endless pacing
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: b548b77
