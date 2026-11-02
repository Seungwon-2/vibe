# Plan: Runner Gameplay Review Updates

## Goal
Resolve the Story pickup-versus-pit schedule mismatch, place the first double-jump challenge in the agreed late-course region, bind giant pickups to the mode's actual obstacle patterns, and raise challenge density in both modes. Story uses authored hazards and safe recovery spaces; Endless progressively tightens obstacle and recovery intervals through centrally tunable values.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Correct mode-aware placement and improve Story challenge rhythm. | [P01](../phases/2026-11-02-runner-gameplay-review/P01-gameplay-systems/phase.md) |

## Decisions
- [Confirmed decisions](../decisions/2026-11-02-runner-gameplay-review.md)

## Notes
- Work in order: pickup safety, first course pacing, giant pickup authoring, then Story route density and Endless interval progression.
- Preserve unrelated uncommitted files. Commit each task on `project02` as specified by its blueprint.
