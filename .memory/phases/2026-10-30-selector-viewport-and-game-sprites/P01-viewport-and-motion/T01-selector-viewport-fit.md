# Task: T01 Selector Viewport Fit

## Status: done

## Goal

Keep the selector in the browser viewport and display all five character cards in one row on landscape/desktop screens, eliminating the current two-row wrap and document scrollbar.

## Decision Summary

- The selector shell is a fixed viewport surface with `height: 100dvh`, `min-height: 0`, and hidden outer overflow. Its roster has one row and five equal columns when the width permits. Narrow portrait screens may scroll the roster horizontally inside the fixed viewport.
- The lower animation rail and footer retain their current functions and passive details remain visible.

## Implementation

### I01. Viewport-constrained layout

- Related Files:
  - `src/styles/global.css` :: `.selector-shell--runner`, `.selector-panel--runner`, `.character-roster--runner`, `.character-card--runner`, `.selector-runway`, `.selector-footer--runner` — constrain layout to viewport and enforce one-row cards; modify.
  - `src/app/screens/CharacterSelect.tsx` :: selector section hierarchy — keep the card list as one direct roster row; read-only unless structural change is required.

#### Details
- `.selector-shell.selector-shell--runner`: `position: fixed; inset: 0; width: 100%; height: 100vh; height: 100dvh; min-height: 0; padding: clamp(8px, 1.5vw, 24px); overflow: hidden;`.
- `.selector-panel.selector-panel--runner`: `width: 100%; height: 100%; min-height: 0; max-height: 100%; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) clamp(92px, 17vh, 160px) auto; gap: clamp(8px, 1.4vh, 16px); padding: clamp(12px, 2vw, 28px); overflow: hidden;`.
- `.character-roster.character-roster--runner`: `grid-column: 1 / -1; width: 100%; min-width: 0; min-height: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); grid-template-rows: minmax(0, 1fr); grid-auto-flow: column; gap: clamp(6px, 0.8vw, 14px); overflow: hidden;`.
- At `max-width: 700px`, switch only the roster to one-row `display:flex; flex-wrap:nowrap; overflow-x:auto;` and set cards `flex: 0 0 min(76vw, 260px)`; shell and panel remain viewport-constrained and do not create a vertical document scrollbar.
- Cards must allow internal content to shrink: `min-width:0; min-height:0; overflow:hidden`. Use responsive art height `clamp(110px, 23vh, 260px)` with `min-height:0`; scale passive text and icon down at narrow widths, allow small effect labels to wrap.
- Preserve lower runway presence while making its height shrink with viewport; set its grid row to the specified clamp and its internal runner width to 100%.
- Remove/override prior selector media rules that set `flex-wrap: wrap`, multi-row grid tracks, fixed 620px minimum height, or unbounded min-heights. Ensure `html`, `body`, and `#root` do not cause vertical scrolling while selector screen is active; scope body overflow management to app layout only if already supported.

### I02. Layout regression checks

- Related Files:
  - `src/app/screens/CharacterSelect.test.tsx` :: selector markup tests — modify.

#### Details
- Assert five card buttons exist in reference order and all share the same roster parent, which has an explicit single grid row at wide mode via a class/data contract if needed.
- Keep selection/passive and quality art tests unchanged.
- Do not claim a browser pixel-level scrollbar test from jsdom; validate viewport sizing with CSS inspection and production build. If browser automation is available, inspect 1440×900 and 915×412 landscape.

## Acceptance Criteria

- [x] Desktop/landscape shows five cards in one horizontal row.
- [x] The selector container does not add document-level vertical scrolling at 1440×900 or 915×412 landscape.
- [x] Small widths scroll the card row internally and do not wrap cards or enlarge the page.
- [x] Run rail, passive details, selection, and start actions remain present.

## Validation

- `npm run test -- src/app/screens/CharacterSelect.test.tsx`
- `npm run build`

## Commit Message

```text
fix(selector): keep roster inside the viewport

Plan: 2026-10-30-selector-viewport-and-game-sprites
Phase: P01-viewport-and-motion
Task: T01-selector-viewport-fit

- Constrain selector height to the active viewport
- Prevent five-card roster from wrapping on landscape screens
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`npm run test -- src/app/screens/CharacterSelect.test.tsx`; `npm run build`)
- commit: pending
