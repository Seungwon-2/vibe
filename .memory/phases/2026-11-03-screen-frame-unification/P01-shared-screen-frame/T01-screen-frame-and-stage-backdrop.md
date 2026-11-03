# Task: T01 Screen Frame and Stage Backdrop

## Status: done

## Goal
Use the character selector's outer viewport frame for progression screens and the gameplay UI, make the stage selector backdrop match the character selector, and preserve the Phaser canvas aspect ratio.

## Decision Summary
- Shared shell: viewport-filling, `clamp(8px, 1.2vw, 22px)` outer gutters, content max width `2048px`.
- Progression panels fill the available shell height and width, with internal scrolling where content exceeds the viewport.
- Stage and mode/utility progression screens use the title illustration backdrop `/assets/title/title-hero.webp` with a pale overlay matching `.selector-shell`.
- Gameplay header, HUD, help, and 16:9 playfield share the same `2048px` max width. The 960x540 Phaser canvas is not stretched.
- Preserve safe-area handling and the existing compact/portrait behavior for the character selector.

## Implementation

### I01. Unify the progression screen shell and apply the title backdrop
- Related Files:
  - `src/styles/global.css` :: `.progression-screen`, `.progression-screen--stages`, `.progression-panel`, `.achievement-panel`, `.shop-panel` — match the selector shell gutters/maximum width/full-height panel while preserving internal scrolling; modify

#### Details
- `.progression-screen` remains fixed to the viewport, uses `display:grid` and centered placement, sets `padding: clamp(8px, 1.2vw, 22px)`, and clips page-level overflow. Set its background layers to the same title illustration and pale overlay as `.selector-shell`.
- `.progression-panel` uses `width: min(100%, 2048px)`, `height: 100%`, `min-height: 0`, and `max-height: 100%`; use padding/radius that scale with the viewport and an opaque white surface (`rgb(255 255 255 / 92%)` or more opaque) for readable content.
- Keep `.progression-screen--stages`'s internal 5-row grid, stage card layout, and mobile 2x2 layout. Remove only conflicting outer width/padding behavior; do not change stage data or actions.
- Achievements and shop keep their own `overflow:auto` on the panel so long lists scroll inside the shared shell rather than expanding the page.
- Existing `.selector-shell--runner` sizing remains the reference and is not modified.

### I02. Align gameplay frame width without distorting the game canvas
- Related Files:
  - `src/styles/global.css` :: `.run-screen`, `.run-screen__header`, `.run-screen__hud`, `.run-screen__help`, `.run-screen > .runner-stage`, landscape/mobile media rules — apply consistent outer gutters and max width; modify

#### Details
- Use the selector outer gutter value on `.run-screen`; set the header, HUD row, and help row to `width: min(100%, 2048px)`.
- Increase the gameplay stage width cap from `1200px` to `2048px` in standard and short-landscape sizing rules. Keep the height-reserved `16 / 9` calculation and the existing `aspect-ratio: 16 / 9` on `.runner-stage`.
- Keep the existing mobile height reservation and touch-control layout. The outer shell must not create page scrolling; the game viewport may become wider only when available height allows it.
- Do not modify Phaser's 960x540 logical size or FIT scaling.

### I03. Extend the same outer frame to results and rankings
- Related Files:
  - `src/styles/global.css` :: `.result-shell`, `.result-panel`, `.landing-shell:not(.main-menu-scene)`, `.rankings-card` — use the same gutters and 2048px full-height frame for result and rankings screens; modify

#### Details
- `.result-shell` uses `min-height: 100dvh`, `padding: clamp(8px, 1.2vw, 22px)`, and centered grid placement.
- `.result-panel` uses `width: min(100%, 2048px)`, `height: 100%`, `min-height: 0`, `max-height: 100%`, and `overflow: auto`; keep its existing two-column layout and responsive one-column mobile layout.
- Apply the same shell gutters to `.landing-shell:not(.main-menu-scene)` (used by rankings), and make `.rankings-card` fill the available shell with `width: min(100%, 2048px)`, `height: 100%`, and internal overflow.
- Leave the full-screen title scene and character selector rules unchanged.

## Acceptance Criteria
- [x] Mode/stage selection, achievements, shop, results, and rankings use the same near-full-screen outer gutters and 2048px content-width cap as character selection.
- [x] Stage selector shows the title illustration backdrop with a pale overlay; its content panel remains opaque enough to read.
- [x] Gameplay UI uses the same shared width cap and spacing, while the game canvas remains 16:9 without distortion.
- [x] Narrow/mobile layouts retain safe areas and internal scrolling where content needs it; no page-level horizontal overflow is introduced.

## Validation
- `npm run typecheck` — no TypeScript errors.
- `npm run build` — production build succeeds.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
fix(ui): unify screen framing and stage backdrop

Plan: 2026-11-03-screen-frame-unification
Phase: P01-shared-screen-frame
Task: T01-screen-frame-and-stage-backdrop

- Match progression and gameplay framing to character selection
- Reuse the title backdrop on stage selection without stretching gameplay
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
