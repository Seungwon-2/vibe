# T02 Theme scenery

Status: done

## Goal
Four recognizable, distinct theme illustrations with quiet hazard lane and cached rendering.

## Implementation
- New src/game/visuals/runnerSceneryArt.ts :: drawSceneryLayer(graphics: Phaser.GameObjects.Graphics, biome: RunnerBiomeDefinition, layer: 'far'|'middle'): void; drawScenerySky(graphics, biome): void; getScenerySkyColor(id: RunnerBiomeId): number. Deterministic code-native Graphics: fillRect, fillRoundedRect, fillEllipse, fillCircle, fillTriangle, lineStyle/lineBetween. Separate muted scenery palette from unchanged hazard palette.
- Dawn: broad roofline, large clock tower and small window groups. Forest: large canopy, trunks and moon. Mine: faceted roof/cavern, large inset crystals, supports. Sky: suspended islands with pavilion arches.
- Tile artwork 480x540, sky960x540. Major detail above y=350, middle silhouettes fade by y=400; y400..470 quiet. Only ground moves in calm. Repeat edge continuity and no per-frame drawing/randomness.
- RunnerBackdrop.ts replaces old drawHorizon/Far/Middle/Sky helpers with new module. Preserve drawNear, offsets, cache ownership, mode switching, story fixed biome and crossfade. Remove redundant fading that made outlines indistinct. Do not touch biome hazard palettes.
- runnerSceneryArt.test.ts plus RunnerBackdrop.test.ts: distinct theme operation signatures, deterministic calls, no detailed scenery in lower lane, existing texture counts/teardown/no moving allocations preserved.

## Acceptance / validation
- `npm test -- src/game/visuals/runnerSceneryArt.test.ts src/game/visuals/RunnerBackdrop.test.ts`
- `npm run build`
- Source-driven SVG/sharp static preview for all four themes; inspect resulting image. No browser performance claim from static artifact.

## Commit
feat(game): rebuild four themed backgrounds with clear quiet scenery

Plan: 2026-11-17-runner-scenery-and-protection-cue

Validation: 6 art/cache tests and build passed. Source-driven four-theme PNG inspected; distinct landmarks, quiet lower lane, no clipped landmark bodies. Static preview is not live gameplay/performance evidence.
