# Task: T02 HUD, Mobile Controls, and Pause

## Status: done

## Goal

Present clear live run information, a 3-second countdown, keyboard/touch action buttons, and a pause overlay that freezes the complete run.

## Decision Summary

- Show remaining time, rounded meters, coins, current biome/next landmark, and the selected character's passive summary.
- Landscape is the supported orientation on mobile and desktop. In portrait, show a rotate-device prompt while leaving the active run paused.
- The first user screenshot is a layout reference for a slim top information band and large translucent bottom-corner Jump/Slide controls; use the runner's own colors, numbers, and assets.

## Implementation

### I01. Add React HUD and overlays

- Related Files:
  - `src/app/components/RunnerHud.tsx` :: `RunnerHudProps`, timer/distance/coin/passive display; new.
  - `src/app/components/CountdownOverlay.tsx` :: 3-2-1 overlay; new.
  - `src/app/components/PauseOverlay.tsx` :: resume/exit overlay; new.
  - `src/app/components/RunnerHud.test.tsx` :: display and overlay tests; new.
  - `src/styles/global.css` :: HUD, countdown, pause, landscape and portrait rules; modify.

#### Details

- `RunnerHudProps = { snapshot: RunnerSnapshot; character: CharacterDefinition; recentBonus: { id: string; kind: 'pickup' | 'gate'; awardedMs: number } | null; onPause(): void }`. `RunScreen` supplies `recentBonus` from P02's one-off `RunnerEvent` bridge, not by guessing from snapshot changes.
- Display timer as `m:ss` (ceil seconds), distance as rounded `m`, coins as integer, and current biome name. Add a compact accessible passive label; do not show tuning constants or an ability-strength control.
- Place a single HUD overlay above the 960x540 Phaser canvas: remaining time and a gauge filled by `remainingMs / 120000` at top-left (90 seconds starts at 75% of the 120-second cap), distance in meters at top-center, coins and a pause button at top-right, with a compact biome/next-2,500m-landmark line below. Keep the HUD in the scene's y=0..84 visual reserve; it must never cover the player, ground hazards, pickups, or gate cue. Use a dark translucent scrim and theme-aware contrast, not a large opaque card.
- The next-landmark line derives from `snapshot.distanceMeters` and the 2,500m/5,000m/7,500m thresholds; after the third gate, show the current biome without promising another gate. Show a brief `+Ns` cue using `recentBonus.awardedMs` only when the corresponding runner event fires (Rin's pickup can be +4s; a capped award can be smaller or zero). Never infer a reward merely from a visual palette change; hide a zero-award cue.
- At remaining time <=10 seconds add warning color and `aria-live='polite'`; do not announce every frame. Use `aria-live='off'` for rapidly changing meters.
- Countdown displays 3, 2, 1 at one-second intervals, then tells `RunnerGame` to call `startRunner`; the 90-second timer starts only after countdown completes.
- Pause overlay has “계속하기” and “나가기” actions. Pausing must call `pauseRunner`, pause Phaser scene timers and physics, clear held touch/key input, and preserve position/state. Resume calls `resumeRunner` and resets input state before accepting new actions.
- If viewport orientation is portrait, display a high-contrast “가로로 돌려 주세요” prompt and pause the active runner. On returning to landscape, retain the pause overlay until the player resumes.

### I02. Add mobile touch controls

- Related Files:
  - `src/app/components/TouchControls.tsx` :: `TouchControls` pointer handlers; new.
  - `src/app/components/TouchControls.test.tsx` :: pointer capture/release and cleanup tests; new.
  - `src/styles/global.css` :: control placement and focus/pressed states; modify.

#### Details

- Props: `{ inputBridge: RunnerInputBridge; disabled: boolean }`.
- Provide left-side jump and right-side slide buttons at least 64x64 CSS pixels with labels/icons and `aria-label`. On pointer down call `press`; on pointer up, cancel, lost capture, pointer leave, disable, pause, or unmount call `release`/`clear` so slide cannot stick.
- Render Jump as a translucent circular control near the lower-left and Slide near the lower-right, each at least 72x72 CSS pixels at landscape mobile size with a high-contrast label, visible pressed state, and safe-area padding. Their overlays may cover only empty edges of the scene, never the player at x=170 or an approaching hazard. Keep both usable with mouse and keyboard focus.
- Use `touch-action: none` on controls only; do not block scroll/zoom elsewhere in React screens.
- Keyboard help on desktop: `Space / ↑ 점프`, `↓ 누르는 동안 슬라이딩`. Buttons remain available for mouse/keyboard accessibility at all widths.

## Acceptance Criteria

- [x] HUD values match the latest `RunnerSnapshot` and remain legible against each biome.
- [x] The top band and bottom-corner controls match the reference's information hierarchy while showing only Project 02's timer, meters, coins, biome/landmark, and pause state; no unrelated score, rarity, or currency indicators appear.
- [x] Countdown consumes three seconds before the 90-second run begins.
- [x] Pause freezes timer, distance, player physics, hazards, pickups, and parallax; resume continues without a freeze.
- [x] Mobile held slide releases on every pointer cancellation and lifecycle exit.
- [x] Portrait orientation presents a rotate prompt and cannot silently continue the timer.

## Validation

- `npm test -- src/app/components/RunnerHud.test.tsx src/app/components/TouchControls.test.tsx` — validates display and input lifecycle.
- `npm run typecheck` — validates component and input bridge contracts.
- Manual: headless Edge screenshots reviewed at 1366x768 and 844x390 landscape, plus 390x844 portrait guidance. CUA exposed no browser/device surface for live touch simulation.
- Manual: desktop and landscape mobile captures showed HUD and both control circles fitting without horizontal scrolling or covering the actor/hazard lane; component tests cover pointer cancellation and lifecycle cleanup. 667x375 capture and physical touch-device review remain outstanding.

## Commit Message

```text
feat(ui): add runner hud touch controls and pause

Plan: 2026-10-26-running-action-redesign
Phase: P03-course-and-ui
Task: T02-hud-mobile-pause

- Add countdown, timer/distance HUD, and full-state pause overlay
- Support held mobile jump/slide input and landscape guidance
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm test` — 72 tests, `npm run typecheck`, `npm run lint`, `npm run build`)
- commit: `9b3d862` on `project02`
