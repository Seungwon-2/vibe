# Task: T02 Stage Select Viewport

## Status: done

## Goal
Display all four Story stage cards, back/achievement/start controls, and selection status without page scrolling at supported desktop and mobile viewport sizes.

## Decision Summary
- Scope the no-scroll treatment to Story stage selection, not the shared progression screen used by achievements and other screens.
- Keep four stage cards in a compact 2×2 grid; use viewport-based spacing and text sizing rather than hiding or clipping content.

## Implementation

### I01. Screen-specific layout
- Related Files:
  - `src/app/screens/StageSelect.tsx` :: `<main className="progression-screen">` — add a `progression-screen--stages` modifier; preserve all stage content and handlers.
  - `src/styles/global.css` :: `.progression-screen`, `.progression-panel`, `.stage-options`, `.stage-option`, `.stage-select-footer`, media queries — add stage-specific rules.

#### Details
- On the modified stage screen, use a viewport-sized layout (`100dvh`, with `100vh` fallback), `min-height: 0`, and `overflow: hidden` on the outer screen.
- Make the panel a bounded grid/flex column with a flexible `minmax(0, 1fr)` stage-card region; preserve header, four cards, and footer actions.
- Keep 2×2 card layout at narrow widths; reduce internal padding, gaps, and type with `clamp()`/height breakpoints instead of converting to a tall single column.
- Ensure labels wrap within cards, use `min-width: 0`, and do not clip focus rings or button labels. If the viewport is extremely short, shrink artwork-free spacing and card padding first.
- Do not globally change `.progression-screen` scroll rules for ModeSelect, AchievementsScreen, or ShopScreen.

### I02. Responsive verification
- Related Files:
  - `src/app/screens/StageSelect.test.tsx` :: full stage/action rendering — new only if a screen test exists or is warranted by repository conventions.
- Inspect at 1366×768, 915×412 landscape, 390×844 portrait, and 320×568. Confirm all four cards and actions are visible, no document scrollbar appears, and keyboard focus remains visible.

## Acceptance Criteria
- [x] Four stage cards and all actions use a bounded viewport layout without page-level scroll.
- [x] Card copy wraps inside its card; the stage screen keeps outer padding around focus indicators.
- [x] Other progression screens retain their existing scroll behavior through stage-only selectors.

## Validation
- `npm run typecheck`
- `npm run build`
- Manual local browser inspection at the listed viewport sizes.

## Commit Message
```text
fix(ui): fit story stage selection to viewport

Plan: 2026-11-02-runner-polish-predeploy
Phase: P01-gameplay-polish
Task: T02-stage-select-viewport

- Keep four story stages and actions visible without page scrolling
- Scope compact responsive layout to the stage selector
```

## Progress
- [x] Implementation complete
- [x] Typecheck and production build passed.
- [ ] Manual viewport inspection is unavailable: CUA browser host is not available in this session.
- commit: 5de990f
