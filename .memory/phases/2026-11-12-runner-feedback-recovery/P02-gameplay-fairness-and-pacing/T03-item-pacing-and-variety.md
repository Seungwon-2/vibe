# Task: T03 Item Pacing and Course Variety

## Status: done

## Goal
Make Endless and Story runs engaging without allowing repeated speed/giant pickups to overlap their active windows, and reduce hazard-pattern repetition while preserving recovery time.

## Decision Summary
- Keep existing item types, safe routes, Mary magnet behavior, and fixed Story course layouts.
- Do not add items or blindly increase density; use deterministic spacing and pattern variation.
- Story gates are landmarks only and do not accelerate the course.

## Implementation
- `src/game/runner/CollectibleSpawner.ts`
  - Compute speed/giant separation from the active effect window, the maximum pickup-search radius, and configured recovery distance.
  - Integrate gate speed bonuses in Endless; use fixed Story course speed because Story gates do not accelerate.
  - Enforce the spacing rule in Story as well as Endless, considering previously scheduled speed and giant items.
- `src/game/runner/CollectibleSpawner.test.ts`
  - Cover Story high-impact-item separation, pickup availability for every 1km tier through 50km, deterministic schedules, and existing pit/gate clearances.
- `src/game/runner/hazardPatterns.ts`
  - Keep one double-jump pattern per four eligible waves, rotating its slot deterministically through `[0, 1, 2, 1]`.
- `src/game/runner/hazardPatterns.test.ts`
  - Verify slot rotation and preserve the configured minimum spacing between patterns.

## Validation
- `npm run test -- --run src/game/runner/CollectibleSpawner.test.ts src/game/runner/hazardPatterns.test.ts src/game/runner/PitSpawner.test.ts` — 39 tests passed.
- `npm run typecheck` — passed.
- Deterministic 0–50,000m audit:
  - Each 5km tier contains 71–95 coins; pickup schedule has no empty 1km tier.
  - Each 5km tier contains one or two giant/speed pickups; consecutive power-ups in the same tier are at least 1,801m apart where both occur.
  - 150 hazard patterns: 70 ground, 68 overhead, 12 double-jump. Pattern gaps range from 253m to 928m, with the wide-pit recovery interval included.
  - Late hazard and pickup generation remains present through 50km.
- Temporary audit test file was removed after collecting the report.

## Progress
- [x] Implementation complete
- [x] Validation passed
- [x] Audit recorded
- commit: included in Git history for this task

## Commit Message
```text
fix(game): tune boost pacing and vary runner courses

Plan: 2026-11-12-runner-feedback-recovery
Phase: P02-gameplay-fairness-and-pacing
Task: T03-item-pacing-and-variety

- Separate high-impact pickups by their active windows
- Add fair pattern variety with measured recovery gaps
```
