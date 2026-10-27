# Task: T02 Character Selector Redesign

## Status: pending

## Goal

Make the selector visually consistent and uncluttered: display SD-only roster cards at a matched scale and show the selected character's portrait, SD sprite, name, passive, and selection animation in the left showcase.

## Decision Summary

- Keep `CHARACTERS`, playable-first sort, existing availability, accent colors, passive values, start CTA, and back action.
- Five cards remain in a two-column desktop grid with the fifth centered in the final row. Narrow layouts stack the showcase above a two-column card grid and remain vertically scrollable.
- Selected showcase plays victory once and holds the final frame. Roster cards loop idle.

## Implementation

### I01. Change selected showcase and roster markup

- Related Files:
  - `src/app/screens/CharacterSelect.tsx` :: `CharacterSelect`, `SELECTOR_CHARACTERS`, `passiveSummary`; modify.
  - `src/app/screens/CharacterSelect.test.tsx` :: selector content and behavior tests; modify.

#### Details

- Preserve props: `CharacterSelectProps = { selectedCharacterId: CharacterId; onConfirm(characterId: CharacterId): void; onBack(): void }`.
- Preserve `candidateCharacterId` state initialized with `resolveCharacterId(selectedCharacterId)` and preserve `SELECTOR_CHARACTERS` playable-first stable ordering.
- In the left `.selector-showcase`, retain the decorative `selectedCharacter.portraitUrl` image as the upper-body portrait backdrop; keep its `alt=""`. Keep the selected character's passive text and name. Render `CharacterPreview` in front with `animation="victory"`, `loop={false}`, and `variant="showcase"`.
- In each `.character-card`, remove `.character-card__portrait` and `.character-card__shade`. Keep one `.character-preview` configured with `variant="roster"` (idle loop), the name, selected marker, and disabled “준비 중” badge for unavailable entries. Do not use `portraitUrl` in roster-card markup.
- Keep button `aria-pressed`, character-name accessible label, disabled state, current `onConfirm(candidateCharacterId)`, and `onBack` separation.
- Extend tests to assert exactly one portrait image exists in the selector (the showcase backdrop), no roster card contains a portrait image, all five character names remain, selected state updates, unavailable cards stay disabled, and CTA/back behavior is unchanged.

### I02. Support a one-shot sprite animation with a held final frame

- Related Files:
  - `src/app/components/CharacterPreview.tsx` :: `CharacterPreviewProps`, `CharacterPreview`; modify.
  - `src/app/screens/CharacterSelect.test.tsx` :: one-shot preview animation tests; modify.
  - `src/styles/global.css` :: `.character-preview__sheet.is-animated`, `@keyframes character-preview-frames`, `prefers-reduced-motion`; modify.

#### Details

- Extend `CharacterPreviewProps` with `loop?: boolean`; default to `true` to preserve existing behavior for any other caller.
- For `loop={false}`, compute `--sprite-end-x` as the horizontal offset of the last frame: `-(animationStart.x + (frames.length - 1) * character.frameWidth)px`. For loop mode keep the existing end offset at `frames.length * frameWidth` so all frames cycle without a gap.
- Apply `animationIterationCount: loop ? 'infinite' : '1'` and `animationFillMode: loop ? 'none' : 'forwards'`. Keep the current animation duration rules: run 64ms/frame; all other animations 200ms/frame; `steps(frames.length, end)`.
- Showcase initial/changed candidate uses the 6-frame victory sequence (1,200ms) once, then remains on frame index 5. Roster idle sequences remain looping. Respect reduced motion by disabling CSS animation and showing the first frame; the static first-frame fallback is intentional under reduced motion.
- Extend tests for `data-animation="victory"`, six-frame duration, one iteration/fill mode, final-frame end offset, and roster idle loops. Keep pixel scale and pose metrics in `CharacterPreview` unchanged.

### I03. Standardize selector sizing and pastel cards

- Related Files:
  - `src/styles/global.css` :: `.selector-shell`, `.selector-panel`, `.selector-layout`, `.selector-showcase*`, `.character-roster`, `.character-card*`, `.character-preview--showcase`, `.character-preview--roster`, `.selector-footer`; modify.

#### Details

- Keep the wide split approximately 42% showcase / 58% roster; use a 6-column roster grid with each card spanning two columns and the fifth card centered on row two.
- On narrow portrait layouts, stack showcase first, use a two-column roster with the fifth card centered, and allow vertical document scrolling. Prevent horizontal overflow at 320px width.
- Use the same `.character-preview--roster` height, sprite scale variable, bottom baseline, border radius, and name-row height for all five cards. Do not add per-character card scale overrides; existing `PREVIEW_METRICS` continues to normalize perceived character height.
- Use white/soft-sky cards, muted lavender selection surface, and `--character-accent` border/glow for the selected entry. Keep disabled state visibly distinct without lowering the SD sprite opacity below legibility.
- Left showcase uses a soft portrait veil/gradient with text and SD sprite in front; do not tint source portrait pixels. Keep details legible over all existing portrait assets.
- Preserve safe-area padding, focus-visible state, reduced-motion fallback, minimum 44px interactive targets, and the existing start/back controls.

## Acceptance Criteria

- [ ] Roster cards contain only SD sprite and name; none uses portrait art.
- [ ] All five roster SD sprites share equal visual sizing/baseline, with the existing metric normalization.
- [ ] Left showcase displays the selected upper-body portrait, SD sprite, name, passive summary, and character accent.
- [ ] Selecting a character plays victory once and holds the last frame; unselected cards continue idle loops.
- [ ] Character order, playability, CTA/back behavior, keyboard semantics, and responsive behavior remain correct.

## Validation

- `npm test -- src/app/screens/CharacterSelect.test.tsx` — portrait placement, selection, availability, motion, and CTA.
- `npm run lint` — React/TypeScript and hooks.
- `npm run build` — CSS and component bundle.
- Manual screenshots: 1366×768, 844×390, 667×375, and 320×640; verify 42/58 composition, matched SD size, scroll reachability, and no horizontal overflow.

## Commit Message

```text
feat(ui): simplify character selector cards

Plan: 2026-10-27-character-selector-visual-refresh
Phase: P01-ui-and-selector
Task: T02-character-selector

- Use SD-only equal-scale roster cards
- Play selected victory pose once over the portrait showcase
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

