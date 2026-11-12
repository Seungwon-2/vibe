# Plan: Runner Session Resume

## Goal
Save an active run when the browser is left or closed, then let the player resume from the exact saved gameplay state or discard the save and start over. Preserve terminal results for the next visit. This is browser-local storage, scoped per signed-in account or guest, with a seven-day expiry.

## Confirmed Decisions
- Resume works in endless and story modes; game/effect timers pause while away.
- Restore jump height/velocity and slide state, not only distance and score.
- On return, offer Resume or New Run. Starting over requires confirmation; discarded-run coins are forfeited.
- Terminal runs reopen their result screen and are not revived as active runs.
- If browser storage is unavailable, keep gameplay usable and show a save-failure notice.
- This plan does not change the paused Azure deployment plan or connect session storage to Cosmos/API.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Account-scoped session store, exact Phaser state restore, and browser resume flow | [P01](./phases/2026-11-12-runner-session-resume/P01-session-recovery/phase.md) |

## Active Task
P01-T02 — define the Phaser engine checkpoint needed for exact run restoration.

## Preserved Work / Pause Note
- The Azure Static Web Apps and GitHub deployment plan remains paused at P02-T02; its files are preserved.
- Entra consent, Cosmos API, and Azure deployment work are outside this local session recovery plan.

## Technical Defaults
- Store one JSON envelope per guest or account key. Account scope uses the authenticated `homeAccountId`; do not store tokens, email, or display names in the session envelope.
- Autosave cadence and browser lifecycle events are defined in T03.
- Expired, corrupt, or unsupported session data is removed only from the requested scope's key.
- Phaser checkpoint data must preserve player pose/body state, active obstacle/pickup/pit/gate state, and enough deterministic generation state to continue without duplicates or skipped objects.

## Progress
- done: 1/3 tasks (active: P01-T02)
