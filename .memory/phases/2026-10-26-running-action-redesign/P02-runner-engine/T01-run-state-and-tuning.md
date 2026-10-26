# Task: T01 Run State and Tuning

## Status: done

## Goal

Implement deterministic, framework-independent rules for elapsed run time, distance, speed ramp, time gates, time pickups, collision penalties, and final run results.

## Decision Summary

- Constants: countdown 3,000ms; initial timer 90,000ms; cap 120,000ms; time item 3,000ms; gate bonus 20,000ms; gate distances 2,500/5,000/7,500m; speed 250→325 world units/s over 90,000 active ms; 1m per 3 world units; collision penalty 5,000ms; stagger/protection 800ms.
- Passive modifiers come only from `getCharacterPassive`; Toa's 150ms slide grace and Yuni's second-jump multiplier are consumed by T02, not by timer math here.

## Implementation

### I01. Define the run model and constants

- Related Files:
  - `src/game/runner/runnerTypes.ts` :: `RunnerPhase`, `RunnerPickupKind`, `RunnerBiomeId`, `RunnerGateId`, `RunnerSnapshot`, `RunnerResult`; new.
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG`, `RUNNER_GATE_DISTANCES_M`; new.
  - `src/game/runner/RunnerSimulation.ts` :: pure state transitions; new.
  - `src/game/runner/RunnerSimulation.test.ts` :: deterministic rules tests; new.

#### Details

- Define `RunnerPhase = 'countdown' | 'running' | 'paused' | 'finished'`; `RunnerPickupKind = 'coin' | 'time'`; `RunnerBiomeId = 'dawn-city' | 'moonlit-forest' | 'crystal-mine' | 'cloud-skyway'`; `RunnerGateId = 'gate-2500' | 'gate-5000' | 'gate-7500'`.
- `RunnerSnapshot` fields: `phase`, `characterId: CharacterId`, `elapsedMs`, `remainingMs`, `distanceMeters`, `worldDistance`, `speedUnitsPerSecond`, `coins`, `collectedPickupIds: readonly string[]`, `passedGateIds: readonly RunnerGateId[]`, `staggerRemainingMs`, `protectionRemainingMs`, `biomeId`, `finishedAtElapsedMs: number | null`.
- `RunnerResult` fields: `characterId`, `distanceMeters`, `coins`, `durationMs`, `finishedAtIso`; no stage ID, lives, checkpoint, or boss fields.
- `RUNNER_CONFIG` exact values: `countdownMs: 3000`, `initialTimerMs: 90000`, `maxTimerMs: 120000`, `timePickupMs: 3000`, `gateBonusMs: 20000`, `initialSpeedUnitsPerSecond: 250`, `maxSpeedUnitsPerSecond: 325`, `speedRampMs: 90000`, `metersPerWorldUnit: 1/3`, `collisionPenaltyMs: 5000`, `staggerMs: 800`, `protectionMs: 800`.
- `RUNNER_GATE_DISTANCES_M` is an ordered readonly tuple `[2500, 5000, 7500]`; map each threshold to its matching `RunnerGateId` and next biome boundary.

### I02. Implement pure transitions

- Related Files:
  - `src/game/runner/RunnerSimulation.ts` :: `createRunnerSnapshot`, `startRunner`, `advanceRunner`, `pauseRunner`, `resumeRunner`, `collectPickup`, `applyCollision`, `finishRunner`; new.
  - `src/game/runner/RunnerSimulation.test.ts` :: transition and edge-case tests; new.

#### Details

- Signatures:
  ```ts
  createRunnerSnapshot(characterId: CharacterId, now?: Date): RunnerSnapshot
  startRunner(state: RunnerSnapshot): RunnerSnapshot
  advanceRunner(state: RunnerSnapshot, deltaMs: number): { state: RunnerSnapshot; result: RunnerResult | null }
  pauseRunner(state: RunnerSnapshot): RunnerSnapshot
  resumeRunner(state: RunnerSnapshot): RunnerSnapshot
  collectPickup(state: RunnerSnapshot, pickup: { id: string; kind: RunnerPickupKind }): RunnerSnapshot
  applyCollision(state: RunnerSnapshot): RunnerSnapshot
  finishRunner(state: RunnerSnapshot, now?: Date): { state: RunnerSnapshot; result: RunnerResult }
  ```
- Advance only when `phase === 'running'`. Clamp non-positive delta to zero. Active elapsed time drives the linear speed: `min(325, 250 + 75 * elapsedMs / 90000)`.
- Integrate distance using average speed over the frame: `deltaMeters = ((oldSpeed + newSpeed) / 2) * deltaMs / 1000 / 3`. Keep `distanceMeters` as a floating value internally; presentation rounds to a whole meter.
- Decrement timer by active delta. Crossing a gate threshold grants exactly one +20,000ms bonus per gate, capped at 120,000ms. Gate application is based on crossed distance, not exact float equality. A gate can never pay twice.
- Time pickup adds `3000 + characterPassive.bonusMs` (Rin +1000; all others +0), capped at 120,000ms. Coin pickup adds one coin. Duplicate pickup IDs have no effect.
- On accepted collision, subtract `5000 - reductionMs` (Lize reduction 1000; others 0), never below zero; set stagger and protection to 800ms. Ignore a collision while `protectionRemainingMs > 0`. Count down stagger/protection only during active run time.
- Resolve the biome by greatest crossed threshold: `<2500 dawn-city`, `<5000 moonlit-forest`, `<7500 crystal-mine`, otherwise `cloud-skyway`.
- When timer reaches zero, set `phase='finished'`, freeze distance/speed, and return `{ state, result }` with one final result. Return `result: null` while the run remains active. A paused or finished state never advances.

### Implementation note

- `RunnerSnapshot` also stores `startedAtIso` and `finishedAtIso` so a given initial snapshot and delta sequence produce the same result timestamp. `advanceRunner` uses the initial timestamp plus active elapsed time; `finishRunner(state, now)` can stamp an explicit wall-clock finish when supplied by a caller.
- An update that spans a gate is split at the gate crossing. Only time before expiry contributes distance, and the gate bonus applies at the crossing before processing any remaining frame time. This keeps large and small update steps equivalent.

## Acceptance Criteria

- [x] Identical initial state and delta sequence produce identical distance, timer, gates, and result.
- [x] Speed reaches 325 exactly after 90 active seconds and remains capped after extensions.
- [x] Gate crossings and unique pickups apply once and respect the 120-second cap.
- [x] Collision penalties use the selected character passive, never create negative timer values, and protection blocks repeat hits for 800ms.
- [x] No platformer, stage, life, or checkpoint fields appear in runner state/result.

## Validation

- `npm test -- src/game/runner/RunnerSimulation.test.ts` — validates run rules and edge cases.
- `npm run typecheck` — validates model and pure system types.

## Commit Message

```text
feat(runner): add deterministic timed distance simulation

Plan: 2026-10-26-running-action-redesign
Phase: P02-runner-engine
Task: T01-run-state-and-tuning

- Add timer, speed, distance, gate, pickup, collision, and result rules
- Centralize runner tuning and use character passives
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm test -- src/game/runner/RunnerSimulation.test.ts`; `npm run typecheck`; `npm run lint`)
- commit: efe3d9d
