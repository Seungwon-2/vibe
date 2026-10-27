# Task: T01 Four Pastel Biome Backdrops

## Status: pending

## Goal

Redraw the four distance-based runner scenes as clearer layered pastel illustrations that fit the cloud-white/sky-blue UI and retain each biome's distinct landmark identity.

## Decision Summary

- Continue drawing locally with Phaser `Graphics` and generated textures; do not add raster files or remote asset dependencies.
- Preserve 0m dawn city, 2,500m moonlit forest, 5,000m crystal mine, and 7,500m cloud skyway boundaries, parallax speeds, continuous ground, and the 750ms crossfade.
- Decoration must never alter physics/collision, hazard placement, pickup rewards, or distance progression.

## Implementation

### I01. Tune biome palette values

- Related Files:
  - `src/game/visuals/runnerBiomes.ts` :: `RunnerBiomeDefinition`, `RUNNER_BIOMES`, `getBiomeForDistance`; modify palette values only.
  - `src/game/visuals/runnerBiomes.test.ts` :: palette boundary/contrast tests; modify.

#### Details

- Keep `RunnerBiomeDefinition` fields and biome order unchanged. `palette` remains numeric hex fields: `sky`, `far`, `middle`, `ground`, `accent`, `hazardContrast`, `groundTop`, `groundFace`, `pickupCoin`, `pickupTime`, and `gate`.
- Use four distinct sky colors within the agreed light pastel range; use a different theme accent for each: dawn city warm peach, moonlit forest pale gold/mint, crystal mine lavender/cyan, cloud skyway pale gold/blue.
- Preserve or improve the existing `hazardContrast` WCAG ratio of at least 4.5:1 against `ground`; keep ground top, coin, and time pickup colors pairwise distinct.
- Leave `startDistanceMeters`, `landmark`, `RUNNER_GATE_DISTANCES_M`, and the `getBiomeForDistance` threshold semantics unchanged.

### I02. Redraw layered environmental illustration

- Related Files:
  - `src/game/visuals/RunnerBackdrop.ts` :: `drawSkyDetail`, `drawFar`, `drawMiddle`, `drawNear`, `RunnerBackdrop`; modify.
  - `src/game/visuals/RunnerBackdrop.test.ts` :: generated layer, texture lifecycle, parallax, crossfade; modify only for rendering invariants.

#### Details

- Keep 960×540 scene dimensions, `TILE_WIDTH = 480`, and `GROUND_Y = 470`.
- Preserve exported constants `BIOME_CROSSFADE_MS = 750` and `PARALLAX_RATIOS = { far: 0.15, middle: 0.4, near: 1 }` exactly.
- Keep the five-child backdrop container order (sky, sky detail, far, middle, near), generated texture cleanup, deterministic graphics, and world-distance offsets. Do not add `Math.random` or frame-dependent placement.
- Redraw the four compositions in pastel layers: dawn rooftops/clouds and soft sunrise; rounded moonlit canopy, lanterns and fireflies; faceted but rounded lavender crystal formations and mine supports; bright cloud banks and airy sky arches. Keep the player/hazard/pickup gameplay lane from y=260 through ground clear of dense details.
- Keep ground a decorative band on the existing ground y; do not create or remove physics bodies. Maintain sufficient separation between each layer so the scenery remains readable at 960×540 and compact landscape aspect ratios.

## Acceptance Criteria

- [ ] Four palettes have unique sky and theme accents with readable hazard contrast.
- [ ] Four scenes read clearly as the existing dawn city, moonlit forest, crystal mine, and cloud skyway in a pastel fairytale style.
- [ ] Parallax, transition duration, texture cleanup, biome thresholds, and gameplay geometry are unchanged.
- [ ] Player and gameplay-critical lane remain uncluttered at full game scale.

## Validation

- `npm test -- src/game/visuals/runnerBiomes.test.ts src/game/visuals/RunnerBackdrop.test.ts` — palette, contrast, transitions, parallax, texture lifecycle.
- `npm run lint` — TypeScript/Phaser source.
- `npm run build` — production bundle.
- Manual: inspect all four generated scenes at 960×540 and 844×390; test 2,500m/5,000m/7,500m transitions.

## Commit Message

```text
feat(visuals): redraw runner biomes in pastel style

Plan: 2026-10-27-character-selector-visual-refresh
Phase: P02-runner-scenery
Task: T01-biome-backdrops

- Add storybook pastel layers for the four existing biomes
- Preserve course timing, transitions, and clear gameplay lanes
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

