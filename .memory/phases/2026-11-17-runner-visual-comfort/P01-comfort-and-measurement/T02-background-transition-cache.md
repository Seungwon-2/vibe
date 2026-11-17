# Task: T02 Background Transition Cache

## Status: pending

## Goal
Remove measured synchronous texture-generation work from moving theme transitions while bounding scene texture ownership.

## Decision Summary
- Measure before optimizing, never claim headless timings describe real player hardware.
- Per-scene caching; maximum four biomes × two presentation modes × three layers. No cross-run global cache.

## Implementation
### I01. Measure old transition
- Use isolated local browser and scene backdrop calls to record normal frame and 2,000m transition costs for calm/standard, cold/warm iterations. Store developer-only traces under ignored `test-results/runner-comfort/`.
### I02. Cache
- `src/game/visuals/RunnerBackdrop.ts` :: `ensureTextures`, `createSet`, `destroySet`, `destroy`.
- `private readonly ownedTextureKeys = new Set<string>()`. Mode-specific keys. Before countdown (constructor or paused mode change), generate missing textures for all four biomes of selected mode. In standard transition, create sprites from existing textures; `destroySet` destroys display objects only. `destroy()` removes each owned texture exactly once and clears ownership. No per-frame Graphics texture generation.
- Calm preserves stationary far layer and quiet colors; standard still crossfades. Physics and spawner schedule unchanged.
- `RunnerBackdrop.test.ts`: generation happens in initialization/mode switch, none at moving transitions or repeated mode selection; release all cached keys once; previous transition destroyed without releasing shared textures.

## Acceptance Criteria
- [ ] Browser measurement identifies transition work and reports before/after costs.
- [ ] No synchronous backdrop texture generation at moving gate transitions.
- [ ] Cached texture count bounded and teardown idempotent.

## Validation
- `npx vitest run src/game/visuals/RunnerBackdrop.test.ts`
- `npm run build` and `npm run lint`

## Commit Message
```text
perf(game): prepare backdrop textures before moving transitions

Plan: 2026-11-17-runner-visual-comfort
Phase: P01-comfort-and-measurement
Task: T02-background-transition-cache
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
