# Task: T01 Selector Art and Fit

## Status: done

## Goal

Replace pixelated atlas previews in character cards with the high-resolution supplied full-body illustrations, use the supplied quality run frames only in the lower preview rail, and ensure the five cards never wrap into multiple rows.

## Decision Summary

- Card art uses static `portrait-quality.webp` files from the supplied screen asset pack. Card images do not use the runtime sprite atlas or animation.
- Lower rail alone uses 12 quality run frames per character at 20 fps. Preserve high-resolution interpolation (`image-rendering: auto`).
- Desktop cards stay as five equal columns when they fit; smaller widths use a single-row horizontal scroller. No second row for the fifth card.
- Preserve Korean names, passive icons/effects, selection accent, button actions, and internal IDs.

## Implementation

### I01. Add and wire supplied high-resolution artwork

- Related Files:
  - `public/assets/character/selector-art/{id}.webp` :: five full-body illustrations from `public/assets/title/stella-runner-start-screen (1)/assets/{rin,hiyori,mary,toa,rang}/portrait-quality.webp`; copy and add.
  - `public/assets/character/selector-art/runs/{id}/run-01..12.{png|webp}` :: supplied run sequences; copy and add.
  - `src/app/screens/CharacterSelect.tsx` :: card art and preview rail; replace card `CharacterPreview` with static `<img>` and lower rail preview with high-quality runner component.
  - `src/app/components/SelectorRunnerPreview.tsx` :: new 12-frame animation component.

#### Details

- Use stable character IDs and explicit asset map:
  - `player-default` → `/assets/character/selector-art/aokumo-rin.webp`; run frames `/assets/character/selector-art/runs/player-default/run-01.png` through `run-12.png`.
  - `hanayo-hiyori` → `hanayo-hiyori.webp`; WebP frames under `runs/hanayo-hiyori/run-01.webp` through `run-12.webp`.
  - `tokino-mary` → `tokino-mary.webp`; WebP frames under matching `runs/tokino-mary/`.
  - `goth-student` → `shizuki-toa.webp`; WebP frames under `runs/goth-student/`.
  - `cogane-rang` → `cogane-rang.webp`; WebP frames under `runs/cogane-rang/`.
- Use `<img className="character-card__illustration" src={...} alt="" draggable={false} />` in card image wells; maintain existing button `aria-label`, selection, disabled state, and passive details.
- Add `SelectorRunnerPreview({ frames, alt? })` with a frame index state. Advance frame index every 50 ms (20 fps) using `window.setInterval`; clear interval on unmount. Preload the component's frame list once per instance with `new Image()` so sequential playback does not flash blank frames. Render only one current `<img>` with `image-rendering: auto`, `object-fit: contain`, and no sprite atlas.
- The card static `<img>` must not be marked with animated classes or receive animation CSS. The preview rail remains the only source of running motion.

### I02. Enforce a one-row roster and preserve readability

- Related Files:
  - `src/styles/global.css` :: `.character-roster--runner`, `.character-card--runner`, `.character-card__art--runner`, `.selector-runway`; update.

#### Details

- Above 1280 px viewport width: `display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); grid-template-rows: minmax(0, 1fr); flex-wrap: nowrap;` and no row auto-placement that could create a sixth track.
- At or below 1280 px: use a single-row flex scroller with `flex-wrap: nowrap`, `overflow-x: auto`, `scroll-snap-type: x mandatory`, and card basis `clamp(200px, 24vw, 260px)`; mobile basis `min(78vw, 300px)`. Keep scrollbars/edge indication visible.
- Card well uses `display:grid; place-items:center; overflow:hidden;`; illustration has `width:100%; height:100%; object-fit:contain; image-rendering:auto;`. Do not clip the transparent full-body composition; use inner padding.
- Remove rules that apply `pixelated` to card art. Keep atlas rendering untouched for in-game sprites; the runway uses raster frame files and must stay smooth.
- Preserve all existing passive and button styles, selected accent borders, and focus states.

### I03. Update selector tests and verify

- Related Files:
  - `src/app/screens/CharacterSelect.test.tsx` :: card artwork and animation-source tests; modify.

#### Details

- Assert each card has a static `<img.character-card__illustration>` with the correct selector-art URL and no animated atlas image.
- Assert each of five runner previews has the correct first frame URL and updates to the next frame at 50 ms; use fake timers and verify cleanup on unmount.
- Retain tests for order, passive icon/name/effect, selection outline, start label, stable callback IDs, and lower rail animation.

## Acceptance Criteria

- [x] All five card illustrations use high-resolution static art and no atlas frame.
- [x] Lower rail alone plays the 12 source quality frames at 20 fps.
- [x] At desktop, five cards are one row; at narrow widths, they scroll horizontally without wrapping.
- [x] Passives, selection, start behavior, and stable IDs continue to work.
- [x] Focused tests and build pass.

## Validation

- `npm run test -- src/app/screens/CharacterSelect.test.tsx`
- `npm run build`
- Review the local selector at desktop and mobile landscape widths if browser tooling is available.

## Commit Message

```text
fix(selector): use crisp art and keep five cards in one row

Plan: 2026-10-30-selector-illustration-and-fit
Phase: P01-selector-visuals
Task: T01-selector-art-and-fit

- Use supplied high-resolution still and run artwork
- Prevent roster cards from wrapping into a clipped second row
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm run test -- src/app/screens/CharacterSelect.test.tsx`; `npm run build`)
- commit: pending
