# Phase: P01 Comfort and Measurement

## Tasks
| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | done | Calm/standard presentation with pause-menu control | [T01](./T01-presentation-presets.md) |
| T02 | in_progress | Measure and cache scene-owned backdrop textures | [T02](./T02-background-transition-cache.md) |
| T03 | pending | Browser comparisons, regressions and local handoff | [T03](./T03-browser-comparison.md) |

## Progress
- done: 1/3 (active: T02); T01 commit `70e74dc`, 32 focused tests, build/lint passed.
- T02 implementation plus automated lifecycle/finish checks pass; full suite 347 tests, final focused 17 tests, build/lint pass. Browser timing and visual evidence remain uncollected because automated browser launch was rejected and CUA is unavailable. Keep T02 in progress and T03 pending. See `docs/runner-visual-comfort-validation.md`.
