# Task: T01 Collision Fairness and Passives

## Status: done

## Goal
Make required evasions feel fair, especially double-jump hazards, while proving each currently playable character passive affects play in its described way.

## Decision Summary
- Keep player physics and collision data independent from sprite art.
- Preserve current passive identities and central tuning configuration; tune only after recording reproducible baseline outcomes.
- A visual overlap at a non-colliding edge must not cause an avoidable hit, but hazards must remain genuinely avoidable with the intended input.

## Implementation

### I01. Audit hitboxes, swept collision, and passive routes
- Related Files:
  - `src/game/runner/CollisionSystem.ts` and `sweptCollision.ts` :: hazard collision checks; modify
  - `src/game/runner/hazardPatterns.ts` :: double-jump schedule; read-only unless pattern reachability fails
  - `src/game/runner/RunnerPlayer.ts` and `RunnerSimulation.ts` :: jump state and passive processing; modify
  - `src/game/runner/runnerConfig.ts` :: centralized physics/passive tuning values; modify
  - `src/game/characters/characterAbilities.ts` :: passive values/labels; modify only when actual effect and label disagree
  - `src/game/runner/RunnerSimulation.test.ts`, `src/game/runner/CollisionSystem.test.ts`, and `src/game/runner/RunnerPlayer.test.ts`; modify/add
- Details
  - Establish table-driven scenarios for low jump hazard, overhead slide hazard, double-jump barrier, pit edge, Toa slide guard and cooldown, and Rang double-jump boost.
  - Validate double-jump obstacle clearance using the configured jump impulse, gravity, obstacle width/height, player collision body, and horizontal speed. Current calibration uses a 142px barrier: it stays above the 98px single-jump apex and provides at least 300ms of viable second-jump timing; the modeled first jump begins about 128m before the barrier center at max speed.
  - Adjust collision hitboxes only by evidence from the rendered sprite and movement envelope. Use swept collision to prevent tunneling; avoid a blanket collision-disable window that would make hazards passable.
  - Verify Rang applies its multiplier only to the second jump and that the calculated apex rises by the configured 12% target. Verify Toa guard triggers once during the initial slide window and respects cooldown; provide clear ready/cooldown feedback if it currently has none.
  - Verify Hiyori's two charges and Mary's 150px coin/time-item attraction remain functional, including no unintended attraction of giant pickups and no collision effect from magnet range.

## Acceptance Criteria
- [x] Each hazard can be cleared by its intended maneuver in a deterministic test scenario.
- [x] Double-jump collision tolerates normal input timing and does not require pixel-perfect contact avoidance.
- [x] Rang and Toa passives work as described and their triggers/cooldowns are observable.
- [x] Hiyori and Mary behaviors remain unchanged outside their intended passive behavior.

## Validation
- `npm run test -- src/game/runner/RunnerSimulation.test.ts src/game/runner/CollisionSystem.test.ts src/game/runner/RunnerPlayer.test.ts src/game/runner/ObstacleSpawner.test.ts src/game/runner/CollectibleSpawner.test.ts` — 5 files, 76 tests pass.
- `npm run typecheck` — passes.

## Commit Message
```text
fix(game): make hazard evasion and passives dependable

Plan: 2026-11-12-runner-feedback-recovery
Phase: P02-gameplay-fairness-and-pacing
Task: T01-collision-and-passives

- Calibrate collision envelopes against visible hazards
- Verify double-jump and character passive behavior
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: recorded in git history
