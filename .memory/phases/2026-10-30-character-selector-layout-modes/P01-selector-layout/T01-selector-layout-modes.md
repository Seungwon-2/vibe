# Task: T01 Selector Layout Modes

## Status: done

## Goal

Make the five-character selector visually consistent across wide desktop, tablet/compact landscape, and portrait viewports, with complete sprite silhouettes and no clipped primary actions.

## Decision Summary

- Use explicit width/orientation/height breakpoints to switch compositions; do not lock the UI to one fixed pixel canvas.
- Desktop and tablet/landscape retain a side-by-side showcase and roster. Wide desktop uses 3 roster columns; tablet and compact landscape use compact art bounds.
- Portrait moves the showcase above a two-column card grid. Use document scrolling on short portrait screens if needed instead of shrinking content until it clips.
- Every card uses the same preview frame sizing and normalized art presentation. Do not change screen colors or game layout.

## Implementation

### I01. Replace conflicting character selector responsive rules

- Related Files:
  - `src/styles/global.css` :: selector layout rules from `.selector-shell` through selector media queries and viewport-fit overrides; modify

#### Details

- Consolidate selector-specific responsive rules into a single final section so later legacy selector rules cannot override the selected mode.
- Base desktop mode (`min-width: 1200px` and `min-height: 700px`): panel max width 1520px and viewport-bounded; showcase occupies about 40% of the content row; roster occupies about 60%, has 3 equal columns and 2 equal rows, with roster card 5 at column 2 / row 2.
- Compact landscape/tablet mode (`min-width: 761px` and either `max-width: 1199px` or `max-height: 699px`): keep side-by-side layout, use a 38–42% showcase column, three roster columns and 2 rows, compact header/footer spacing, and a roster sprite box between 72px and 108px depending on height.
- Portrait mode (`max-width: 760px`): allow `.selector-shell` document scrolling (`min-height: 100dvh`, `height: auto`, `overflow-y: auto`); stack a 190–230px showcase above a 2-column, 3-row roster; center the fifth card in row 3; reserve room for the confirm action.
- Short portrait mode (`max-width: 420px` or `max-height: 620px` within portrait): reduce outer gaps only. Keep names, status badges, passive, and CTA legible; do not hide the CTA or card art.
- Set explicit, equal `.character-card__art` and `.character-preview--roster` bounds per mode. Set the same `--preview-size-scale` for all cards in that mode. Preserve natural atlas frame aspect and align the preview baseline; do not distort or use image cropping to equalize character size.
- Remove or supersede contradictory selector rules that assign 2 versus 3 columns at the same target size. Leave title-screen rules and global colors intact.

### I02. Validate selector behavior

- Related Files:
  - `src/app/screens/CharacterSelect.test.tsx` :: selector content, selection and CTA behavior; read-only
  - `src/styles/global.css` :: responsive layout; validate

#### Details

- Run `npm run test -- src/app/screens/CharacterSelect.test.tsx`.
- Run `npm run build`.
- Inspect available viewport modes in browser if browser automation is available: 1440x900 desktop, 1024x768 tablet, 915x412 compact landscape, and 390x844 portrait. Verify no card art is cut at its name divider and CTA remains visible or reachable by scroll.
- If the connected browser is unavailable, record that limitation and rely on tests/build; do not claim screenshot validation.

## Acceptance Criteria

- [x] Wide desktop displays 3 roster columns and 2 rows with card 5 centered.
- [x] Tablet/compact landscape preserves side-by-side composition and complete card sprites.
- [x] Portrait uses two card columns with deliberate scrolling only when viewport height requires it.
- [x] Character art has a bounded display box and shared scale per mode, sized inside the card art region.
- [x] Existing interaction, colors, character ordering, and confirm callback remain unchanged.

## Validation

- `npm run test -- src/app/screens/CharacterSelect.test.tsx`
- `npm run build`
- Browser visual review at 1440x900, 1024x768, 915x412, and 390x844 when available.

## Commit Message

```text
fix(ui): stabilize character selector layout modes

Plan: 2026-10-30-character-selector-layout-modes
Phase: P01-selector-layout
Task: T01-selector-layout-modes

- Use consistent desktop, compact landscape, and portrait compositions
- Keep roster sprites fully visible at a shared scale
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm run test -- src/app/screens/CharacterSelect.test.tsx`; `npm run build`)
- Browser screenshot audit unavailable: the browser host could not be reached in this environment.
- commit: `fix(ui): stabilize character selector layout modes` on `project02`
