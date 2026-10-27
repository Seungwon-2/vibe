# Task: T04 UI Visual Validation

## Status: done

## Goal

Verify the redesigned React screen flow at desktop, compact landscape, and narrow portrait sizes, including accessible contrast and complete action reachability.

## Decision Summary

- Validate the approved 1366×768, 844×390, 667×375, and 320×640 viewport set.
- Portrait selector pages may scroll vertically; no selector page may scroll horizontally. The running game remains landscape-only and retains its existing rotate/pause behavior.

## Implementation

### I01. Automated regression and visual review

- Related Files:
  - `src/app/screens/CharacterSelect.test.tsx` :: responsive-selector assertions; modify if necessary.
  - `src/App.test.tsx` :: complete navigation flow; modify if necessary.
  - `src/styles/global.css` :: final responsive/focus/contrast corrections; modify if needed.
  - `.memory/phases/2026-10-27-character-selector-visual-refresh/P01-ui-and-selector/phase.md` :: progress; update on completion.

#### Details

- Run the full suite and type/lint/build checks.
- Capture the selector at all four widths; capture menu/run/pause/rankings/results at 1366×768 and 844×390. Review every screen for clipped card content, CTA below inaccessible scroll, horizontal overflow, mismatched SD sprite baselines, portrait cropping, and text/control contrast.
- Check responsive flow with all five characters: playable cards are first; Toa and Rang remain disabled at the end; the fifth card stays centered in the grid's last row on wide screens.
- Use `prefers-reduced-motion: reduce` and keyboard-only focus once; confirm the selector preview falls back to its first frame and all actions remain reachable.
- Record screenshots/review dimensions in this task's progress and update P01 progress table.

## Acceptance Criteria

- [x] User-reviewed selector screenshots at portrait and compact landscape, plus the 915×412 runner screen; the latest compact layout was accepted for this phase.
- [x] Fixed observed sprite clipping/scale issues and kept selector actions visible in reviewed captures.
- [x] Existing interaction, sprite animation, and reduced-motion regression tests pass.
- [ ] Full manual matrix (all four selector sizes and menu/run/pause/ranking/result at both target sizes) was not captured in this session; user accepted closing P01 without that additional review.

## Validation

- `npm test` — full React and game regression suite.
- `npm run typecheck` — TypeScript.
- `npm run lint` — ESLint.
- `npm run build` — production build.
- Manual visual review at viewport sizes specified above.

## Commit Message

```text
test(ui): verify pastel screen layouts

Plan: 2026-10-27-character-selector-visual-refresh
Phase: P01-ui-and-selector
Task: T04-ui-visual-validation

- Review selector and all React screens at desktop and mobile widths
- Preserve complete navigation and accessible controls
```

## Progress

- [x] Fixed roster scaling: the perceptual scale custom property now lives on the wrapper that applies the transform; added coverage for all five character metrics.
- [x] Fixed the disabled-card badge offset that pushed “준비 중” outside card bounds and defined the missing `.sr-only` utility that exposed the live announcement visually.
- [x] Automated validation passed: full suite (86 tests), typecheck, lint, and production build.
- [x] Follow-up sizing correction: reduced showcase and roster sprite scales at desktop, landscape, tablet, and narrow-phone breakpoints after the user reported clipping. Shared per-character metrics remain intact so character silhouettes stay normalized.
- [x] Restart showcase victory playback when the selected character changes by remounting the preview with the selected character ID as its key; regression coverage confirms the previous preview is replaced and the new preview starts at frame 00.
- [x] Corrected the one-shot sprite-sheet animation stepping: the last frame is reached through five frame intervals, preventing the six-frame victory strip from sliding through fractional positions. Reduced the left showcase sprite scale slightly at each responsive breakpoint.
- [x] Reduced the result-screen SD sprite scale after screenshot review showed it dominating the portrait stage: desktop scale 1.8 to 1.0; mobile scale 1.2 to 0.75. Added a result animation first-frame regression assertion.
- [x] Reviewed the user-provided portrait and 915×412 landscape selector screenshots. The compact-landscape 2×3 card grid compressed sprite art and pushed the confirmation button below the viewport; switched this breakpoint to a centered 3×2 roster and tightened vertical spacing so cards and CTA fit more comfortably.
- [x] Reviewed the user-provided 915×412 landscape run screenshot. The game board was capped by a conservative 120px height reservation; compact-landscape rules now compress the outer header/help and use the recovered vertical space to enlarge the 16:9 playfield.
- [x] Follow-up screenshot still showed no perceptible run-screen increase and clipped selector card sprites. Locked the compact-landscape run layout to the viewport height, removed the redundant external keyboard help row there, and positioned preview wrappers from a predictable centered bottom anchor so reduced-size card sprites stay inside their art viewport.
- [x] Revalidated after follow-up: full suite (86 tests), typecheck, lint, and production build passed. Build still reports the existing >500 kB JavaScript chunk warning.
- [x] The user explicitly asked to close this phase after reviewing the latest compact layouts; outstanding viewport/screen captures are recorded as deferred.
- Completion commit: pending

