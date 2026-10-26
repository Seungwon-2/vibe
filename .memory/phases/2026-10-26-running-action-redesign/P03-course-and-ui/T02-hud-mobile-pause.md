# Task: T02 HUD, Mobile Controls, and Pause

## Status: pending

## Goal

Present clear live run information, a 3-second countdown, keyboard/touch action buttons, and a pause overlay that freezes the complete run.

## Decision Summary

- Show remaining time, rounded meters, coins, current biome/next landmark, and the selected character's passive summary.
- Landscape is the supported orientation on mobile and desktop. In portrait, show a rotate-device prompt while leaving the active run paused.

## Implementation

### I01. Add React HUD and overlays

- Related Files:
  - `src/app/components/RunnerHud.tsx` :: `RunnerHudProps`, timer/distance/coin/passive display; new.
  - `src/app/components/CountdownOverlay.tsx` :: 3-2-1 overlay; new.
  - `src/app/components/PauseOverlay.tsx` :: resume/exit overlay; new.
  - `src/app/components/RunnerHud.test.tsx` :: display and overlay tests; new.
  - `src/styles/global.css` :: HUD, countdown, pause, landscape and portrait rules; modify.

#### Details

- `RunnerHudProps = { snapshot: RunnerSnapshot; character: CharacterDefinition; onPause(): void }`.
- Display timer as `m:ss` (ceil seconds), distance as rounded `m`, coins as integer, and current biome name. Add a compact accessible passive label; do not show tuning constants or an ability-strength control.
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
- Use `touch-action: none` on controls only; do not block scroll/zoom elsewhere in React screens.
- Keyboard help on desktop: `Space / ↑ 점프`, `↓ 누르는 동안 슬라이딩`. Buttons remain available for mouse/keyboard accessibility at all widths.

## Acceptance Criteria

- [ ] HUD values match the latest `RunnerSnapshot` and remain legible against each biome.
- [ ] Countdown consumes three seconds before the 90-second run begins.
- [ ] Pause freezes timer, distance, player physics, hazards, pickups, and parallax; resume continues without a freeze.
- [ ] Mobile held slide releases on every pointer cancellation and lifecycle exit.
- [ ] Portrait orientation presents a rotate prompt and cannot silently continue the timer.

## Validation

- `npm test -- src/app/components/RunnerHud.test.tsx src/app/components/TouchControls.test.tsx` — validates display and input lifecycle.
- `npm run typecheck` — validates component and input bridge contracts.
- Manual: verify landscape mobile-sized viewport with touch simulation; verify portrait prompt and resume.

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

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
