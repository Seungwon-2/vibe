# Plan: Runner Feedback Recovery

## Goal
Turn the player feedback backlog into a sequenced, verifiable recovery effort. Improve readability and control first, then gameplay fairness and pacing, then audio, performance and animation. Every report must end as fixed, reproduced and deliberately deferred, or not reproducible with evidence.

## Scope
- Address the 20 reported issues from the pilot feedback, with fixes already confirmed by the user treated as regression checks rather than duplicate implementation.
- Preserve the current local-record pilot architecture, Entra sign-in gate, game modes, and existing character/art roster.
- Do not change Azure resources, add Cosmos integration, or publish/deploy as part of this plan.
- Keep unrelated working-tree changes untouched; commit only files belonging to the active task.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Improve screen comfort, game-object readability, and keyboard access. | [P01](../phases/2026-11-12-runner-feedback-recovery/P01-readability-and-controls/phase.md) |
| P02 | `done` | Make collisions fair, passives legible, and endless/story pacing sustainable. | [P02](../phases/2026-11-12-runner-feedback-recovery/P02-gameplay-fairness-and-pacing/phase.md) |
| P03 | `in_progress` | Resolve audio, performance, motion feedback, and run a complete regression pass. | [P03](../phases/2026-11-12-runner-feedback-recovery/P03-runtime-and-release-check/phase.md) |

## Feedback Traceability
| Feedback | Planned task | Existing status |
| :--- | :--- | :--- |
| Resume dialog cannot be dismissed | P03-T04 | P0 fix completed; regression check |
| Sign-in button/unauthenticated title presentation | P03-T04 | Fixed and deployed; regression check |
| Music waits for interaction; audio too loud | P03-T01 | Reproduce and tune |
| Empty play area; eye-fatiguing colors | P01-T01 | Open |
| Hazards hard to see; pits do not read as pits | P01-T02 | Open; gameplay pit detection was previously fixed |
| Shop cosmetics selectable for locked characters | P03-T04 | P0 fix completed; regression check |
| Rang jump and Toa slide passives lack value | P02-T01 | Open effectiveness review |
| Collision avoidance too strict, especially double jump | P02-T01 | Open |
| No gates / pickups / hazards after late distance | P02-T02 | Fixed and validated through 50,000m |
| Story mode reports save failure | P03-T04 | Code fix reported; regression check |
| Stutter reports | P03-T02 | Open |
| Jump/slide motion feels unnatural | P03-T03 | Open |
| Speed boost low value; hazards repetitive | P02-T03 | Spacing and double-jump position variety adjusted; validation recorded |
| Achievement notifications expose internal IDs | P03-T04 | P0 localization fix completed; regression check |
| ESC pause and arrow/Enter keyboard navigation | P01-T03 | Open; gameplay currently binds P for pause |

## Execution Order
Complete P01 before P02, then P03. Within each phase, execute tasks in table order. Where a report cannot be reproduced, record browser, viewport, steps, and observed result in the task rather than applying a speculative change.

## Definition of Done
- All feedback has a linked task outcome and regression evidence.
- `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass at the release-check task, or any remaining failure is recorded with its exact cause and scope.
- Manual browser checks cover keyboard and pointer operation, both game modes, all biomes, late endless distances, and narrow/short viewports.
- No Azure deployment or cloud-data claim is made by this plan.
