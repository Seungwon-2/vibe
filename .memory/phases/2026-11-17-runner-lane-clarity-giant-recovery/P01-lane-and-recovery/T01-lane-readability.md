# T01 Lane readability

Status: done

## Target files and symbols
- src/game/visuals/RunnerBackdrop.ts: getParallaxOffsets, drawNear, createSet. calm far/middle=0, near=worldDistance; no dense diagonal floor seams; preserve cached textures and standard parallax.
- src/game/visuals/runnerHazards.ts: drawRunnerHazard. Strong boundary and limited face accents within existing art bounds; preserve crawl opening and collision geometry.
- src/game/runner/CollectibleSpawner.ts: drawPickupArt. Gold coin rim, inset shade and static glint; unchanged size, collection and placement.
- Associated RunnerBackdrop.test.ts, runnerHazards.test.ts, CollectibleSpawner.test.ts regression assertions.

## Models
RunnerVisualMode unchanged; offsets Record<'far'|'middle'|'near', number>. No physics/save/API schema change.

## Validation
`npm test -- src/game/visuals/RunnerBackdrop.test.ts src/game/visuals/runnerHazards.test.ts src/game/runner/CollectibleSpawner.test.ts`
`npm run build`

## Commit
fix(game): stabilize scenery and clarify collectible and hazard edges

Plan: 2026-11-17-runner-lane-clarity-giant-recovery

Validation: 31 focused tests and production build passed. Browser comfort comparison pending.

