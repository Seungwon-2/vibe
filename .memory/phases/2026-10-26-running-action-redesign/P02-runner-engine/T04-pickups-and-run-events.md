# Task: T04 Pickups and Run Events

## Status: pending

## Goal

Collect coins/time items and milestone gates exactly once, then publish bounded React snapshots and one terminal result from Phaser.

## Decision Summary

- Coins are a tie-breaker only. Time items add 3 seconds (Rin gets 4 seconds); gates at 2,500/5,000/7,500m add 20 seconds each. All bonuses cap at 120 seconds.
- Some pickups may require an optional jump, but the safe running path never depends on collecting them.

## Implementation

### I01. Spawn and collect pickups/gates

- Related Files:
  - `src/game/runner/CollectibleSpawner.ts` :: authored pickup schedule; new.
  - `src/game/runner/RunnerScene.ts` :: collectible groups and contact callbacks; modify.
  - `src/game/runner/CollectibleSpawner.test.ts` :: distance placement and uniqueness tests; new.

#### Details

- Define `PickupDefinition = { id: string; kind: 'coin' | 'time'; distanceMeters: number; heightUnits: number; optionalJump: boolean }`.
- Schedule pickups by absolute distance in a fixed deterministic course list; include safe-route items and optional airborne reward lines. No random or required risky pickup placement.
- Create a visible gate object at each threshold; gate crossing applies the simulation's one-time reward and emits an event for HUD feedback. Gates are collision-free and cannot block the runner.
- On overlap call `collectPickup`; remove the world object immediately and use stable IDs to prevent duplicate coin/time rewards.
- Use Graphics primitives for coin/time/gate assets in this task; P03 may reskin them without changing IDs or effects.

### I02. Define event bridge and snapshot cadence

- Related Files:
  - `src/game/runner/runnerEvents.ts` :: `RunnerEvent` union and `RunnerCallbacks`; new.
  - `src/game/runner/RunnerScene.ts` :: snapshot emitter, pickup/gate notifications, and terminal notification; modify.
  - `src/game/runner/RunnerGame.tsx` :: forward one-off runner events to React without re-creating Phaser; modify.
  - `src/game/runner/RunnerEvents.test.ts` :: event sequencing tests; new.

#### Details

- `RunnerEvent = { type: 'snapshot'; snapshot: RunnerSnapshot } | { type: 'pickup'; pickupId: string; kind: RunnerPickupKind; awardedMs: number } | { type: 'gate'; gateId: RunnerGateId; awardedMs: number } | { type: 'run-finished'; result: RunnerResult } | { type: 'fatal-error'; message: string }`. `awardedMs` is the time actually added after the 120-second cap (zero for coins), not the uncapped nominal reward.
- Extend `RunnerGameProps` with optional `onEvent(event: RunnerEvent): void` and keep its latest callback in the same ref used for `onSnapshot`/`onFinished`. Emit one `pickup` or `gate` event after its state transition, keyed by stable ID, so P03 can show accurate `+Ns` feedback without diffing 10Hz snapshots. Do not emit a reward event twice on overlap/retry cleanup.
- Emit snapshots at 10Hz maximum (every 100ms) plus immediately on pickup, collision, pause/resume, gate, and finish. Never set React state every Phaser frame.
- Emit `run-finished` exactly once when remaining time reaches zero; include final rounded meters, coins, character ID, active duration, and ISO timestamp.
- When browser tab loses focus, pause through the same run-state transition so timer, distance, hazards, and inputs cannot continue invisibly.

## Acceptance Criteria

- [ ] Coins increment by one on contact and do not alter timer or movement.
- [ ] Time items apply character passives and obey the cap.
- [ ] Each of the three gates fires once at its distance and gives +20 seconds subject to cap.
- [ ] Snapshot events are bounded and terminal event is exactly once.
- [ ] No collectible is mandatory for a hazard pattern to be completed.

## Validation

- `npm test -- src/game/runner/CollectibleSpawner.test.ts src/game/runner/RunnerEvents.test.ts src/game/runner/RunnerSimulation.test.ts` — validates collection and event flow.
- `npm run typecheck` — validates event contracts.

## Commit Message

```text
feat(runner): add time pickups coins and milestone gates

Plan: 2026-10-26-running-action-redesign
Phase: P02-runner-engine
Task: T04-pickups-and-run-events

- Add deterministic collectibles and three time gates
- Publish bounded runner snapshots and a single final result
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
