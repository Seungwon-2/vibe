# Task: T02 Themed Hazards, Pickups, and Gates

## Status: pending

## Goal

Make obstacles, pickups, and reward gates fit the new biome illustrations and shared pastel atmosphere while keeping them immediately readable and mechanically unchanged.

## Decision Summary

- Use the shared biome palette fields and local code-rendered shapes.
- Do not change hazard definitions, dimensions, overlap rectangles, spawn patterns, item positions, or reward/event behavior.
- Gameplay object silhouettes and contrast take priority over decorative softness.

## Implementation

### I01. Harmonize hazard/pickup/gate rendering

- Related Files:
  - `src/game/visuals/runnerHazards.ts` :: `drawRunnerHazard`; modify visual drawing only.
  - `src/game/visuals/runnerHazards.test.ts` :: theme and collision-footprint drawing tests; modify.
  - `src/game/runner/ObstacleSpawner.ts` :: `spawnObstacle`; read-only unless a renderer call needs an existing palette field.
  - `src/game/runner/CollectibleSpawner.ts` :: pickup/gate drawing; modify rendering only if needed.
  - `src/game/runner/hazardPatterns.ts` :: `HAZARD_PATTERNS`; read-only.

#### Details

- Keep `HazardDefinition` geometry and Arcade overlap body exactly unchanged. Keep ground hazards visually below ground-run line and overhead hazards above crouched run lane.
- Use rounded pastel forms with a high-contrast dark-blue outline and a theme-specific identifying symbol. Keep jump hazard silhouettes distinct from overhead slide hazards at 960×540 and 844×390.
- Keep `drawRunnerHazard` fills within the existing `width`/`height` and test-defined visible collision footprint; do not draw decorative parts outside overlap bounds.
- Use `pickupCoin`, `pickupTime`, `gate`, `accent`, and `hazardContrast` from `RunnerBiomeDefinition.palette` consistently. Use dark icon/text marks on light pickups and gates; ensure coin and +3s/time pickups remain distinguishable without relying on hue alone.
- Keep all three +20s gate landmarks synchronized with existing `RUNNER_GATE_DISTANCES_M` and `gate` events. Do not award extra time due to palette transitions or rendering.

### I02. Verify art against course patterns

- Related Files:
  - `src/game/visuals/runnerHazards.test.ts` :: all four biome hazard variants; modify.
  - `src/game/runner/CollectibleSpawner.test.ts` :: pickup/gate theme drawing tests; modify if needed.
  - `src/game/runner/hazardPatterns.test.ts` :: pattern geometry; read-only.

#### Details

- Exercise both `ground` and `overhead` hazard kinds in every biome.
- Check that items do not visually disappear against the ground or background and that decorative changes leave interaction coordinates untouched.

## Acceptance Criteria

- [ ] Every biome has visibly themed ground and overhead obstacles, coins, time pickups, and gate cues.
- [ ] Hazards remain distinguishable from ground and scenery with at least 4.5:1 outline-to-ground contrast.
- [ ] Existing hitboxes, obstacle patterns, item/gate event triggers, and reward amounts remain unchanged.
- [ ] Existing renderer tests pass with no drawing outside configured geometry.

## Validation

- `npm test -- src/game/visuals/runnerHazards.test.ts src/game/runner/CollectibleSpawner.test.ts src/game/runner/hazardPatterns.test.ts` — themed variants and unchanged geometry/events.
- `npm run typecheck` — renderer contracts and palette usage.
- `npm run build` — production canvas bundle.
- Manual: compare both hazard kinds and pickups against each biome at native game size.

## Commit Message

```text
style(visuals): harmonize runner course objects

Plan: 2026-10-27-character-selector-visual-refresh
Phase: P02-runner-scenery
Task: T02-course-visuals

- Match hazards, pickups, and gates to each pastel biome
- Keep interaction footprints and rewards unchanged
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

