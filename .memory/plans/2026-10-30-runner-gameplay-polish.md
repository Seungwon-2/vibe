# Plan: Runner Gameplay Polish

## Goal

Make gate acceleration more noticeable, tune dense obstacle pacing against the actual maximum speed, and add a safe-to-collect giant power-up that lets players break through ordinary obstacles without negating pit danger.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Gate speed feedback, maximum-speed obstacle spacing, and giant power-up | [P01](../phases/2026-10-30-runner-gameplay-polish/P01-runner-feel-and-powerups/phase.md) |

## Decisions

See [Runner Gameplay Polish decision record](../decisions/2026-10-30-runner-gameplay-polish.md).

## Completion Criteria

- [x] Gate acceleration is visibly communicated without changing animation frame rates or collision geometry.
- [x] Dense obstacle spacing provides at least 2.5 seconds of reaction time at the maximum supported course speed; post-sequence recovery is at least 4.5 seconds.
- [x] The giant power-up appears at safe positions, lasts four seconds, suppresses ordinary obstacle penalties, leaves pits dangerous, keeps the player's collision box unchanged, and displays its remaining time.
- [x] The plan's targeted tests and production build pass; each task is committed on `project02` without including unrelated local changes.
