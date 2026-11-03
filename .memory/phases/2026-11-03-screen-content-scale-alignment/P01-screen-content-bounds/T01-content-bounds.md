# Task: T01 Screen Content Bounds

## Status: done

## Goal
Make the gameplay HUD bar share the exact responsive width of the game stage; cap result and character selector panels at the same 1,400px content width as stage selection; preserve responsive behavior and the 16:9 Phaser playfield.

## Decision Summary
- A single CSS width variable on `.run-screen` drives both HUD and stage width; override only its reserved-height formula for short landscape and compact viewport media rules.
- `.result-panel` and `.selector-panel--runner` use a 1,400px maximum width and fit within the viewport. Keep their existing inner content and behavior.
- Character selector uses a proportional landscape frame; portrait mode keeps its current swipeable card roster and full-height layout.

## Implementation

### I01. Share responsive width between the HUD and 16:9 stage
- Related Files:
  - `src/styles/global.css` :: `.run-screen`, `.run-screen__hud`, `.run-screen > .runner-stage`, landscape/mobile media rules; modify

#### Details
- Add a CSS custom property on `.run-screen` for the regular gameplay width:
  ```css
  --run-stage-width: min(100%, max(0px, calc((100dvh - 220px) * 16 / 9)), 2048px);
  ```
- Set `.run-screen__hud` and `.run-screen > .runner-stage` to `width: var(--run-stage-width)` so the HUD frame and playfield edges match. Keep `min-width: 0`, centering, and the HUD's `container-type` behavior.
- In short landscape (`max-height: 520px`, `min-width: 650px`), override the variable to use the existing `(100dvh - 122px) * 16 / 9` reservation.
- In the compact width rule (`max-width: 640px`), override it to use the existing `(100dvh - 230px) * 16 / 9` reservation.
- Preserve `.runner-stage`'s `aspect-ratio: 16 / 9`; do not change Phaser logical dimensions, scale mode, or input layout.

### I02. Scale result panels to the stage-selection content width
- Related Files:
  - `src/styles/global.css` :: `.result-shell`, `.result-panel`, `.result-character__stage`, result responsive rules; modify

#### Details
- Change `.result-panel` maximum width from 2,048px to 1,400px. Keep `width: min(100%, 1400px)`, a content-driven height, and `max-height: 100%` within `.result-shell`.
- Remove the forced full-height panel behavior so result content determines panel height when it fits. Keep `overflow:auto` for long reward lists and viewport-constrained screens.
- Preserve the existing two-column desktop and one-column compact layout. Constrain the character preview stage so it scales down with the panel and does not force horizontal overflow.
- Apply the same bound to `.story-result-panel` through the shared `.result-panel` class; do not alter result actions or rewards.

### I03. Scale character selector while preserving orientation behavior
- Related Files:
  - `src/styles/global.css` :: `.selector-shell--runner`, `.selector-panel--runner`, portrait and short-landscape rules; modify

#### Details
- Set `.selector-panel--runner` maximum width to 1,400px, matching `.progression-screen--stages .progression-panel`.
- In landscape viewports above the existing portrait breakpoint, size the panel proportionally within the viewport: use the viewport-height-derived width limit with the existing outer gutter, preserve a landscape panel aspect ratio around 14:9, and retain a max-height that prevents clipping.
- Keep the existing header, one-row desktop roster, runway, footer, safe-area padding, and card behavior. Do not change character data, animation frames, or selection actions.
- In portrait, disable the landscape aspect-ratio constraint and preserve the existing full-height panel plus horizontally swipeable character cards. Keep the short-landscape compact layout.

## Acceptance Criteria
- [x] HUD bar left/right edges line up with the 16:9 game stage on desktop, compact width, and short landscape.
- [x] Game stage remains 16:9 and no Phaser logical-size or gameplay input behavior changes.
- [x] Endless and story result panels fit within a 1,400px content width and viewport height; long content scrolls inside the panel.
- [x] Character selector is capped at the same 1,400px content width as stage selection and scales proportionally in landscape.
- [x] Portrait selector keeps its swipeable roster and no screen clips its primary actions.

## Validation
- `npm run typecheck` — no TypeScript errors.
- `npm run build` — production build succeeds.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
fix(ui): align gameplay and screen content bounds

Plan: 2026-11-03-screen-content-scale-alignment
Phase: P01-screen-content-bounds
Task: T01-content-bounds

- Match gameplay HUD width to the responsive playfield
- Scale result and character selection panels to the shared content width
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`npm run typecheck`, `npm run build`, `git diff --check`)
- commit: `0595256`
