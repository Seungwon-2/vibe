# Task: T03 Gameplay HUD and Pause

## Status: done

## Goal
Make the gameplay HUD, 16:9 runner viewport, touch controls, pause dialog, and exit confirmation visually consistent and non-overlapping in both story and endless modes.

## Decision Summary
- Preserve gameplay state, HUD data, keyboard/touch behavior, pause/resume behavior, and exit confirmation behavior.
- Preserve the 16:9 gameplay viewport; align the HUD width to it and keep overlays within the visible game shell.
- Restrict changes to layout and presentation.

## Implementation

### I01. HUD and gameplay viewport
- Related Files:
  - `src/app/screens/RunScreen.tsx` :: `RunScreen`, `handleEvent`, `requestExit` — screen structure and overlays; modify markup/classes only if needed.
  - `src/app/components/RunnerHud.tsx` :: `RunnerHud` — mode-specific progress/time, distance, lives, coins, passive badge, pause control; presentation only.
  - `src/app/components/TouchControls.tsx` :: `TouchControls` — jump and slide button hit areas; preserve callbacks and disabled behavior.
  - `src/styles/global.css` :: `.run-screen`, `.run-screen__header`, `.run-screen__hud`, `.runner-stage`, `.run-screen__help`, `.runner-hud*`, `.touch-controls*`, and landscape/mobile media queries — modify.
- **Layout constraints**:
  - Retain the current first HUD slot for story progress or endless timer, followed by distance, life, and coin/pause controls.
  - Keep HUD content within the runner viewport width. Keep passive badges, hearts, counters, and pause control from covering active gameplay space.
  - Keep touch controls anchored to the stage edges and sized for touch use; avoid obscuring the character or critical obstacle area.
  - Preserve existing low-height landscape rules and avoid introducing document scrolling during a run.
- **Acceptance Criteria**:
  - Story and endless HUDs share aligned control positions while showing their distinct progress fields.
  - At desktop and landscape mobile, the stage remains 16:9 and HUD/touch controls do not overlap each other or extend outside the game shell.

### I02. Pause and exit overlays
- Related Files:
  - `src/app/components/PauseOverlay.tsx` :: `PauseOverlay` — resume, settings, and exit actions; presentation only.
  - `src/app/screens/RunScreen.tsx` :: `exitConfirmation` rendering — dialog overlay and action group; modify only layout/semantics if needed.
  - `src/styles/global.css` :: `.runner-overlay`, `.runner-overlay--confirm`, `.runner-pause-card`, `.runner-result-actions`, `.audio-dialog-backdrop` — overlay placement, panel sizing, and responsive rules; modify.
- **Layout constraints**:
  - Center dialogs relative to the stage shell and keep text/actions centered and inside their panel.
  - Keep a clear separation between continue/resume and terminate/exit actions; preserve button labels and behavior.
  - On narrow screens, wrap actions without clipping or letting the modal exceed the available viewport.
- **Acceptance Criteria**:
  - Pause and exit confirmation are centered, legible, and fully contained at desktop and mobile sizes.
  - Resume, sound settings, and exit actions retain current behavior; pausing does not change simulation state beyond existing logic.

## Validation
- `npm test -- src/app/screens/RunScreen.test.tsx src/app/components/RunnerHud.test.tsx src/app/components/TouchControls.test.tsx` — existing gameplay UI behavior tests pass.
- `npm run lint` — no lint errors.
- `npm run typecheck` — no TypeScript errors.
- `npm run build` — production build completes.
- Manual visual review at 1440×900 and 915×412 in both modes; verify pause and exit dialogs at 390×844 as well.

## Commit Message
```text
fix(ui): align runner HUD and pause overlays

Plan: 2026-11-04-predeploy-ui-ux-polish
Phase: P01-screen-polish
Task: T03-gameplay-and-pause

- Align mode-specific HUD content to the runner viewport
- Keep touch controls and pause dialogs within the visible game shell
```

## Progress
- [x] Implementation complete
- [x] Automated validation passed: targeted gameplay UI tests (19), lint, typecheck, build.
- [ ] Manual visual review at 1440×900, 915×412, and 390×844: unavailable because the browser access host was unavailable in this session.
- commit: `fix(ui): align runner HUD and pause overlays`
