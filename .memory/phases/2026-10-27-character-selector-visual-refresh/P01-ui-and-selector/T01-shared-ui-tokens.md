# Task: T01 Shared Pastel UI Tokens

## Status: pending

## Goal

Define a consistent light pastel design foundation for all React screens without changing screen structure or interaction behavior.

## Decision Summary

- Common page surfaces use cloud white and pale sky blue; lavender is a secondary accent and character accents remain available through `--character-accent`.
- Keep text and actionable controls legible on light and translucent surfaces. Do not place pale text on pale backgrounds.
- This task provides shared tokens and page backgrounds; screen-specific structure and the Phaser scene palette are handled by later tasks.

## Implementation

### I01. Define shared tokens and global defaults

- Related Files:
  - `src/styles/global.css` :: `:root`, `body`, `button`, shared focus rules; modify.

#### Details

- Add CSS custom properties to `:root` for `--ui-page`, `--ui-surface`, `--ui-surface-soft`, `--ui-surface-raised`, `--ui-text`, `--ui-muted`, `--ui-primary`, `--ui-primary-strong`, `--ui-lavender`, `--ui-border`, `--ui-shadow`, and `--ui-danger`.
- Initial palette: page `#F3F8FF`, white surface `#FFFFFF`, soft surface `#E8F1FF`, raised surface `#F8FAFF`, primary text `#25395D`, muted text `#526A91`, primary `#548BD3`, strong primary `#356DB5`, lavender `#A893E9`, border `#C5D7F2`, danger `#B34D62`. Character-specific accents continue to come from `CharacterDefinition.accentColor`.
- Replace the global dark navy `:root` and `body` canvas with layered pale-sky/white gradients. Do not apply a global filter or opacity to character art.
- Retain `:focus-visible` outlines; tune them to a visible dark blue/lavender outline with at least 3px thickness and 3px offset.
- Do not restyle class-level cards in this task; later tasks consume the tokens.

### I02. Verify token wiring

- Related Files:
  - `src/styles/global.css` :: `:root` declarations; modify.

#### Details

- Add a small source-level test only if the existing project already has a CSS assertion convention; otherwise validate through build/lint and visual review without adding a CSS parser dependency.
- Confirm every token has a single canonical declaration and that existing `--character-accent` selectors still override only character-specific accents.

## Acceptance Criteria

- [ ] Global page background is light and uses the agreed cloud-white/pale-sky palette.
- [ ] Shared tokens exist with the names and initial values above.
- [ ] Focus rings remain visible and character accent colors remain data-driven.
- [ ] No UI component or game interaction changes in this task.

## Validation

- `npm run lint` — validates stylesheet-adjacent source and repository lint rules.
- `npm run build` — validates the CSS bundle.
- Manual: inspect the menu, selector, run, rankings, and result screens on the light global canvas.

## Commit Message

```text
style(ui): define pastel visual tokens

Plan: 2026-10-27-character-selector-visual-refresh
Phase: P01-ui-and-selector
Task: T01-shared-ui-tokens

- Set cloud-white and pale-sky shared surfaces
- Preserve readable text and character accents
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

