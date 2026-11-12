# Task: T01 Screen Comfort and Layout

## Status: done

## Goal
Make the title, mode/character/stage selection, runner HUD, dialogs, and results comfortable to read without wasting the playable area or introducing page scrolling at supported desktop and mobile landscape sizes.

## Decision Summary
- Preserve the existing pastel Stella Runner visual language and title illustration.
- Improve contrast and reduce bright/high-saturation surfaces based on rendered comparisons; do not replace the visual identity or resize the whole title footer.
- Game canvas and HUD must share a stable width and remain usable in landscape; portrait may show the existing rotate/pause guidance.

## Implementation

### I01. Inspect and tune screen layout and palette
- Related Files:
  - `src/styles/global.css` :: screen layout, shared color tokens, responsive breakpoints; modify
  - `src/app/screens/MainMenu.tsx` :: title menu structure; read-only unless a layout defect requires a local markup change
  - `src/app/screens/CharacterSelect.tsx` :: selection card layout; modify only if CSS cannot correct clipping
  - `src/app/screens/StageSelect.tsx` :: stage-card viewport and scroll; modify
  - `src/app/screens/RunScreen.tsx` :: HUD/game-frame wrapper; modify
  - `src/app/screens/RunResult.tsx` and `src/app/screens/StoryResult.tsx` :: result layout; modify only as needed
- Details
  - Inventory existing screen classes and media queries before editing. Use CSS custom properties for the shared background, panel, text, border, and accent colors; avoid per-screen conflicting overrides.
  - Set explicit `min-width: 0`/`min-height: 0` and grid/flex shrink rules where children force overflow. Keep the game stage aspect ratio stable and size the HUD to the same content frame.
  - Use responsive sizing within the existing screen shell rather than hard fixed pixel dimensions. At short viewports, reduce gaps and typography before allowing the primary action or controls to be clipped.
  - Keep controls and text readable at 320 CSS px mobile width and at 1366×768 desktop; no horizontal page overflow. Selection and stage screens should fit their principal content without hiding actionable cards.
  - Compare before/after screenshots at 320×720, 915×412, 1366×768, and 1920×1080. Capture any intentionally scrollable secondary panel separately; the main game flow must not require page scroll.
- Validation
  - Add/update UI tests only where existing tests can assert semantic structure or responsive state; visual checks remain documented manual verification.

## Acceptance Criteria
- [x] Text and controls meet legibility contrast in normal and selected/disabled states.
- [x] No title illustration is obscured by a taller footer; primary actions remain centered and unwrapped.
- [x] Character/stage cards, runner HUD, and game frame do not clip or create horizontal scrolling at the listed viewports.
- [x] HUD dimensions remain stable when temporary pickup/passive cues appear or disappear.

## Validation
- `npm run test -- --run src/app/screens` — passed (8 files, 36 tests).
- Manual responsive review at 320×720, 915×412, 1366×768, and 1920×1080 — no page overflow on title/mode/stage flow; stage-selection cards and footer fit; at 915×412 the runner HUD and 16:9 game frame share a 434px width and fit in the viewport.
- Runner HUD cue check at 915×412 — adding/removing a speed cue left HUD height (116px) and game-frame dimensions (434×244px) unchanged.
- `npm run typecheck` — passed.
- `git diff --check -- src/styles/global.css` — passed.

## Commit Message
```text
fix(ui): improve screen comfort and responsive layout

Plan: 2026-11-12-runner-feedback-recovery
Phase: P01-readability-and-controls
Task: T01-screen-comfort-and-layout

- Reduce visual fatigue while preserving the current art direction
- Prevent clipping and keep runner HUD aligned to the game frame
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 280be20
