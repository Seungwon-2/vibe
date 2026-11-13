# Task: T02 Hazard and Pit Readability

## Status: in progress

## Goal
Ensure a player can distinguish jump, slide, double-jump hazards, and a lethal pit early enough to react, with each object still matching its collision area and biome art.

## Decision Summary
- Keep collision geometry separate from decorative graphics.
- Retain four biome palettes and custom silhouettes; improve contrast, edge definition, and pit depth cues rather than using indistinguishable rectangular blocks.
- Tutorial warnings may remain limited to the first pit; visual pit shape itself must remain clear in all later appearances.

## Implementation

### I01. Audit hazard geometry and rendering
- Related Files:
  - `src/game/runner/ObstacleSpawner.ts` :: create/update hazard graphics; modify
  - `src/game/runner/hazardPatterns.ts` and `src/game/runner/hazardTypes.ts` :: hazard kind and dimensions; read-only unless geometry mismatch is found
  - `src/game/visuals/runnerCourseObjects.ts` :: themed pit/obstacle drawing helpers; modify
  - `src/game/runner/PitSpawner.ts` :: pit opening and retained art lifecycle; modify only if art is removed too early
  - corresponding `ObstacleSpawner.test.ts`, `PitSpawner.test.ts`, and visuals tests; modify/add
- Details
  - Inspect each hazard kind's display bounds and its `HazardDefinition` width/height. Render silhouette must cover the collision envelope without extending into visually safe space in a misleading way.
  - Give ground hazards a distinct ground-contact silhouette, overhead hazards a ceiling/obstruction silhouette that visibly closes the jump path while leaving the slide path, and double-jump barriers a clearly taller shape with a readable top edge.
  - Draw pits as an open gap with a dark/deep center, separated ground edges, and biome-specific rim details. Keep pit art visible through fatal fall/shake completion; do not remove the gap at contact time.
  - Use accessible contrast against both near and far background layers. Avoid relying on color alone: silhouette, outline, and optional motion/shine cue should distinguish hazard type.
  - Add visual unit assertions for dimensions/geometry where feasible; visually inspect all four biomes during play.

## Acceptance Criteria
- [ ] Each hazard kind is distinguishable without reading a tooltip.
- [ ] Overhead hazard artwork visibly communicates that jumping is blocked and sliding is the intended route.
- [ ] Pit openings look like gaps, show both edges and remain visible until the fall result transition completes.
- [ ] Graphics and collision bounds agree closely enough that no invisible collision wall or apparently safe lethal area is shown.

## Validation
- `npm run test -- --run src/game/runner/ObstacleSpawner.test.ts src/game/runner/PitSpawner.test.ts` — relevant tests pass.
- Manual review of jump, slide, double-jump, and pit encounters in all four biomes at desktop and mobile landscape sizes.
- `npm run assets:validate` — passes if this task changes any generated visual source/input.

## Commit Message
```text
fix(game): clarify hazard and pit silhouettes

Plan: 2026-11-12-runner-feedback-recovery
Phase: P01-readability-and-controls
Task: T02-hazard-and-pit-readability

- Align hazard art with its collision envelope
- Keep biome pit openings readable through the fall sequence
```

## Progress
- [x] Implementation complete
- [x] Automated validation passed: 19 relevant Vitest tests
- [ ] Manual visual inspection across four biomes and desktop/mobile landscape (browser automation host unavailable in this session)
- commit: pending

## Implementation Notes
- Added a consistent high-contrast top edge for double-jump barriers and lower edge for overhead slide barriers without changing collision geometry.
- Added outlined lips and vertical depth edges to pit openings in all four biome palettes. Pit retention behavior was already correct and remains unchanged.
- Extended the dark pit fill and both side edges from the ground opening to the bottom of the 960×540 playfield, so the lower floor pattern cannot visually continue through a lethal gap. The depth is derived from the Phaser viewport and ground line; collision geometry is unchanged.
- Corrected an initial geometry assumption during review: with `RUNNER_GROUND_Y = 470`, the existing 54px overhead opening leaves 6px above the 48px sliding collision body. No geometry change was needed.
- Verified with `npm run test -- --run src/game/runner/PitSpawner.test.ts src/game/visuals/runnerCourseObjects.test.ts src/game/runner/ObstacleSpawner.test.ts src/game/visuals/runnerHazards.test.ts` (19 tests) and `npm run build`.
