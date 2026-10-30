# Task: T02 Title and Selector Viewport Fit

## Status: done

## Goal

Make the title screen and character selector fit the browser's available width and dynamic height on desktop and mobile, keeping all primary actions visible without document scrolling.

## Decision Summary

- Use dynamic viewport units, safe-area-aware outer padding, and viewport-constrained screen layouts.
- Compact title typography and spacing on short viewports.
- On portrait selection screens, keep showcase, five character cards, and confirm action visible by allocating responsive rows and shrinking art/spacing; preserve the desktop and landscape compositions.
- Do not change screen colors or game screen sizing.

## Implementation

### I01. Fit landing/title screen to viewport

- Related Files:
  - `src/styles/global.css` :: `.landing-shell`, `.title-card`, `.main-menu-card`, title typography and compact-height media rules; modify

#### Details

- Add `100dvh` viewport sizing with `100vh` fallback; use `min-height` for ordinary content and a short-viewport rule that compacts padding, title size, intro margins, and button height.
- Preserve title content, record/loading/error text, audio actions, and colors.
- Ensure `.main-menu-actions` wraps within card width and no fixed/minimum height forces overflow.

### I02. Fit character selector to viewport

- Related Files:
  - `src/styles/global.css` :: `.selector-shell`, `.selector-panel`, `.selector-layout`, `.selector-showcase`, `.character-roster`, `.character-card`, `.selector-footer`, responsive media queries; modify

#### Details

- Size the shell and panel against `100dvh` plus safe-area insets. Use grid rows `auto minmax(0, 1fr) auto` so header, content, and confirm footer share the available height.
- Set `min-height: 0` on nested layout and roster grid items to prevent intrinsic 390/470px minimums from expanding the page.
- On portrait widths, use a compact showcase row and a flexible 2-column, 3-row roster. Scale roster preview height, card names, ability icon, and footer copy with available viewport height. At very short heights, hide only the explanatory sentence while keeping the confirm button visible.
- Preserve all five cards, names, selected/coming-soon badges, showcase art/ability, and existing colors.
- Keep the current 3-column roster arrangement in short landscape screens; lower its showcase and roster minimum heights to fit.

### I03. Validate responsive screens

- Run `npm run build` and targeted UI tests: `npm run test -- src/app/screens/CharacterSelect.test.tsx src/App.test.tsx`.
- Check layout at 1366x768, 1280x600, 915x412 landscape, and 320x568 portrait. Confirm `document.documentElement.scrollHeight <= window.innerHeight`, no cropped title/heading/cards, and visible start/confirm controls.

## Acceptance Criteria

- [x] Title content and all menu buttons use viewport-constrained desktop, short-landscape, and phone-portrait layouts.
- [x] Character showcase, all five cards, and confirm button are allocated within the viewport without intrinsic minimum-height expansion.
- [x] Existing selection interactions and colors remain unchanged.

## Commit Message

```text
fix(ui): fit title and character selector to viewport

Plan: 2026-10-30-runner-motion-viewport-fit
Phase: P01-motion-and-layout
Task: T02-title-selector-viewport-fit

- Use viewport-aware title and selector layouts
- Keep primary actions visible on mobile and desktop
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm run test -- src/app/screens/CharacterSelect.test.tsx src/App.test.tsx`; 13 tests, `npm run build`)
- Browser viewport screenshots unavailable in this environment; responsive CSS and automated UI/build checks passed.
- commit: `fix(ui): fit title and character selector to viewport` on `project02`
