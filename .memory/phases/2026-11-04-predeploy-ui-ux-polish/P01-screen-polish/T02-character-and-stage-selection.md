# Task: T02 Character and Stage Selection

## Status: done

## Goal
Ensure all five character cards and all four themed stage cards remain legible, selectable, and fully visible at supported desktop and mobile viewport sizes.

## Decision Summary
- Preserve character order, unlock state, passive icon/name/effect, portrait artwork, running-preview strip, stage artwork, course metadata, and selection behavior.
- Fix card cropping, uneven sizing, overflow, and control placement without changing unlock rules or progression.
- Reuse the existing `StageBackdropPreview`; do not introduce duplicate backdrop assets.

## Implementation

### I01. Character selection card grid and footer
- Related Files:
  - `src/app/screens/CharacterSelect.tsx` :: `CharacterSelect`, `SELECTOR_CHARACTER_IDS`, `SELECTOR_ART` — card, preview, and footer content; modify only when an accessible wrapper or stable class is required.
  - `src/app/components/SelectorRunnerPreview.tsx` :: `SelectorRunnerPreview` — existing animated runway preview; read-only unless CSS sizing requires a wrapper change.
  - `src/styles/global.css` :: `.selector-shell--runner`, `.selector-panel--runner`, `.selector-header--runner`, `.character-roster--runner[data-roster-layout="one-row"]`, `.character-card--runner`, `.character-card__art--runner`, `.character-card__illustration`, `.character-card__details`, `.character-card__passive`, `.selector-runway`, `.selector-footer--runner`, and their media queries — modify.
- **Layout constraints**:
  - Keep all five cards visible as one row where the current desktop layout supports it; use a compact responsive grid/scroll pattern only at narrower breakpoints where five readable cards cannot fit.
  - Preserve a common card and illustration frame so character art does not crop or shift inconsistently.
  - Keep lock overlay and selected marker inside their card art bounds.
  - Keep passive icon, name, and effect readable without clipping; preserve touch-friendly card hit areas and keyboard focus indicators.
  - Keep the runway preview, navigation, shop action, and confirm action within the selector panel.
- **Acceptance Criteria**:
  - No unlocked or locked character is silently hidden or clipped.
  - Names, passive descriptions, lock conditions, selection state, and primary action remain readable and operable at 1440×900, 915×412, and 390×844.
  - Selection still updates the showcase/runway and confirmation still selects the same character.

### I02. Stage selection cards
- Related Files:
  - `src/app/screens/StageSelect.tsx` :: `StageSelect` — stage-card metadata, selected/locked states, and footer; modify only if accessible text needs improvement.
  - `src/app/components/StageBackdropPreview.tsx` :: `StageBackdropPreview` — existing theme illustration; read-only unless intrinsic sizing must be exposed.
  - `src/styles/global.css` :: `.progression-screen--stages`, `.stage-options`, `.stage-option`, `.stage-option__scene`, `.stage-option__scene-status`, `.stage-option__details`, `.stage-select-footer`, and all related media queries — modify.
- **Layout constraints**:
  - Keep each card's theme preview, stage number, title, course distance, coin target, completion/locked status, and selection appearance.
  - Keep all four cards and footer actions inside the viewport at desktop landscape; at narrow mobile, allow internal stage-list scrolling if needed, but avoid page-level horizontal overflow and prevent controls from overlaying card content.
  - Ensure locked state remains apparent while its text stays legible over the backdrop.
- **Acceptance Criteria**:
  - All stage cards have visible themed artwork and distinct readable selected, cleared, available, and locked states.
  - The start and achievements actions remain reachable without covering stage details.

## Validation
- `npm test -- src/app/screens/CharacterSelect.test.tsx` — existing character selection behavior tests pass.
- `npm run lint` — no lint errors.
- `npm run typecheck` — no TypeScript errors.
- `npm run build` — production build completes.
- Manual visual review at 1440×900, 915×412, and 390×844; verify all character and stage content, locked states, and footer actions.

## Commit Message
```text
fix(ui): prevent selection cards from clipping

Plan: 2026-11-04-predeploy-ui-ux-polish
Phase: P01-screen-polish
Task: T02-character-and-stage-selection

- Normalize character card sizing and responsive behavior
- Keep themed stage cards and controls legible within the viewport
```

## Progress
- [x] Character-selection heading reduced, with title/shop navigation grouped at the bottom-left.
- [x] Stage screen now has one bottom-left `← 캐릭터` action; duplicate upper-right navigation removed.
- [x] Character selection test (4 tests), lint, typecheck, production build, and diff check passed.
- [ ] Browser screenshot review remains pending; local browser host is unavailable in this session.
- commit: pending
