# Task: T01 Title and Mode Selection

## Status: done

## Goal
Improve title-menu action placement and mode-card proportions while keeping the existing title illustration visible and the footer at its current height.

## Decision Summary
- Preserve the existing title scene, title art, footer height, labels, and callbacks.
- Keep the start button across the two action rows and Sound Settings at the far right of the lower row.
- Keep mode selection cards compact enough to avoid the large empty, stretched panels shown in earlier feedback.

## Implementation

### I01. Title menu action dock
- Related Files:
  - `src/app/screens/MainMenu.tsx` :: `MainMenu` — title copy, local-best line, and action buttons; modify only if stable selectors/semantics are needed.
  - `src/styles/global.css` :: `.landing-shell.main-menu-scene`, `.main-menu-card`, `.main-menu-dock`, `.main-menu-actions`, `.home-start`, `.main-menu-secondary`, `.main-menu-sound`, `.main-menu-credits` — layout and responsive rules; modify.
  - `src/app/screens/MainMenu.test.tsx` :: `MainMenu` tests — ensure all existing actions and title art remain; read-only unless implementation changes semantics.
- **Layout constraints**:
  - Do not increase `.main-menu-dock` or its containing title card height relative to the current two-row action arrangement.
  - Do not change the hero `<img>` source, its `object-fit` behavior, title copy, or dock copy.
  - On desktop, use two fixed-height action rows. The play action occupies the first column and spans both rows. Place Rankings, Achievements, and Coin Shop in the first row to its right. Place Credits and Sound Settings in the second row, with Sound Settings in the rightmost column.
  - Do not rely on child `nth-child()` for optional action placement. Use explicit classes; retain working `.main-menu-sound` and `.main-menu-credits` selectors.
  - On narrow screens, use the existing compact responsive flow without horizontal overflow; keep the start action prominent and all secondary actions reachable.
- **Acceptance Criteria**:
  - The footer remains within its prior height and does not cover more of the title illustration.
  - Sound Settings is the rightmost lower-row action on desktop; the Play button extends down through the paired rows.
  - Rankings, achievements, shop, sound settings, and credits remain available when their callbacks are supplied.

### I02. Mode selection card proportions
- Related Files:
  - `src/app/screens/ModeSelect.tsx` :: `ModeSelect` — two mode cards and back action; modify only if selectors or accessible labels need refinement.
  - `src/styles/global.css` :: `.progression-screen`, `.progression-panel--mode`, `.mode-options`, `.mode-option`, `.mode-option__art`, `.mode-option__details`, and related mobile media queries — size, spacing, and responsive behavior; modify.
- **Layout constraints**:
  - Preserve the two mode choices, descriptions, metadata, icons, and `onSelect` behavior.
  - Constrain the cards and content width so short copy does not stretch into oversized, visually empty panels.
  - Keep card action cues aligned and visible; stack cards at narrow widths according to existing responsive behavior.
  - Preserve the shared pastel theme and existing title background treatment.
- **Acceptance Criteria**:
  - Both mode choices have clear visual hierarchy and comparable, content-led proportions.
  - The back action, descriptions, and card actions remain visible at desktop and narrow mobile sizes without horizontal page overflow.

## Validation
- `npm test -- src/app/screens/MainMenu.test.tsx` — existing title menu behavior tests pass.
- `npm run lint` — no lint errors.
- `npm run typecheck` — no TypeScript errors.
- `npm run build` — production build completes.
- Manual visual review at 1440×900, 915×412, and 390×844; confirm title-art visibility, stable footer height, mode-card balance, and absence of page-level horizontal scroll.

## Commit Message
```text
fix(ui): polish title and mode selection layouts

Plan: 2026-11-04-predeploy-ui-ux-polish
Phase: P01-screen-polish
Task: T01-title-and-mode

- Preserve title artwork visibility and footer height
- Refine the title action dock and mode-card proportions
```

## Progress
- [x] Implementation complete
- [x] Automated validation passed
- [x] Automated validation passed (`MainMenu.test.tsx`, lint, typecheck, build, diff check).
- [ ] Post-fix browser review remains unavailable because the browser access host is unavailable; the supplied screenshot identified the wrap issue and the correction is enforced with a no-wrap label rule.
- commit: pending
