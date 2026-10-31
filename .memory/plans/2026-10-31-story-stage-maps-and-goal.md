# Plan: Story Stage Maps and Goal Finish

## Goal

Make each Story stage feel like a distinct, self-contained course. Lock its biome for the full run, author deterministic stage-specific obstacle routes, retain non-rewarding landmarks, and clearly mark and celebrate the finish point.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | done | Author fixed Story courses and provide a visible, celebratory goal finish. | [P01](../phases/2026-10-31-story-stage-maps-and-goal/P01-story-courses/phase.md) |

## Status

- Complete: both planned tasks are implemented and build validation passed.
- Follow-up: play all four Story courses locally and tune difficulty from observed play before Azure deployment.

## Confirmed Rules

- Keep the existing four stage IDs, themes, lengths, lives, pickup behavior, unlocks, and Endless mode behavior.
- During Story runs, use the selected stage's biome from start to finish. Story gates remain route landmarks only; they do not change background, grant time, or increase speed.
- Give each Story stage a deterministic obstacle sequence with stage-specific order and spacing. Keep safe reaction and recovery gaps, and avoid overlap with pickups, pits, milestones, and goal art.
- Draw a theme-specific goal arch, finish stripe, and `GOAL` label at exactly `lengthMeters`.
- Stop distance progression at the course endpoint; play the victory animation for approximately 800ms before emitting the Story result. Failure flows remain immediate and unchanged.
- Keep all work on `project02`. Preserve unrelated and pre-existing working-tree changes.

## Deferred

- Retune course difficulty after the user has played all four Story stages.
- Azure deployment and account persistence remain out of scope.
