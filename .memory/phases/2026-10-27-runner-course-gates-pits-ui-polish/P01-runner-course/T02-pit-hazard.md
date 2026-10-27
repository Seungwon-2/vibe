# Task: T02 Pit Hazard

## Status: done

## Goal

Add an unmistakable jumpable floor gap that ends a normal run immediately when hit, teaches the pit mechanic once in the tutorial, and provides a reusable pit schedule/clearance API for obstacle and pickup generation.

## Decision Summary

- First pit at 850m; later candidate pits every 1,750m. Baseline gap width is 30m.
- Only the tutorial pit has an explicit theme-matched warning marker, shown 250m before it. Later gaps remain visually visible but have no separate warning marker.
- A pit hit while grounded ends a normal runner's run as a pit-related game over; jumping clears it.

## Implementation

### I01. Pit model and centralized tuning

- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG` — pit settings; modify.
  - `src/game/runner/pitTypes.ts` :: `PitDefinition` — new pit schedule model; new.
  - `src/game/runner/PitSpawner.ts` :: `getPitDefinitions`, `isPitClearance`, `PitSpawner` — schedule, render, and detect grounded contact; new.
  - `src/game/runner/PitSpawner.test.ts` :: pit schedule, rendering, and clearance; new.

#### Details

- Add centralized values: `firstPitDistanceMeters: 850`, `pitSpacingMeters: 1750`, `pitWidthMeters: 30`, `tutorialPitWarningLeadMeters: 250`, `pitHazardClearanceMeters: 200`.
- Define:
  ```typescript
  export type PitDefinition = Readonly<{
    id: string;
    // Center of the gap on the absolute course-distance axis.
    distanceMeters: number;
    widthMeters: number;
    tutorialWarning: boolean;
  }>;
  export function getPitDefinitions(maxDistanceMeters: number): readonly PitDefinition[];
  export function isPitClearance(distanceMeters: number, pit: PitDefinition, clearanceMeters?: number): boolean;
export class PitSpawner {
  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite,
    isGrounded: () => boolean, onPitFall: (pit: PitDefinition) => void);
  update(snapshot: RunnerSnapshot): void;
  destroy(): void;
}
  ```
- Generate stable IDs `pit-850`, `pit-2600`, `pit-4350`, etc. Mark only `pit-850` as `tutorialWarning: true`; stop generation beyond the supplied distance.
- `distanceMeters` is the center of the 30m gap. `isPitClearance` returns true when a candidate point is within `pit.widthMeters / 2 + clearanceMeters` of that center.
- Render a dark, full-lane gap with clear contrasting edges using Phaser Graphics and `getBiomeForDistance(pit.distanceMeters)`. Add the warning marker only when `tutorialWarning` is true and it is within 250m of the pit. Do not show a separate marker for later pits.
- Convert gap width to Phaser pixels with `widthMeters / RUNNER_CONFIG.metersPerWorldUnit`; place the gap center with the same distance-to-screen formula as `CollectibleSpawner`. Place the gap art at `RUNNER_GROUND_Y` and keep its warning text/marker above the floor lane.
- Use an invisible overlap body for the gap; keep all art outside the collision rectangle. A grounded overlap calls `onPitFall` once and removes the active pit; an airborne overlap removes the passed pit without a callback. Use the supplied `isGrounded` callback rather than inferring jump state from sprite art. Update objects only while `snapshot.phase === 'running'` and destroy every Phaser object in `destroy()`.

### I02. Pit result and scene integration

- Related Files:
  - `src/game/runner/runnerTypes.ts` :: `RunnerFinishReason`, `RunnerSnapshot`, `RunnerResult` — add finish reason; modify.
  - `src/game/runner/RunnerSimulation.ts` :: `finishRunner`, `createRunnerSnapshot` — preserve reason; modify.
  - `src/game/runner/PitSpawner.ts` :: overlap callback and cleanup — connect grounded contact; modify.
  - `src/game/runner/RunnerScene.ts` :: `create`, `handlePitFall`, `emitFinished`, `cleanup` — own spawner and end lifecycle; modify.
  - `src/game/runner/RunnerScene.test.ts` :: pit end behavior; modify.
  - `src/game/runner/RunnerSimulation.test.ts` :: finish reason result mapping; modify.

#### Details

- Define `RunnerFinishReason = 'timeout' | 'pit'`; add `finishReason: RunnerFinishReason | null` to `RunnerSnapshot` and `finishReason: RunnerFinishReason` to `RunnerResult`.
- Preserve existing date-call compatibility with `finishRunner(state: RunnerSnapshot, now?: Date, reason?: RunnerFinishReason): { state: RunnerSnapshot; result: RunnerResult }`; default `reason` to `'timeout'` for existing timer calls. Pit calls use `finishRunner(state, undefined, 'pit')`. Preserve idempotence for already-finished states.
- Add `PitSpawner` to `RunnerScene.create`, update it after the simulation snapshot, and destroy it in `cleanup`.
- `handlePitFall` must be one-shot: call `finishRunner(snapshot, undefined, 'pit')`, publish the terminal state, clear input, and emit one result. Do not deduct a life, charge collision penalty, or return normal characters to a checkpoint. Use the existing game-over animation.
- In `emitFinished`, choose the game-over animation whenever `result.finishReason === 'pit'`, even if the distance is a personal best; keep the personal-best record and outcome label for scoring. Normal timeout runs retain the existing best-victory behavior.
- Continue recording the final distance and coins through the existing result/record gateway; include `finishReason` in the in-memory `RunnerResult` but do not add it to ranking sort keys or persisted `RankedRunRecord`.
- Keep Hiyori's rescue out of this task; P02-T01 will intercept the pit event before it reaches `handlePitFall`.

### I03. Pit scheduling tests

- Related Files:
  - `src/game/runner/PitSpawner.test.ts` — new deterministic rendering/collision harness.
  - `src/game/runner/RunnerIntegration.test.ts` — pit result remains recordable; modify.

#### Details

- Verify first and subsequent candidate distances, stable unique IDs, first-only tutorial warning flag, clipping by max distance, and 200m exclusion predicate boundaries.
- Verify grounded contact finishes with `finishReason: 'pit'`, retains meters/coins, does not spend time as collision penalty, and duplicate overlap does not submit twice.
- Verify airborne overlap does not end the run.

## Acceptance Criteria

- [x] Pit gaps are visible with biome-matched rims; only the first gap receives the explicit tutorial marker.
- [x] A normal character can jump through a pit; grounded contact immediately enters the game-over result path with the pit reason.
- [x] Pit failure preserves the run's reached distance and coin count and is submitted once to the existing local ranking gateway.
- [x] The pit schedule and 200m exclusion API are deterministic and reusable by later spawners.

## Validation

- `npm run test -- src/game/runner/PitSpawner.test.ts src/game/runner/RunnerScene.test.ts src/game/runner/RunnerSimulation.test.ts src/game/runner/RunnerIntegration.test.ts` — pit contact, finish reason, stable result, and recovery assertions pass.
- `npm run typecheck` — finish reason propagates through game callbacks.

## Commit Message

```text
feat(runner): add jumpable fatal pit hazards

Plan: 2026-10-27-runner-course-gates-pits-ui-polish
Phase: P01-runner-course
Task: T02-pit-hazard

- Add a tutorial pit and spaced pit schedule with biome-aware art
- End grounded pit falls as a distinct game-over result
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: `feat(runner): add jumpable fatal pit hazards`
