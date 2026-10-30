# Plan: Runner Speed and Giant Power-Up Refinement

## Goal

Increase the runner's base pace and make the giant power-up a purposeful tool for dense obstacle sections while preserving readable reaction windows and code-owned collision geometry.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Raise base speed, retune obstacle timing, and target giant pickups before dense waves | [P01](../phases/2026-10-30-runner-speed-giant-refinement/P01-speed-and-giant-placement/phase.md) |

## Decisions

See [decision record](../decisions/2026-10-30-runner-speed-giant-refinement.md).

## Completion Criteria

- [ ] Initial and maximum base speeds are 10% higher while the 90-second ramp, gate bonus, and passives remain intact.
- [ ] Dense pattern and recovery gaps still provide at least 2.5s and 4.5s at the new maximum effective speed.
- [ ] Giant pickups are safe and appear just before dense waves; the six-second effect visibly enlarges the runner without changing its hitbox or replacing its action animation.
- [ ] Targeted tests and production build pass; each task is committed on `project02` without including unrelated local changes.
