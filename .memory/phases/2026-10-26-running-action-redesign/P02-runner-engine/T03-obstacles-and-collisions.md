# Task: T03 Obstacles and Collisions

## Status: pending

## Goal

Add deterministic, distance-scaled ground and overhead obstacles with clear warning cues and collision handling that uses the shared run simulation.

## Decision Summary

- Ground obstacles require a jump; overhead obstacles require a held slide. Patterns are authored and deterministic, never random or unavoidable.
- Give at least 1.25 seconds of visible approach warning and at least 1.0 second of recovery between consecutive required actions at current speed.

## Implementation

### I01. Define patterns and difficulty bands

- Related Files:
  - `src/game/runner/hazardTypes.ts` :: `HazardKind`, `HazardDefinition`, `HazardPattern`, `HazardBand`; new.
  - `src/game/runner/hazardPatterns.ts` :: `HAZARD_BANDS`, `HAZARD_PATTERNS`, `getPatternForDistance`; new.
  - `src/game/runner/hazardPatterns.test.ts` :: pattern validity and progression tests; new.

#### Details

- `HazardDefinition = { id: string; kind: 'ground' | 'overhead'; offsetMeters: number; width: number; height: number; warningColor: string }`.
- `HazardPattern = { id: string; minDistanceMeters: number; maxDistanceMeters: number | null; obstacles: readonly HazardDefinition[] }`.
- Difficulty bands are `<2500m` tutorial singles, `2500-4999m` single hazards with short paired practice, `5000-7499m` jump/slide combinations, and `>=7500m` denser combinations. Keep speed ramp in `RunnerSimulation`; pattern selection reads distance only.
- Use fixed authored pattern order. Each incoming pattern shows a color/shape cue and a warning marker at least 1.25s travel time ahead, using current `speedUnitsPerSecond`.
- Enforce at least 1.0s between the end of one required action window and the next required action. Patterns must remain dodgeable using only ground jump, one double-jump, and held slide. No gap/platform/pit hazards, moving enemies, or boss actions.
- Define collision boxes separately from decorative pixels and document each hazard's physical dimensions. Keep hazard art contrast distinct from the biome palette.

### I02. Spawn, resolve, and retire hazards

- Related Files:
  - `src/game/runner/ObstacleSpawner.ts` :: `ObstacleSpawner` distance-based creation/update; new.
  - `src/game/runner/RunnerScene.ts` :: hazard group, overlap callbacks, pattern cleanup; modify.
  - `src/game/runner/CollisionSystem.ts` :: `tryResolveHazardHit`; new.
  - `src/game/runner/CollisionSystem.test.ts` :: hit/protection and body geometry tests; new.

#### Details

- Spawn each hazard once when its pattern distance reaches the 1.25s lead window. Move it left by `snapshot.speedUnitsPerSecond * deltaMs / 1000` and destroy it after its right edge passes x=0.
- Use Arcade overlap between the active player body and hazard body; visual sprite bounds must not be the only collision definition. On overlap call `applyCollision(snapshot)` once, play `hurt`, flash the player during 800ms protection, stagger the actor, and remove/disable the hazard.
- Ignore additional overlap callbacks while `protectionRemainingMs > 0`. A hit ending the timer fires one `run-finished` event and stops future spawns.
- Provide Phaser `Graphics`-based pixel-art primitives for the baseline obstacle silhouettes; P03 may refine colors/decoration without changing dimensions or `HazardKind`.

## Acceptance Criteria

- [ ] Patterns progress by distance through all four difficulty bands and are repeatable.
- [ ] Every hazard type has a visible warning and a documented, accurate collision box.
- [ ] Pattern spacing meets the warning/recovery constraints at 325 units/s.
- [ ] Collision costs are delegated to the run model, trigger only once per protection window, and stop at timer zero.
- [ ] No random spawn can create an impossible sequence.

## Validation

- `npm test -- src/game/runner/hazardPatterns.test.ts src/game/runner/CollisionSystem.test.ts` — validates authored patterns and collision rules.
- `npm run typecheck` — validates Phaser group and hazard definitions.

## Commit Message

```text
feat(runner): add fair distance-scaled obstacle patterns

Plan: 2026-10-26-running-action-redesign
Phase: P02-runner-engine
Task: T03-obstacles-and-collisions

- Add jump and slide hazards with telegraphs and recovery spacing
- Apply collision penalties and protection through runner state
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
