# Plan: Slide Hazard Readability and Giant Effect Cleanup

## Goal
Make overhead hazards visibly explain their slide-only collision rule, let their art exit naturally after a successful slide, and remove the undersized circular giant aura without changing giant gameplay.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `complete` | Rework overhead obstacle artwork/pass animation and remove the giant circular aura. | [P01](../phases/2026-11-02-slide-hazard-readability-giant-aura-removal/P01-runner-obstacle-feedback/phase.md) |

## Decisions
- [Confirmed decisions](../decisions/2026-11-02-slide-hazard-readability-giant-aura-removal.md)

## Notes
- Preserve all pre-existing unrelated worktree changes. `src/game/runner/RunnerScene.ts` and its test file already contain uncommitted user work; stage only this plan's changes.
- Keep collision boxes separate from visual geometry. The slide gap must remain above the sliding character's silhouette with the existing 6px clearance.

