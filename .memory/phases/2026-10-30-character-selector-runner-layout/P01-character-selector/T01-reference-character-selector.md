# Task: T01 Reference Character Selector

## Status: done

## Goal

Replace the current portrait showcase and roster grid with the supplied reference's horizontal five-card selector, preserving gameplay selection behavior and showing each character's passive icon and full effect.

## Decision Summary

- Card order is Rin, Hiyori, Mary, Toa, Rang. Each card uses its runtime SD artwork, Korean full name, passive icon, passive name, and effect.
- A lower runway displays all five characters looping the existing run animation. Selecting a card highlights it in its accent color and updates the start button; the internal character ID remains unchanged.
- Change user-facing names globally to Korean full names, while preserving stable IDs and saved record compatibility.
- On narrow viewports, cards remain readable through horizontal snap scrolling; bottom back/start actions remain reachable.

## Implementation

### I01. Rebuild selector markup and card data

- Related Files:
  - `src/app/screens/CharacterSelect.tsx` :: `SELECTOR_CHARACTERS`, `CharacterSelect`; replace the old showcase markup and enrich the card markup.
  - `src/app/components/CharacterPreview.tsx` :: `CharacterPreviewProps`, preview class generation; add a `runway` variant and retain its frame sizing behavior.
  - `src/game/characters/characterCatalog.ts` :: `CHARACTERS`; change visible `displayName` values to Korean full names, preserving each ID and accent color.

#### Details

- Define explicit order in `CharacterSelect.tsx`: `player-default`, `hanayo-hiyori`, `tokino-mary`, `goth-student`, `cogane-rang`. Do not sort by availability.
- Each `.character-card` button must retain `aria-pressed`, disabled behavior for unavailable characters, and click-to-select behavior. Use `aria-label={character.displayName}` so nested passive copy does not make the accessible button name ambiguous.
- Render card art with `CharacterPreview` using `variant="roster"`, `animation="idle"`, and looping. Beneath the art render the Korean full name and a `.character-card__passive` block containing `CharacterAbilityIcon` (size 28), `getCharacterPassive(character.id).name`, and `.effectLabel`. For any null icon, omit only the image and preserve text.
- Remove the old `.selector-showcase` portrait and victory preview.
- Add a `.selector-runway` band containing the same five characters in the same order. Each preview must use `animation="run"`, `loop`, `variant="runway"`, character accent CSS variable, and a stable test id `selector-runner-{character.id}`. Use the existing runtime atlases; do not add new image files.
- Preserve back callback and confirm callback. Start button text is `'{Korean short name} · 달리기 시작'`, with short names Rin=린, Hiyori=히요리, Mary=메리, Toa=토아, Rang=랑. The callback still receives the selected internal `CharacterId`.
- Header title becomes `누구와 달려볼까요?`; explanatory text tells the user to choose a character and use the run button below. Keep a back button.

### I02. Style selector for desktop and mobile

- Related Files:
  - `src/styles/global.css` :: selector-specific CSS; append/replace selector rules to implement the card strip, runway, and footer layout.

#### Details

- Keep the established light pastel selector palette and title art backdrop from the preceding task.
- Desktop layout: five equal card columns in one row, cards with rounded light surface, a rounded image well, Korean name and compact passive description. Selected card border uses `--character-accent` and a restrained accent shadow.
- The runway spans the content width below the cards with a soft lavender-to-peach surface and baseline. Space the five runner previews evenly; selected runner gets a subtle accent halo. Keep sprite frames fully visible with existing atlas rendering and no clipping.
- Place the back action at lower left and a selected-name start button at lower right. Preserve reachable focus-visible states and reduced-motion behavior already supported by CSS.
- At widths below 900px, use a horizontal card scroller with `scroll-snap-type: x mandatory`, fixed responsive card basis (minimum 200px), and visible scrollbar or clear edge affordance; do not squeeze five cards into tiny columns. Keep the runway horizontally scrollable as needed.
- At phone widths, maintain touch-sized cards, horizontally scrollable roster and runway, and a footer that wraps without hiding actions. Ensure the screen can scroll vertically when landscape height is insufficient.

### I03. Update selector and name tests

- Related Files:
  - `src/app/screens/CharacterSelect.test.tsx` :: selector behavior, animation, passives, and order tests; modify.
  - `src/App.test.tsx` :: app route flow and selected character start behavior; modify.
  - `src/game/characters/characterRegistry.test.ts` :: registry display-name expectation; modify.
  - `src/app/screens/RankingScreen.test.tsx` :: visible record names; modify expectations if global Korean names are asserted.

#### Details

- Assert ordered card buttons and exact Korean names; assert each card contains its corresponding passive icon, name, and effect text.
- Assert all five lower previews use `data-animation="run"`, loop infinitely, and have `data-testid="selector-runner-{id}"`.
- Assert selection updates `aria-pressed`, selected styling class, Korean start label, and passes the original internal ID to `onConfirm`.
- Retain coverage for back action, unavailable characters, preview sizing, and passive ability content. Update registry and ranking expectations for Korean display names.

## Acceptance Criteria

- [x] Five cards render in the agreed order with Korean names and all passive icons/descriptions.
- [x] Each lower runway preview visibly uses the run animation metadata and looping cadence.
- [x] Selection accent and start label follow the current character; callbacks still pass stable IDs.
- [x] Desktop and narrow screen CSS preserve readable card dimensions and reachable actions.
- [x] Targeted tests and production build pass.

## Validation

- `npm run test -- src/app/screens/CharacterSelect.test.tsx src/game/characters/characterRegistry.test.ts src/app/screens/RankingScreen.test.tsx`
- `npm run build`
- Review local browser at desktop and narrow landscape/mobile widths if browser tooling is available.
- Selector, registry, ranking, and app-flow tests passed (17 tests); production build passed. Browser control host was unavailable, so no rendered screenshot inspection was possible. Local dev server is already listening at `http://localhost:5173/` for manual review.

## Commit Message

```text
feat(selector): match the runner roster reference

Plan: 2026-10-30-character-selector-runner-layout
Phase: P01-character-selector
Task: T01-reference-character-selector

- Show Korean character names and passive icons in five roster cards
- Add a looping run-preview lane and preserve selected character IDs
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: feat(selector): match the runner roster reference
