# Task: T03 Runner Scenery Validation

## Status: pending

## Goal

Verify the new art across a complete run and ensure the UI, player, hazards, collectibles, and biome boundaries stay readable without changing run behavior.

## Decision Summary

- Visual acceptance includes every biome at 960×540 and compact landscape sizes 844×390 and 667×375.
- Validate 0m, 2,500m, 5,000m, and 7,500m scenery state and preserve event-driven one-time bonus behavior.

## Implementation

### I01. Full visual and regression review

- Related Files:
  - `src/game/visuals/runnerBiomes.test.ts` :: palette/contrast tests; read-only unless fixes are needed.
  - `src/game/visuals/RunnerBackdrop.test.ts` :: backdrop transition tests; read-only unless fixes are needed.
  - `src/game/runner/RunnerSimulation.test.ts` :: distance, ramp, gate, and timer invariants; read-only.
  - `src/app/components/RunnerHud.test.tsx` :: HUD values and warning state; read-only unless contrast state semantics need a test.
  - `.memory/phases/2026-10-27-character-selector-visual-refresh/P02-runner-scenery/phase.md` :: progress; update on completion.

#### Details

- Run the complete suite, typecheck, lint, and build.
- Capture all four biomes at 960×540, 844×390, and 667×375. Inspect first course section, regular hazard patterns, all three gate landmarks, and at least one biome crossfade.
- Confirm runner sprite silhouette contrasts against each biome, ground/overhead hazards are readable, +3s pickups differ from coins, gate/bonus cue is clear, and HUD remains legible.
- Confirm a full run does not pause/reset distance or timer at transitions; gates award only once; no scenery decoration shifts player or collision geometry.
- Record viewport captures and any residual limitations here; update P02 progress.

## Acceptance Criteria

- [ ] Four themes and all three transitions are readable at all required landscape sizes.
- [ ] The player, hazards, pickups, gates, and HUD remain visually distinct.
- [ ] Time/distance/gate/reward and collision behavior are unchanged.
- [ ] Full automated validation passes.

## Validation

- `npm test` — all application and game invariants.
- `npm run typecheck` — full TypeScript validation.
- `npm run lint` — full lint.
- `npm run build` — production build.
- Manual: capture 960×540, 844×390, and 667×375 views for all four themes and boundary crossfades.

## Commit Message

```text
test(visuals): verify pastel course readability

Plan: 2026-10-27-character-selector-visual-refresh
Phase: P02-runner-scenery
Task: T03-scenery-validation

- Review themes, obstacles, HUD, and gates across the full run
- Verify transitions preserve gameplay invariants
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

