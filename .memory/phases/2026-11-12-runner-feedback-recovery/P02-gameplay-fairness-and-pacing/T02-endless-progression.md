# Task: T02 Endless Progression

## Status: done

## Goal
Prevent the endless course from becoming empty or losing time-recovery gates after the current 10,000m schedule; maintain a consistent, testable course indefinitely.

## Decision Summary
- Endless mode is unbounded; fixed initial gate entries must not be the only gate schedule.
- Keep story milestones distinct from endless gates and preserve story-specific fixed course behavior.
- Existing endless item/hazard generation beyond 8,000m must be tested over a distance well beyond the current gate list.

## Implementation

### I01. Generate repeatable endless gates and verify course entities
- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_GATE_DISTANCES_M`; modify
  - `src/game/runner/RunnerSimulation.ts` :: next-gate lookup and gate state; modify
  - `src/game/runner/RunnerHud.tsx` :: next gate/progress display; read-only unless schedule API changes
  - `src/game/runner/ObstacleSpawner.ts`, `CollectibleSpawner.ts`, and `PitSpawner.ts` :: endless schedules; modify only if audit finds a finite bound
  - `src/game/runner/RunnerSimulation.test.ts`, spawner tests; modify/add
- Details
  - Replace direct reliance on a five-element finite gate array with a deterministic schedule function for endless mode. Preserve the existing first gate distances 2,000/4,000/6,000/8,000/10,000m; continue every 2,000m afterward unless an existing documented configuration supersedes it.
  - Derive stable gate IDs from distance, ensure checkpoints can serialize/restore them, and award the existing 20-second bonus and 5% gate speed increment exactly once per gate.
  - Story mode continues to use gates as non-accelerating course milestones and must not gain endless timer restoration.
  - Audit schedule cursors and spawn horizon for obstacles, coins, speed/time/giant pickups and pits at 8,000m, 10,000m, 20,000m, and 50,000m. Ensure generators use arithmetic/cursors rather than arrays with a terminal entry.
  - Ensure recovery and gate-clearance windows do not conflict with hazards or pickups; validate checkpoint resume around a generated gate.

## Acceptance Criteria
- [x] Endless mode has a gate and time reward after 10,000m and continues generating subsequent gates.
- [x] Reaching the same gate twice through resume does not duplicate its reward.
- [x] Endless entities continue past 50,000m; story milestones keep their existing semantics.
- [x] HUD always shows the next gate and correct remaining distance.

## Validation
- `npm run test -- --run src/game/runner/RunnerSimulation.test.ts src/game/runner/ObstacleSpawner.test.ts src/game/runner/CollectibleSpawner.test.ts src/game/runner/PitSpawner.test.ts` — 57 tests pass.
- Deterministic simulation through 50,000m verifies endless hazard, coin, pit and pickup schedules; resume at 12,000m verifies gate 12,000 does not pay twice and gate 14,000 pays once.
- `npm run typecheck` — passes.

## Commit Message
```text
fix(game): continue endless course progression past 10 km

Plan: 2026-11-12-runner-feedback-recovery
Phase: P02-gameplay-fairness-and-pacing
Task: T02-endless-progression

- Extend endless gate rewards without changing story milestones
- Verify obstacle and pickup generation at late distances
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 0d695be
