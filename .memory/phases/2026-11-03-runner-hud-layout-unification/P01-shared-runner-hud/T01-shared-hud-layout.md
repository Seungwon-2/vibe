# Task: T01 Shared HUD Layout

## Status: done

## Goal
Story and Endless modes render the HUD in a shared row above the game stage, use the same information order and grid, and keep pause/status controls out of the gameplay canvas.

## Decision Summary
- The common HUD row is timer/course progress → distance → lives → coins and pause; the second row is landmark → active power-up → passive.
- Phaser remains a 960×540 FIT canvas; the gameplay stage remains 16:9.
- Jump/slide touch controls and pause/countdown/exit overlays remain positioned over the stage by design.

## Implementation

### I01. Move the HUD into the run-screen layout and unify its React structure
- Related Files:
  - `src/app/screens/RunScreen.tsx` :: `RunScreen` — place a width-container HUD wrapper between the screen header and `.runner-stage`; modify
  - `src/app/screens/RunScreen.test.tsx` :: `RunScreen` — assert HUD wrapper and game stage are siblings, and mode changes do not move the pause control into the stage; modify
  - `src/app/components/RunnerHud.tsx` :: `RunnerHud` — keep the same timer/progress variants but stable four-item child order in both modes; modify if structural changes are needed
  - `src/app/components/RunnerHud.test.tsx` :: `RunnerHud` — verify identical ordering and distinct progress labels for Story/Endless; modify

#### Details
- Keep `.run-screen__header` for character name and exit confirmation entry point.
- Insert `<div className="run-screen__hud"><RunnerHud ... /></div>` after the header and before `.runner-stage`.
- `.run-screen__hud` is the inline-size query container. Keep `RunnerHud` as a semantic `aria-label="게임 정보"` element with `data-mode` set to the mode.
- `RunnerHud` direct children under `.runner-hud__main` must always be: mode timer/progress block, distance block, lives block, action block (coins and pause). Story progress (`코스 진행`) and Endless timer (`남은 시간`) remain different content inside the same first slot.
- Preserve `RUNNERHud` details row fields, bonus feedback, passive icon, power-up cues, accessible labels, and button handlers. Do not move touch controls or modal overlays out of `.runner-stage`.

### I02. Put the HUD in normal flow and size the 16:9 stage for available viewport height
- Related Files:
  - `src/styles/global.css` :: `.run-screen`, `.run-screen__hud`, `.runner-stage`, `.runner-hud`, `.runner-hud__main`, responsive media rules, `.runner-hud[data-mode]` — make HUD non-overlay and share a four-column grid; modify

#### Details
- `.run-screen` grid rows become `auto auto minmax(0, 1fr) auto` for standard screens: title header, HUD, stage, optional help.
- `.run-screen__hud` uses `container-type: inline-size; width: min(100%, 1200px); margin-inline: auto; min-width: 0`.
- `.runner-hud` becomes `position: relative; height: auto; min-height: 0; max-height: none; padding` sized from its container; keep `pointer-events: none` so only the pause button is interactive. The background must be opaque enough to separate it from the page backdrop.
- `.runner-hud__main` always uses `grid-template-columns: minmax(0, 1fr) auto auto auto`; remove the Story-only column override. At narrow widths, keep all four groups on one row and scale timer gauge, padding, and gaps down instead of wrapping actions over the canvas.
- `.runner-hud__details` remains a separate second flow row inside HUD. Any absolute bonus cue is positioned relative to `.runner-hud`, so it stays inside the HUD region.
- `.runner-stage` keeps `aspect-ratio: 16 / 9`. Compute stage width as `min(100%, (100dvh - reserved vertical UI space) * 16 / 9, 1200px)`; adjust reserved space for standard, short landscape, mobile, and tutorial-help-visible states. No negative or overflow values; clamp with `max(0px, ...)` if necessary.
- In short landscape, hide the keyboard help row as already done and use compact spacing for the shared HUD. Touch controls remain visible at the bottom of the stage.
- Delete `.runner-hud[data-mode="story"] .runner-hud__main` layout override. Do not change game simulation, collision geometry, or mode-specific timer/progress semantics.

## Acceptance Criteria
- [x] Story and Endless HUD groups appear in the same order and same four-column positions.
- [x] The pause button and HUD detail row are outside `.runner-stage`; only touch controls and modal overlays overlap the canvas.
- [x] The game stage remains 16:9 and uses viewport-height-based width sizing.
- [x] Story course progress and Endless timer remain mode-specific; life/coin/passive/power-up values remain accurate.

## Validation
- `npm test -- src/app/screens/RunScreen.test.tsx src/app/components/RunnerHud.test.tsx` — targeted layout semantics and HUD contents pass.
- `npm run typecheck` — no TypeScript errors.
- `npm run build` — production bundle succeeds.

## Commit Message
```text
fix(ui): unify runner HUD layout across modes

Plan: 2026-11-03-runner-hud-layout-unification
Phase: P01-shared-runner-hud
Task: T01-shared-hud-layout

- Move HUD out of the gameplay canvas and align both modes to one grid
- Preserve 16:9 gameplay sizing with responsive space reservation
```

## Progress
- [x] Implementation complete
- [x] Validation passed: targeted tests (17), typecheck, production build
- commit: pending
