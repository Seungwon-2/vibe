# Plan: Runner Polish and Pre-deployment Review

## Goal
Reduce repeated achievements, keep Story stage selection within the viewport, make overhead obstacles require sliding, preserve action-specific animation during giant mode, restore authored terminal-animation timing, integrate user-provided audio assets, and complete a local pre-deployment readiness review without deploying.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Clean up achievements and refine Story selection, obstacle rules, giant-mode presentation, and end-animation timing. | [P01](../phases/2026-11-02-runner-polish-predeploy/P01-gameplay-polish/phase.md) |
| P02 | `pending` | Replace audio files when provided, then run local release checks and report deployment blockers. | [P02](../phases/2026-11-02-runner-polish-predeploy/P02-audio-release-check/phase.md) |

## Notes
- The working tree already contains unrelated user changes; execution must preserve them and stage only files belonging to the active task.
- Audio integration is gated on the user supplying replacement files. Keep the current audio working until then.
- This plan does not deploy to Azure.
