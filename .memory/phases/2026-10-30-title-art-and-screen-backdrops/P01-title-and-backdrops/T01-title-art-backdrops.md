# Task: T01 Title Art and Screen Backdrops

## Status: done

## Goal

Show the title illustration and heading clearly while preserving the menu dock, and reuse the illustration as a subtle background behind character selection and the outer gameplay screen.

## Decision Summary

- Move the title and description above the characters into the open sky region.
- Reduce the full-scene dimming overlay while retaining local text contrast.
- Reuse `/assets/title/title-hero.webp` behind the selector and `.run-screen` with low opacity through layered translucent backgrounds.
- Keep opaque cards/HUD/game canvas legible and do not overlay the Phaser canvas.

## Implementation

### I01. Improve title artwork and heading placement

- Related Files:
  - `src/styles/global.css` :: `.main-menu-shade`, `.main-menu-card`, `.main-menu-copy`, title responsive rules; modify

#### Details

- Preserve `.main-menu-dock` layout, actions, and its bottom anchoring.
- Place `.main-menu-copy` near the top (below `.main-menu-topbar`) instead of vertically centered over the cast. Keep title width/size responsive, and position the title in the sky portion of the artwork.
- Replace the current heavy left and bottom gradients in `.main-menu-shade` with a light overall veil and a subtle top text scrim. Keep cast faces and costumes bright and visible.
- Retain reduced-motion behavior and ensure the heading does not collide with the topbar or dock on short landscape/mobile viewports.

### I02. Add the title art behind selector and gameplay

- Related Files:
  - `src/styles/global.css` :: `.selector-shell`, `.selector-panel`, `.run-screen`; modify

#### Details

- Use `url('/assets/title/title-hero.webp')` as the same background image for selector and gameplay outer screen.
- Layer a light opaque white-blue tint over the image at about 78–86% opacity so the image appears subtly behind the screens without compromising text.
- Give `.selector-shell` a visible art-backed surface; make `.selector-panel` translucent enough to reveal it lightly between/through cards while preserving readable text and existing selected states.
- Set `.run-screen` outer page background to the same image with a light tint. Leave `.runner-stage`, Phaser canvas, biome artwork, HUD, and hit/obstacle contrast unchanged.

### I03. Validate styling integration

- Related Files:
  - `src/app/screens/MainMenu.test.tsx` :: menu title and actions; read-only
  - `src/app/screens/CharacterSelect.test.tsx` :: selector content; read-only

#### Details

- Run `npm run test -- src/app/screens/MainMenu.test.tsx src/app/screens/CharacterSelect.test.tsx`.
- Run `npm run build`.
- Review actual browser screenshots if the browser host is available; otherwise note the limitation and do not claim visual screenshot verification.

## Acceptance Criteria

- [x] Title text sits in the sky area, the art is brighter than before, and the existing dock remains visible at the bottom.
- [x] The image is subtly visible behind both character selection and gameplay outer surfaces.
- [x] Selector cards, HUD, and Phaser game visuals retain their existing contrast and readability.
- [x] Existing menu behavior is unchanged.
- [x] Targeted tests and production build pass.

## Validation

- `npm run test -- src/app/screens/MainMenu.test.tsx src/app/screens/CharacterSelect.test.tsx`
- `npm run build`
- Browser visual review at desktop and mobile sizes when available.
- Targeted tests passed (10 tests); production build passed. Browser host was unavailable in this session, so no screenshot review was possible.

## Commit Message

```text
style(ui): brighten title art and add screen backdrops

Plan: 2026-10-30-title-art-and-screen-backdrops
Phase: P01-title-and-backdrops
Task: T01-title-art-backdrops

- Move title copy into the open sky and reveal the character art
- Add a subtle title-image backdrop behind selector and gameplay UI
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: style(ui): brighten title art and add screen backdrops
