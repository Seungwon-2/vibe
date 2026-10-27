# Task: T04 UI Visual Validation

## Status: in_progress

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

- [ ] Selector has no clipped showcase, cards, names, disabled labels, or CTA at target widths.
- [ ] SD card sprites appear at equal perceived height and a shared baseline.
- [ ] No horizontal page overflow at 320px portrait; vertical scroll reaches CTA.
- [ ] Menu, HUD, pause, ranking, and results are legible across reviewed viewports.
- [ ] Existing interactions and reduced-motion/accessibility behavior pass regression tests.

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
- [x] Revalidated after follow-up: full suite (86 tests), typecheck, lint, and production build passed. Build still reports the existing >500 kB JavaScript chunk warning.
- [ ] Manual review after the fix at all required viewports remains outstanding because this session has no browser surface. The user-provided screenshot was inspected to identify the defects, but no post-fix capture is available.
- partial commits: `44a2922` and `40de34c` on `project02`; leave T04 in progress until manual viewport review

