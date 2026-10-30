# Task: T02 Quality Gameplay Sprites

## Status: in_progress

## Goal

Render all five live runners and result animations from the supplied high-resolution transparent motion frames while preserving the current logical 96×96 player size, baseline, and hitbox behavior.

## Decision Summary

- Use source sequences from `public/assets/title/stella-runner-start-screen (1)/assets/{rin,hiyori,mary,toa,rang}`. Rin sources are 192×192 PNG; the other four characters use 384×384 WebP.
- Copy non-run action frames to `public/assets/character/game-motion/{character-id}/`; reuse existing selector-quality run frame files for gameplay. Map `hit→hurt`, `double→doubleJump`, and `cry→gameOver`; map `idle/start` to the run frames only as fallbacks.
- Phaser loads each selected character's individual animation frame as an image texture and animation entries use each frame texture key. Preserve gameplay collision calculations independently from image size.

## Implementation

### I01. Quality frame model and source assets

- Related Files:
  - `src/game/characters/characterTypes.ts` :: `CharacterDefinition`, new `CharacterFrameRef` — store logical source scale/pivot and each action's `textureKey`/`url`; modify.
  - `src/game/characters/characterCatalog.ts` :: `createCharacter`, per-character quality frame map — define exact source frame URL lists and mappings; modify.
  - `public/assets/character/game-motion/{id}/` :: hit, slide, jump, double, victory, cry frames — copy selected source frames for all five characters; add.
  - `public/assets/character/selector-art/runs/{id}/` :: existing run frames — reuse, do not duplicate.

#### Details
- Define:
  ```ts
  export type CharacterFrameRef = Readonly<{ textureKey: string; url: string }>;
  export type CharacterQualityAnimations = Readonly<Record<CharacterAnimationName, readonly CharacterFrameRef[]>>;
  ```
- Add `qualityAnimations: CharacterQualityAnimations`, `qualityFrameSize: 192 | 384`, `qualityPivotY: 180 | 360`, and `qualityScale: 96 / qualityFrameSize` to each `CharacterDefinition`.
- Character directory mappings:
  - `player-default` source dir `rin`, size 192, pivot 180: run `run-v3-NN.png`; hurt `hit-v4-NN.png`; slide `slide-NN.png`; jump `jump-v4-NN.png`; doubleJump `double-v4-NN.png`; victory `victory-v4-NN.png`; gameOver `cry-v4-NN.png`.
  - `hanayo-hiyori` source dir `hiyori`, size 384, pivot 360: run `run-quality-NN.webp`; hurt `hit-quality-NN.webp`; slide `slide-quality-NN.webp`; jump `jump-quality-NN.webp`; doubleJump `double-quality-NN.webp`; victory `victory-quality-NN.webp`; gameOver `cry-quality-NN.webp`.
  - `tokino-mary` source dir `mary`, same quality suffix scheme as Hiyori.
  - `goth-student` source dir `toa`, same quality suffix scheme.
  - `cogane-rang` source dir `rang`, same quality suffix scheme.
- Each `CharacterFrameRef.textureKey` is unique: `${characterId}:quality:${animationName}:${1-based-frame-number}`. URLs are absolute public paths `/assets/character/game-motion/${characterId}/${animationSlug}-${NN}.${ext}`; run URLs point to `/assets/character/selector-art/runs/${characterId}/run-${NN}.${runExt}`.
- Sequence counts: run 12; hurt/slide/jump/doubleJump/victory/gameOver 6 each. `idle` points at run frame 1; `start` uses run frames 1–6. Other states use their matching action names as listed.
- Copy for each character only six non-run state sequences (36 frames per character, 180 files total). Keep supplied PNG/WebP format. Do not alter the original title bundle.

### I02. Phaser high-resolution rendering with normalized physics

- Related Files:
  - `src/game/runner/RunnerScene.ts` :: `preload`, `create` animation frame construction, initial player sprite — load selected character quality textures and animate from them; modify.
  - `src/game/runner/RunnerPlayer.ts` :: constructor, `applyPose`, `snapToGround`, `play` — use `qualityScale` and quality texture keys while keeping world hitboxes stable; modify.
  - `src/game/runner/runnerPose.ts` :: `STANDING_SPRITE_Y`, terminal/slide alignment helpers — derive baseline offset from source size, pivot, and quality scale; modify.
  - `src/game/runner/hurtAnimation.ts` :: `getHurtAnimationFrames` — make frame duplicator generic over frame refs; modify only as required for type compatibility.

