# Task: T05 Themed Pickups, Gates, and Pits

## Status: pending

## Goal

Replace block-like pickup, gate, and pit art with biome-specific silhouettes while preserving display positions, rewards, and collision sensor sizes.

## Decision Summary

- Keep Phaser Graphics and the existing pastel palettes; theme coins, clocks, gates, and pit edges in all four biomes.
- Art stays decorative; pickup/pit sensors, gate rewards, distances, and collision dimensions do not change.

## Implementation

### I01. Extract and draw course landmark art

- Related Files:
  - `src/game/visuals/runnerCourseObjects.ts` :: `drawRunnerGate`, `drawRunnerPit` — shared biome-specific landmark drawings; new
  - `src/game/visuals/runnerBiomes.ts` :: `RunnerBiomeDefinition` — palette/theme identity; read-only
  - `src/game/runner/CollectibleSpawner.ts` :: `drawPickupArt`, gate-art creation — retain pickup renderer and call gate renderer; modify
  - `src/game/runner/PitSpawner.ts` :: pit-art creation — call pit renderer without moving the sensor; modify
  - `src/game/visuals/runnerCourseObjects.test.ts` — new gate/pit footprint and theme tests; new
  - `src/game/runner/CollectibleSpawner.test.ts` — update pickup art assertions; modify
  - `src/game/runner/PitSpawner.test.ts` — assert sensor invariants; modify

#### Details

- **Signatures & Types**:
  ```typescript
  export function drawRunnerGate(
    graphics: Phaser.GameObjects.Graphics,
    biome: RunnerBiomeDefinition,
  ): void;

  export function drawRunnerPit(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    biome: RunnerBiomeDefinition,
  ): void;
  ```
- Gate art extent remains x `[-28,28]`, y `[-168,0]`. It remains depth `-5`; retain current `+20s` text placement and award trigger.
- Pit art extent remains x `[-width/2,width/2]`, y `[0,36]`, at `RUNNER_GROUND_Y`, depth `-1`. Keep `PitDefinition.widthMeters` and the separate 4px overlap zone.
- Gate motifs: city transit arch; moonlit branch/moon arch; crystal arch; cloud/rainbow arch. Do not use one generic filled rectangle for all gate themes.
- Pit motifs: broken pavement; root-lined earth; crystal mine cut; separated cloud banks. Keep a dark, readable center and the configured opening width.
- In `drawPickupArt`, preserve coin radius 11px and time-pickup extent 22×22, but remove the square outer frame from the time item. Preserve coin emblems and palette contrast; make the time item read as a clock/token silhouette.
- Do not alter sensor sizes, pickup heights, Mary's passive radius, stable schedule, +3s pickup value, +20s gate value, or landmark positions.

### I02. Test themed art and preserved geometry

- Assert four gate signatures differ and remain inside declared bounds.
- Assert all pit primitives stay inside the width×36 art footprint and below ground.
- Assert coin/time outer shapes are distinct, time art is no longer a square frame, and outline calls use `hazardContrast`.
- Assert rendering changes do not alter physics rectangle dimensions or gate/pickup position calculations.

## Acceptance Criteria

- [ ] All four biomes show distinct, readable pickup, gate, and pit imagery without generic square panels.
- [ ] Renderer art stays within its declared bounds and uses current biome palettes.
- [ ] Pit/gate physics, rewards, schedule, and scrolling remain unchanged.

## Validation

- `npm run test -- src/game/visuals/runnerCourseObjects.test.ts src/game/runner/CollectibleSpawner.test.ts src/game/runner/PitSpawner.test.ts` — art, bounds, and physics invariants pass.
- `npm run typecheck` — renderer and spawner interfaces compile.

## Commit Message

```text
feat(visuals): theme runner pickups gates and pit edges

Plan: 2026-10-27-runner-object-tutorial-polish
Phase: P01-runner-presentation
Task: T05-themed-course-objects

- Draw biome-specific pickups, gate landmarks, and pit edges
- Preserve all collision and reward geometry
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
