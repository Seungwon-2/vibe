# Task: T01 Five Motion Atlases

## Status: pending

## Goal

Create reproducible transparent 96×96 animation frames, 1152×480 atlases, and manifests from the five committed motion studies. The game must be able to load all five characters without displaying source titles, labels, cell grids, shadows, effects, or neighboring poses.

## Decision Summary

- Sources are the five `assets/character/reference/*-motion-study.png` files, each exactly 1536×1024 with an opaque pale background. Never overwrite them. Use their actual character poses rather than the rejected image-generation drafts.
- Each sheet has 12 RUN cells and eight six-cell action groups (HIT, SLIDE, JUMP, DOUBLE JUMP, VICTORY, CRY, IDLE, CHEER): 60 runtime frames per character. Preserve one character-wide scale and one bottom-center frame origin across actions; gameplay physics do not come from pixel bounds.

## Implementation

### I01. Source layout and alpha extraction

- Related Files:
  - `scripts/motion-study-layout.mjs` :: `MOTION_SHEETS`, `MOTION_BANDS`, `getMotionCellRect`, `getMotionFrameName`; new.
  - `scripts/build-motion-atlases.mjs` :: `extractMotionFrame`, `cutoutPaleBackground`, `normalizeMotionFrames`, `buildCharacterAtlas`, `validateCharacterAtlas`; new.
  - `scripts/character-frame-utils.mjs` :: `opaqueBounds`, `findOpaqueComponents`, `getAlignedOffset`; read-only or modify only for a reused helper.
  - `scripts/motion-study-layout.test.mjs` :: geometry, naming, alpha, dimensions, repeatability tests; new.
  - `assets/character/reference/{aokumo-rin,shizuki-toa,cogane-rang,hanayo-hiyori,tokino-mary}-motion-study.png` :: source images; read-only.

#### Details

- **Signatures & Types** (document in JSDoc in the `.mjs` modules):
  ```typescript
  type MotionBand = { sourceLabel: 'RUN'|'HIT'|'SLIDE'|'JUMP'|'DJUMP'|'VICTORY'|'CRY'|'IDLE'|'CHEER'; animation: 'run'|'hurt'|'slide'|'jump'|'double-jump'|'victory'|'game-over'|'idle'|'start'; left: number; right: number; top: number; bottom: number; count: 12|6 };
  type MotionSheet = { id: string; slug: string; prefix: string; sourcePath: string; accentColor: string; backgroundTolerance: number; cropOverrides?: Record<string, {left:number;top:number;width:number;height:number}>; keepComponents?: Record<string, Array<{left:number;top:number;right:number;bottom:number}>> };
  function getMotionCellRect(band: MotionBand, index: number): {left:number;top:number;width:number;height:number};
  function getMotionFrameName(sheet: MotionSheet, animation: MotionBand['animation'], index: number): string;
  async function buildCharacterAtlas(sheet: MotionSheet, checkOnly: boolean): Promise<void>;
  ```
- **Data & Schema Fields**:
  - `MOTION_SHEETS` order/IDs: `player-default`/`aokumo-rin`/empty prefix, `goth-student`/`shizuki-toa`/`goth-student-`, `cogane-rang`, `hanayo-hiyori`, `tokino-mary` with matching non-Rin ID prefixes. Their paths and accent colors are in the parent plan.
  - `MOTION_BANDS` atlas order: RUN 12; HIT 6; SLIDE 6; JUMP 6; DJUMP 6; VICTORY 6; CRY 6; IDLE 6; CHEER 6. Source-label to runtime-name mapping is exactly the `animation` field above. This packs RUN in atlas row 0, and two six-frame actions per subsequent row.
  - Initial interior crop bands in source pixels, adjusted per sheet only after inspecting source boundaries: RUN `left=69,right=1525,top=65,bottom=205`; HIT `69,746,237,362`; SLIDE `808,1525,237,362`; JUMP `69,746,393,519`; DJUMP `808,1525,393,519`; VICTORY `69,746,548,674`; CRY `808,1525,548,674`; IDLE `69,746,701,828`; CHEER `808,1525,701,828`. Treat right/bottom as exclusive and compute column boundaries with `floor(left + i*(right-left)/count)` to avoid non-integer widths. Explicit per-sheet/per-frame rectangle overrides must be committed when needed; never allow a cell to include its header strip or frame line.
  - Output frame names use zero-based, two-digit indexes: `run-00`…`run-11`, `hurt-00`…`hurt-05`, `slide-*`, `jump-*`, `double-jump-*`, `victory-*`, `game-over-*`, `idle-*`, `start-*`; add `${id}-` before the name for non-Rin frames. Preserve this order in `manifest.frames`.
