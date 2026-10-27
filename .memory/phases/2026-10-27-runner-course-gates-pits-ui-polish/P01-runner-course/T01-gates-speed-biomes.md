# Task: T01 Gates, Speed, and Biome Boundaries

## Status: done

## Goal

Update the simulation and rendered gate markers to use five 2,000m milestones, correct four-biome boundaries, and a cumulative shared +5 percentage-point maximum-speed bonus per passed gate without changing the timer reward rules.

## Decision Summary

- Gates: 2,000m, 4,000m, 6,000m, 8,000m, 10,000m. The last two are bonus gates inside cloud skyway.
- Base speed still ramps from 250 to 325 world units/sec over 90 seconds. Each passed gate adds 5 percentage points to the base maximum-speed target; do not compound percentages. Every gate still awards up to +20 seconds, capped at 120 seconds.
- Biome starts are 0m, 2,000m, 4,000m, 6,000m for city, forest, mine, skyway.

## Implementation

### I01. Shared distance configuration and types

- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG`, `RUNNER_GATE_DISTANCES_M` — centralized values; modify.
  - `src/game/runner/runnerTypes.ts` :: `RunnerGateId`, `RunnerSnapshot` — gate IDs and simulation model; modify.
  - `src/game/visuals/runnerBiomes.ts` :: `RUNNER_BIOMES`, `getBiomeForDistance` — theme thresholds; modify.

#### Details

- Define `RUNNER_GATE_DISTANCES_M` as `readonly [2000, 4000, 6000, 8000, 10000]`.
- Change `RunnerGateId` to `'gate-2000' | 'gate-4000' | 'gate-6000' | 'gate-8000' | 'gate-10000'`.
- Add `gateSpeedBonusRatio: 0.05` to `RUNNER_CONFIG`; keep `initialSpeedUnitsPerSecond: 250`, `maxSpeedUnitsPerSecond: 325`, `speedRampMs: 90000`, `initialTimerMs: 90000`, `maxTimerMs: 120000`, and `gateBonusMs: 20000`.
- Update `RUNNER_BIOMES` starts to `0`, `2000`, `4000`, `6000`. `getBiomeForDistance` must continue returning the previous biome below a boundary and the new biome at/above it.
- Keep exactly four `RunnerBiomeId` values; do not add themes for gates 4 and 5.

### I02. Chunk-independent gate and speed simulation

- Related Files:
  - `src/game/runner/RunnerSimulation.ts` :: `GATE_IDS`, `getSpeed`, `getBiome`, `traveledWorldUnits`, `advanceSegment`, `getNextGate`, `createRunnerSnapshot`, `advanceRunner` — modify.
  - `src/game/runner/RunnerSimulation.test.ts` :: gate, speed, timer, and step-size scenarios — modify.
  - `src/game/runner/RunnerIntegration.test.ts` :: offline gate completion — modify.

#### Details

- Keep the public signature `advanceRunner(state: RunnerSnapshot, deltaMs: number, onGateAward?: (gateId: RunnerGateId, awardedMs: number) => void): { state: RunnerSnapshot; result: RunnerResult | null }`.
- Map gate IDs by array index and derive the biome from `getBiomeForDistance(distanceMeters).id`; remove the duplicate hardcoded biome threshold loop from `RunnerSimulation.ts`.
- Compute `gateCount = state.passedGateIds.length`; compute the ramp target as `RUNNER_CONFIG.maxSpeedUnitsPerSecond * (1 + gateCount * RUNNER_CONFIG.gateSpeedBonusRatio)`. Interpolate from the existing initial speed using `clamp(elapsedMs / speedRampMs, 0, 1)`.
- Pass the current gate count into the distance-integration helper. When one `deltaMs` crosses a gate, integrate only to the gate with the old gate count, apply capped timer reward and append its ID exactly once, then integrate remaining time using the new gate count. Preserve elapsed-time pause/stagger rules and determinism across large vs. small update chunks.
- Do not make gate crossings alter coin count or the 90-second timer start.

### I03. Gate marker schedule

- Related Files:
  - `src/game/runner/CollectibleSpawner.ts` :: gate loop in `CollectibleSpawner.update`, `GateArt` — modify.
  - `src/game/runner/CollectibleSpawner.test.ts` :: gate distance assertions — modify.

#### Details

- Continue rendering non-colliding gate arches from `RUNNER_GATE_DISTANCES_M`; this single array now creates all five landmarks.
- For gate distances 8,000m and 10,000m use the skyway palette and landmark returned by `getBiomeForDistance`, while preserving the visible `+20s` reward label.
- Keep gate IDs and distances stable across the event callback and snapshot.

## Acceptance Criteria

- [ ] Five unique gate IDs are recorded once, in distance order, at the configured distances.
- [ ] Biome changes occur only at 2,000m, 4,000m, and 6,000m; gates 4 and 5 remain in cloud skyway.
- [ ] Each gate grants the existing capped +20 seconds and a +5-point maximum-speed target; after five gates the shared target is 406.25 world units/sec.
- [ ] Distance, speed, timer rewards, and gate IDs are equivalent for one large update and many smaller updates.

## Validation

- `npm run test -- src/game/runner/RunnerSimulation.test.ts src/game/runner/RunnerIntegration.test.ts src/game/runner/CollectibleSpawner.test.ts` — gate ordering, speed ramp, timer cap, theme boundary, and chunk-size assertions pass.
- `npm run typecheck` — updated gate unions and callback types compile.

## Commit Message

```text
feat(runner): add five speed gates and align biome boundaries

Plan: 2026-10-27-runner-course-gates-pits-ui-polish
Phase: P01-runner-course
Task: T01-gates-speed-biomes

- Add five 2,000m gates with additive maximum-speed growth
- Align the four biome thresholds with the first three gates
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: `feat(runner): add five speed gates and align biome boundaries`
