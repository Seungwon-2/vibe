# T01 Runner Speed Simulation

- Status: done
- Plan: `2026-11-05-runner-speed-powerups`
- Phase: `P01-speed-powerups`

## Goal

Implement giant and speed-pickup acceleration in the simulation with correct timing, deterministic distance integration, and the selected mode rules.

## Decision summary

- Giant grants 2.5x current speed for its existing 6 seconds while retaining 1.35x size and ordinary-obstacle protection; pits are not protected.
- A separate pickup grants 2.5x current speed for 3 seconds in both modes, with no size or protection effect. Recollection refreshes its timer.
- Giant and speed-pickup multipliers share a 2.5x cap and have independent timers. Base speed already includes character passive and Endless gate acceleration.
- Story time pickups retain +15% for 3 seconds. Endless time pickups do not restore time; gates are the timer recovery source.
- Do not change animation rate or collision-box dimensions.

## Implementation blueprint

### Related files and symbols

- `src/game/runner/runnerTypes.ts`
  - Extend `RunnerPickupKind` with a distinct speed pickup kind.
  - Add a distinct remaining-time field to `RunnerSnapshot` and its initial snapshot so the new effect is independently tracked.
- `src/game/runner/runnerConfig.ts`
  - Centralize the giant and speed pickup multiplier (`2.5`), new speed-effect duration (`3000` ms), and any named effect tuning values.
  - Preserve existing `giantDurationMs`, `storySpeedBoostMs`, and `storySpeedBoostRatio` values.
- `src/game/runner/RunnerSimulation.ts`
  - Update `getSpeed`, `traveledWorldUnits`, `advanceSegment`, snapshot creation, and `collectPickup`.
  - Preserve piecewise integration when a timer expires partway through a simulation step; simultaneous giant and speed timers must apply one 2.5x multiplier, never 6.25x.
  - Keep Story +15% behavior when no 2.5x effect is active. Apply a single 2.5x multiplier while giant or speed pickup remains active.
  - Refresh the speed-pickup timer to 3 seconds on recollection; do not add remaining time.
  - In Endless, ignore the `time` pickup for timer restoration even if `collectPickup` is called directly. Preserve Story time pickup behavior and Rin's configured pickup bonus only where it applies.
  - Ensure timers advance consistently during normal simulation and stagger states; pause behavior remains frozen through the existing paused simulation contract.

### Data and invariants

- `RunnerPickupKind`: existing `coin | time | giant` plus `speed` (or the existing project naming convention if code review finds a stronger match).
- Snapshot timer: a number of milliseconds, initialized to zero and clamped at zero.
- Effective speed multiplier: `2.5` if giant or separate speed effect is active; otherwise `1.15` if Story speed boost is active; otherwise `1.0`.
- Giant protection is still controlled only by `giantRemainingMs`; speed alone never grants protection.

## Acceptance criteria

- Giant speed rises to 2.5x while preserving size and obstacle protection and still allowing pit failure.
- Speed pickup is 2.5x for 3 seconds; repeat collection refreshes, never stacks.
- Overlapping giant and speed pickup effects never exceed 2.5x, and giant protection expires with its own timer.
- Speed returns to the proper baseline when timers expire, including expiry mid-step.
- Story time pickup retains +15% for 3 seconds; Endless time pickup cannot replenish the timer.
- Passive and gate speed are part of the multiplier base; animation cadence and hitbox dimensions are unchanged.

## Validation

- `npx vitest run src/game/runner/RunnerSimulation.test.ts`
- `npm run typecheck`

Add/update focused simulation tests for giant speed, speed pickup duration and refresh, overlapping-effect cap, timer expiry during movement, pause/stagger behavior, and mode-specific time pickup handling.

## Commit message

```text
feat(runner): model temporary speed power-ups

Plan: 2026-11-05-runner-speed-powerups
Phase: P01-speed-powerups
Task: T01-runner-speed-simulation
```

## Progress

- [x] Implementation complete
- [x] Validation complete (`17/17` focused tests; TypeScript typecheck)
- [x] Task status set to done\n