- **Execution Flow / Logic**:
  1. Check each source exists, decodes as PNG, is 1536×1024, and matches the configured crop geometry. Fail with source/animation/frame name on invalid geometry.
  2. Extract each interior cell. Remove only edge-connected pale background based on per-sheet corner-color distance and configurable tolerance; avoid global white deletion because Rin/Hiyori/Mary have near-white hair and clothing. Remove detached labels, sparkles, shadows, and dust using component analysis and explicit crop/mask overrides while retaining character-linked hair, ears, tails, lantern, and teddy bear. No figure portion may be lost.
  3. Compute one scale factor per character from the maximum cleaned pose extent over all 60 frames, bounded by an 88×88 content area. Apply that factor to every pose without stretching or individual frame resizing. Place each pose on a transparent 96×96 canvas with horizontal center and the same bottom-center anchor (art bottom at y=91 unless a documented pivot correction is necessary). `frameWidth=96`, `frameHeight=96`, `contentPadding>=4` are invariants.
  4. Pack 12 columns × 5 rows, 96-pixel cells. Write `assets/character/runtime/{id}.png` and `{id}.json` with Phaser atlas `frames[name].frame={x,y,w:96,h:96}`, `rotated:false`, `trimmed:false`, 96×96 `spriteSourceSize`/`sourceSize`, and `meta.size={w:1152,h:480}`. Write inspectable `assets/character/runtime/frames/{frameName}.png`. Build a visual contact sheet per character under `assets/character/runtime/proofs/{id}-contact.png` on a checkerboard; this proof is QA output, not imported by the game.
  5. `--check` performs read-only validation: regenerate expected manifest and PNG buffers in memory, compare their SHA-256 digests with saved files, and check exactly 60 named frames, expected atlas coordinates, nonempty and transparent PNG cells, alpha bounds at least four pixels from each edge, and no foreign residue outside the character mask. Fail if runtime PNG/JSON is stale or absent. Source PNGs remain unchanged.
- **Error & Exception Handling**: Fail preparation with a descriptive frame ID rather than silently using old art if cutout empties a frame, cuts the primary component, exceeds the cell, or source dimensions change. Do not swallow filesystem or decoder errors. Record deliberate keep/mask exceptions in `MOTION_SHEETS` rather than adding a broad threshold that erases white costume details.

### I02. Produce selector art and make the pipeline the active command

- Related Files:
  - `assets/character/portraits/cogane-rang-portrait.png`, `hanayo-hiyori-portrait.png`, `tokino-mary-portrait.png` :: new, transparent 512×512 images derived from each sheet's bottom-left front REFERENCE figure (approximately x=69..250,y=842..993, with per-sheet crop corrections); no title, FRONT label, or frame border.
  - `assets/character/portraits/aokumo-rin-portrait.png`, `shizuki-toa-portrait.png` :: existing portrait assets; read-only.
  - `package.json` :: `scripts.assets:prepare`, `scripts.assets:validate`; modify to call `node scripts/build-motion-atlases.mjs` with/without `--check`.
  - `scripts/prepare-character-assets.mjs` and the four old `src/game/characters/*Atlas.json` source configs :: legacy implementation; read-only for comparison, not invoked by the new npm scripts.

#### Details

- Preserve front figure proportions when making new selector portraits; center in 512×512 transparent canvas, using nearest-neighbor upscaling for the SD look. The portrait is decorative; `CharacterPreview` continues to use the runtime idle/run atlas.
- Do not delete old Yuni/Lize source files or old runtime atlases in this task; P02 removes active imports. The build script emits only the five target atlases, so reruns do not modify unrelated historical assets.
- Visually inspect all five contact sheets and the three portraits at 1× and 2×. Specifically inspect Rin's blue/white hair, Toa's dark ponytail, Rang's ears/tail, Hiyori's pale hair/lantern, and Mary's hair/teddy for background holes or detached debris. Fix source-specific crop/mask configuration before accepting; frame-count and alpha tests alone do not prove art quality.

## Acceptance Criteria

- [ ] Five source sheets each produce 60 ordered transparent 96×96 frames and a 1152×480 runtime atlas/manifest; RUN occupies a contiguous first row for CSS preview animation.
- [ ] Twelve run poses visibly alternate arms and legs and loop without a cropped head, foot, hair, prop, or neighboring cell for every character.
- [ ] Six source poses exist for each remaining action, and title/labels/cell grid/shadows/sparkles are absent from game frames.
- [ ] Three new front-facing selector portraits exist; existing Rin/Toa portraits and all source PNGs are unchanged.
- [ ] `--check` catches missing, stale, opaque, empty, or edge-touching outputs without rewriting files.

## Validation

- `node --test scripts/motion-study-layout.test.mjs` — source geometry and output invariants.
- `npm run assets:prepare` — generates the five atlases, frame files, portraits, and proof sheets.
- `npm run assets:validate` — validates generated outputs read-only.
- `npm run build` — ensures locally stored PNG/JSON assets can be bundled; gameplay imports change in P02.
- Manual: inspect five checkerboard contact sheets and three front portraits, including zoomed frame transitions at RUN 11→00.

## Commit Message

```text
feat(assets): build unified five-character runner atlases

Plan: 2026-10-26-rin-unified-motion
Phase: P01-motion-assets
Task: T01-five-motion-atlases

- Extract aligned transparent motion frames from five source studies
- Generate reproducible runtime atlases and selector portraits
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
