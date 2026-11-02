# Plan: Double-Jump Challenge Obstacles

## Goal
Give double jump a clear gameplay purpose by adding tall barriers and wide pits whose collision geometry is only passable with two jumps, placing them in both modes with one-time first-run guidance, and making a safe slide pass use the same off-screen cleanup lifecycle as other hazards.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Add challenge geometry, course schedules, guidance, and consistent hazard lifecycle. | [P01](../phases/2026-11-02-double-jump-challenges/P01-double-jump-courses/phase.md) |

## Completion
- Endless high barriers are introduced by dense challenge waves after 2,000m; the first 150m-wide Endless pit is scheduled after 8,600m with hazard clearance.
- Each Story course has a fixed 130m-wide pit and themed double-jump barriers. Stage 1 introduces the wall at 1,100m and the wide pit at 2,300m.
- Focused tests, TypeScript checking, and production build passed.

## Decisions
- [Confirmed decisions](../decisions/2026-11-02-double-jump-challenges.md)

## Notes
- Preserve the Endless tutorial/practice distance bands, gate rules, existing Hiyori pit rescue, and character abilities.
- Preserve pre-existing unrelated modifications in the working tree. `PitSpawner.ts`, `PitSpawner.test.ts`, `RunnerScene.ts`, and `RunnerScene.test.ts` already have unrelated uncommitted edits; stage only the changes from this plan.