#### Details
- In `preload`, flatten `Object.values(character.qualityAnimations)`, deduplicate by `textureKey`, and call `this.load.image(frame.textureKey, frame.url)` for each selected-character frame. Keep loader error handling. Do not load the old atlas for the live player.
- Construct Phaser animation frames as `frames.map(({ textureKey }) => ({ key: textureKey }))`; the initial sprite uses the first quality run frame's texture key. Action groups keep existing playback cadence and repeat behavior from `RunnerScene.create`.
- Keep jump impulse and `STANDING_BODY_*`/`SLIDING_BODY_*` world dimensions. The effective object scale is `qualityScale * poseScale * giantMultiplier`. To keep world body size unchanged, use local `body.setSize(worldWidth / effectiveScale, worldHeight / effectiveScale)` and local offsets divided by `effectiveScale`.
- Feet alignment uses source pivot: `spriteY = RUNNER_GROUND_Y + (qualityFrameSize - qualityPivotY) * qualityScale`; when an action pose has a relative scale, multiply the pivot gap by that pose scale. Normal character scale is `qualityScale`; giant adds only the existing 1.35 multiplier.
- Do not change jump/second-jump velocities, gravity, collision boundaries, invulnerability, fall timing, or obstacle geometry.
- `RunnerPlayer.play` checks `qualityAnimations[catalogName]` and plays `${characterId}:${actionName}`; jump fall phases continue to reuse the correct quality jump sequences.

### I03. High-resolution result preview and tests

- Related Files:
  - `src/app/components/CharacterPreview.tsx` :: animation frame selection — render individual quality frame URLs using an interval and `image-rendering:auto`; modify.
  - `src/game/characters/characterRegistry.test.ts` :: registry quality asset tests — assert frame counts, URL mapping, scale, and pivot; modify.
  - `src/game/runner/RunnerPlayer.test.ts` or the existing player test suite :: effective scale and unchanged world hitboxes/baseline; modify.
  - `src/game/runner/RunnerScene.test.ts` :: texture load and quality animation frames; modify.

#### Details
- `CharacterPreview` must render one `<img>` at a time, advance by `window.setInterval` using action FPS (run 20; other source action cadences in `characters.json`; for unspecified states use 10), preload frames, and clean up. Preserve `loop`, selected/variant wrappers, `data-animation`, alt text, and test IDs.
- Registry tests assert all 5 characters have 12 run and 6 each of hit/slide/jump/double/victory/cry-based sequences; `idle` and `start` are documented aliases. Validate URLs have no missing local file for required copied actions.
- Player tests assert each character's rendered frame scale is 0.5 for Rin and 0.25 for the others; effective standing collider remains 40×76 world pixels and slide collider remains existing 80×48 (or the existing character-specific slide width); source coordinate changes do not alter jump impulse.
- Result component tests retain victory/game-over selection but now assert that an individual high-quality frame is used instead of the atlas sheet.

## Acceptance Criteria

- [ ] Phaser gameplay uses source-quality animation frames for run, jump, double jump, slide, hit, victory, and game-over for all five characters.
- [ ] Result preview uses quality images; no visible live player/result uses the 96×96 atlas.
- [ ] Character display footprint, foot baseline, jump arc, and hitbox dimensions remain unchanged.
- [ ] Existing player motion and collision tests plus character registry tests pass.
- [ ] Production build passes.

## Validation

- `npm run test -- src/game/characters/characterRegistry.test.ts src/game/runner/RunnerScene.test.ts src/game/runner/RunnerPlayer.test.ts src/app/screens/RunResult.test.tsx src/app/screens/CharacterSelect.test.tsx`
- `npm run build`
- `npm run assets:validate` (legacy atlas remains unchanged)

## Commit Message

```text
feat(game): render quality character motion in the runner

Plan: 2026-10-30-selector-viewport-and-game-sprites
Phase: P01-viewport-and-motion
Task: T02-quality-gameplay-sprites

- Load supplied high-resolution action frames for the live player
- Preserve 96px gameplay scale and collision geometry
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
