# Task: T01 Import Character Assets

## Status: done

## Goal

Bring the four existing characters' latest portrait, source-sheet, locomotion, and runtime atlas assets into `project02` without importing the old platformer implementation.

## Decision Summary

- Use `project02-running-action` as the local source ref. Keep `project01` unchanged; copy assets and asset tooling only.
- Stable IDs/names/colors: `player-default` / Aokumo Rin / `#2b66c0`; `goth-student` / Shizuki Toa / `#513661`; `moonwing` / Ayatsuno Yuni / `#857fd8`; `akane-lize` / Akane Lize / `#971b2f`.

## Implementation

### I01. Copy approved character sources and previews

- Related Files:
  - `assets/character/portraits/aokumo-rin-portrait.png` :: portrait for Rin; copy from source ref.
  - `assets/character/portraits/shizuki-toa-portrait.png` :: portrait for Toa; copy from source ref.
  - `assets/character/portraits/ayatsuno-yuni-portrait.png` :: portrait for Yuni; copy from source ref.
  - `assets/character/portraits/akane-lize-portrait.png` :: portrait for Lize; copy from source ref.
  - `assets/character/aokumo-rin-spritesheet-v4.png`, `goth-student-spritesheet-v2.png`, `moonwing-spritesheet-v2.png`, `akane-lize-spritesheet.png` :: full source action sheets; copy from source ref.
  - `assets/character/locomotion/*-locomotion-v1.png` :: all four source locomotion sheets; copy from source ref.
  - `assets/character/source/*-generated.png` and `*-locomotion-generated.png` :: retain regenerable generated source images; copy from source ref.
  - `src/game/characters/characterAtlas.json`, `gothCharacterAtlas.json`, `wingedCharacterAtlas.json`, `akaneCharacterAtlas.json` :: source crop/frame manifests; copy from source ref.
- Do not copy platformer-only scene code, worlds, boss systems, or stage saves.

#### Details

- Preserve source image bytes and transparency; do not resize or overwrite originals during the copy.
- Copy the `assets/character/runtime/` atlas PNG/JSON files and `runtime/frames/` folder as a temporary working baseline. T02 regenerates them after defining runner action frames.
- Keep portraits local in the repo so selector cards work offline on other PCs.

### I02. Port repeatable asset preparation tooling

- Related Files:
  - `scripts/character-frame-utils.mjs` :: frame crop/alpha helper; new, copied from source ref.
  - `scripts/prepare-character-assets.mjs` :: build/validate four runtime atlases; new, copied from source ref and revised by T02.
  - `scripts/normalize-character-sheet.mjs` :: source cleanup helper; new, copied from source ref.
  - `scripts/normalize-locomotion-sheets.mjs` :: locomotion cleanup helper; new, copied from source ref.
  - `package.json` :: add `sharp` development dependency and `assets:prepare` / `assets:validate` scripts.
  - `package-lock.json` :: update lockfile; modify.

#### Details

- Keep the target React/Vite/TypeScript/Vitest versions from `project02`; add the compatible `sharp` version and asset scripts used in the source ref. Do not replace the target `package.json` wholesale.
- `assets:prepare` runs `node scripts/prepare-character-assets.mjs`; `assets:validate` runs `node scripts/prepare-character-assets.mjs --check`.
- The validation script must fail with the character ID and frame name when an atlas or frame is missing or has incorrect dimensions.

## Acceptance Criteria

- [x] Four portraits, source sheets, locomotion sheets, generated source images, and runtime atlas baselines exist in `project02`.
- [x] All copied assets are local repository files and do not require external URLs.
- [x] No old platformer gameplay source was copied by this task.
- [x] `assets:prepare` and `assets:validate` scripts are present and dependency lock is updated.

## Validation

- `npm run assets:validate` — succeeds for all four current runtime atlases before T02 changes frame manifests.
- `npm run typecheck` — succeeds; asset scripts are plain Node ESM and do not enter the TypeScript source graph.

## Commit Message

```text
chore(assets): import four character art into project02

Plan: 2026-10-26-running-action-redesign
Phase: P01-characters-and-entry
Task: T01-import-character-assets

- Copy local portraits, source art, locomotion art, and runtime atlases
- Add repeatable character asset preparation tooling
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: see this task's commit in Git history
