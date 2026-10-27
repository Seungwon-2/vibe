# Task: T04 Themed Hazard Silhouettes

## Status: pending

## Goal

Replace the shared rounded-rectangle body behind low and overhead obstacles with recognizable biome-specific pastel silhouettes that stay within the current visible footprint and leave physics boxes unchanged.

## Decision Summary

- Render four themes using local Phaser Graphics; do not add network or raster assets.
- Keep art inside each `HazardDefinition.width`/`height`; Arcade rectangles remain authoritative collision geometry.

## Implementation

### I01. Draw biome-specific hazard silhouettes

- Related Files:
  - `src/game/visuals/runnerHazards.ts` :: `drawRunnerHazard` — draw low/overhead silhouettes by biome without common box; modify
  - `src/game/visuals/runnerBiomes.ts` :: `RunnerBiomeDefinition.palette` — read existing theme colors; read-only
  - `src/game/runner/hazardTypes.ts` :: `HazardDefinition` — preserve dimensions and kind; read-only
  - `src/game/runner/ObstacleSpawner.ts` :: `spawn` — preserve transparent physics body and art transform; read-only
  - `src/game/visuals/runnerHazards.test.ts` — update footprint/signature assertions; modify

#### Details

- Preserve signature:
  ```typescript
  export function drawRunnerHazard(
    graphics: Phaser.GameObjects.Graphics,
    definition: HazardDefinition,
    biome: RunnerBiomeDefinition,
  ): void;
  ```
- Remove the unconditional full-hitbox `fillRoundedRect`/`strokeRoundedRect`; do not draw a square panel behind each silhouette.
- Keep primitives inside `[0,width] × [0,height]`. Use existing `groundFace`, `groundTop`, `middle`, `gate`, `accent`, and `hazardContrast` palette fields with clear scene contrast.
- Low silhouettes: dawn-city street parcel/barrier; moonlit forest mushroom or stump; crystal mine faceted crystal cluster; cloud skyway soft cloud obstruction and wind mark.
- Overhead silhouettes: hanging city sign/cable; forest branch/vine; mine stalactite; skyway wind chime/cloud streamer. Fit the existing 64×36 overhead footprint.
- Preserve `HazardDefinition` dimensions, `getHazardGeometry`, Arcade body size, overlap, warning position, and scrolling. Do not enlarge/reposition hitboxes to match art.

### I02. Verify art bounds and theme signatures

- Related Files:
  - `src/game/visuals/runnerHazards.test.ts` :: art-bounds and silhouette tests — update

#### Details

- For all four biomes and both hazard kinds, assert every Graphics primitive stays within the definition footprint.
- Assert ground and overhead signatures differ within every biome, and same-lane signatures differ across biomes.
- Assert the renderer no longer draws a common full-width/full-height rounded rectangle for every hazard.

## Acceptance Criteria

- [ ] Low and overhead hazards read as different, biome-appropriate objects instead of generic blocks.
- [ ] All decorative primitives stay within the previous footprint.
- [ ] Physics size, collisions, spacing, and warning behavior are unchanged.

## Validation

- `npm run test -- src/game/visuals/runnerHazards.test.ts` — silhouette and footprint tests pass.
- `npm run typecheck` — Graphics and palette calls compile.

## Commit Message

```text
feat(visuals): replace runner hazard blocks with themed silhouettes

Plan: 2026-10-27-runner-object-tutorial-polish
Phase: P01-runner-presentation
Task: T04-themed-hazards

- Draw distinct low and overhead silhouettes for all four biomes
- Keep every hazard sprite inside its existing collision footprint
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
