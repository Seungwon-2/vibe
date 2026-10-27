# Task: T03 App Screen Pastel Skin

## Status: pending

## Goal

Apply the shared pastel design to all non-selector React screens while preserving their current content, actions, layout hierarchy, and game state behavior.

## Decision Summary

- Retheme the menu, run header/HUD/touch controls, countdown, pause and exit overlays, rankings, and result surfaces.
- Use cloud-white/pale-sky shared surfaces with lavender and character/biome accents. Keep warning, bonus, and disabled states distinct and legible.
- This task is visual only; do not change ranking models, game snapshots, control events, or navigation callbacks.

## Implementation

### I01. Restyle menu, result, and ranking screens

- Related Files:
  - `src/app/screens/MainMenu.tsx` :: `MainMenu`; read-only unless decorative wrapper is needed.
  - `src/App.tsx` :: screen selection and rankings markup; read-only unless a semantic class hook is required.
  - `src/app/screens/RunResult.tsx` :: `RunResult`; read-only unless a semantic class hook is required.
  - `src/styles/global.css` :: `.landing-shell`, `.title-card`, `.main-menu-card`, `.rankings-card`, `.rankings-list`, `.result-shell`, `.result-panel`, `.result-character`, `.result-details`, `.result-actions`; modify.
  - `src/app/screens/RunResult.test.tsx` :: visual-hook assertions only if markup changes; modify only when required.

#### Details

- Change dark navy page/panel fills to shared light tokens. Use white/soft-sky panels, subtle blue/lavender borders, a low-contrast ambient background illustration/gradient, and soft shadows.
- Keep title, menu copy, ranking fields/order, result score/stats, and all action button labels/handlers unchanged.
- Preserve each ranking row's character accent stripe and make rank, meters, coins, and empty-state text meet at least 4.5:1 contrast against their surface.
- Keep the character sprite in results unaffected by surface color and continue to distinguish personal-best and non-best outcomes.

### I02. Restyle run HUD, controls, and overlays

- Related Files:
  - `src/app/components/RunnerHud.tsx` :: `RunnerHud`; read-only unless a semantic class hook is required.
  - `src/app/components/TouchControls.tsx` :: `TouchControls`; read-only unless a semantic class hook is required.
  - `src/app/components/PauseOverlay.tsx` :: `PauseOverlay`; read-only unless a semantic class hook is required.
  - `src/app/components/CountdownOverlay.tsx` :: `CountdownOverlay`; read-only unless a semantic class hook is required.
  - `src/app/screens/RunScreen.tsx` :: `RunScreen` exit confirmation; read-only unless a semantic class hook is required.
  - `src/styles/global.css` :: `.runner-*` selectors; modify.
  - `src/app/components/RunnerHud.test.tsx`, `TouchControls.test.tsx`, `src/app/screens/RunScreen.test.tsx` :: existing behavior regression tests; modify only if class hooks are added.

#### Details

- Replace the opaque dark navy HUD/pause/exit surfaces with soft translucent white/sky panels and dark text. Tune HUD text shadow down or remove it when the surface is light.
- Use strong blue for primary controls, lavender for secondary/focus details, and `--ui-danger`/a strong rose token for low-time warning. Preserve visual distinction between countdown, collected bonus cue, paused state, disabled touch controls, and exit confirmation.
- Keep touch targets at least 44px, preserve the lower-left jump / lower-right slide placement, pointer-events behavior, keyboard focus, held-slide input, and portrait rotation pause behavior.
- Preserve `.runner-stage` aspect ratio and the canvas size. CSS may decorate the stage frame but must not crop or scale only part of the Phaser canvas.
- Keep numerical typography (`tabular-nums`) and the existing HUD information hierarchy.

### I03. Add visual behavior regression coverage

- Related Files:
  - `src/App.test.tsx` :: menu/ranking/result navigation; modify only for markup assertions.
  - `src/app/components/RunnerHud.test.tsx`, `src/app/components/TouchControls.test.tsx`, `src/app/screens/RunScreen.test.tsx`, `src/app/screens/RunResult.test.tsx` :: existing tests; modify only if semantics change.

#### Details

- Verify page styling changes do not alter selector start/back, menu rankings, pause/resume/exit confirmation, retry, character choice, result ranking navigation, or displayed ranking values.
- Do not add tests that assert fragile serialized CSS strings; use accessible names, roles, data state, and existing callback behavior.

## Acceptance Criteria

- [ ] Menu, run/HUD, pause, ranking, and result screens share the new light pastel design language.
- [ ] Actions, labels, content hierarchy, callbacks, and game state transitions remain unchanged.
- [ ] HUD controls remain visible over all four biome palettes and touch/focus targets remain usable.
- [ ] Warning/bonus/disabled states are distinguishable and text remains legible.

## Validation

- `npm test -- src/app/components/RunnerHud.test.tsx src/app/components/TouchControls.test.tsx src/app/screens/RunScreen.test.tsx src/app/screens/RunResult.test.tsx` — current screen behavior regression.
- `npm run lint` — React/TypeScript.
- `npm run build` — production CSS and component bundle.
- Manual: inspect menu, active run, pause, exit confirmation, ranking, and both result outcomes at desktop and compact landscape sizes.

## Commit Message

```text
style(ui): harmonize runner and result screens

Plan: 2026-10-27-character-selector-visual-refresh
Phase: P01-ui-and-selector
Task: T03-app-screen-skin

- Apply shared pastel surfaces to the complete screen flow
- Preserve runner controls and result/ranking behavior
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

