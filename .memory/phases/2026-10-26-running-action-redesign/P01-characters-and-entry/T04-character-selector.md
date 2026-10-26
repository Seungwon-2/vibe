# Task: T04 Character Selector

## Status: done

## Goal

Port the four vertical character cards into Project 02 and show a looping run animation whenever a card is selected.

## Decision Summary

- Before selection show a front-facing idle; after selection continuously loop the selected character's run frames. Keep portrait background, SD sprite foreground, name, and symbolic-color border.
- Selecting a character only confirms the candidate; the primary start button confirms the character and returns its ID to the app.

## Implementation

### I01. Implement preview and card interaction

- Related Files:
  - `src/app/screens/CharacterSelect.tsx` :: `CharacterSelect`, card list, candidate state; new.
  - `src/app/components/CharacterPreview.tsx` :: `CharacterPreview` frame cycler; new.
  - `src/app/screens/CharacterSelect.test.tsx` :: selection, animation, accessibility, and confirm tests; new.
  - `src/styles/global.css` :: selector card, portrait, preview, selected border, responsive horizontal card rail; modify.

#### Details

- Props: `CharacterSelectProps = { selectedCharacterId: CharacterId; onConfirm(characterId: CharacterId): void; onBack(): void }`.
- Render catalog order in four tall cards. Each button has `aria-pressed`, a name-based accessible label, portrait as decorative image, SD preview, and visible character name. Use CSS custom property `--character-accent` for selected border/glow; do not print hex values or a color label.
- Before selection render the first idle frame. On selection, `CharacterPreview` cycles the four `run` frame URLs at 12.5 frames/second (80ms per frame); it returns to frame 0 when the selected ID changes. Give wide-stride frames 0/2 an 8px display-only lift and keep contact frames 1/3 low so the motion reads as running. Use an interval/ref cleanup on unmount. Respect `prefers-reduced-motion` by showing the first run frame without cycling or speed-line effects.
- Keep the start CTA below the cards. It calls `onConfirm(candidateCharacterId)` exactly once. The back control calls `onBack` and never starts a run.
- At widths below 760px use an overflow-x card rail with snap points; do not shrink four cards into unreadable columns. Keep the landscape page content within the viewport and make card/button targets at least 44px tall.
- Add no world-map text or stage selection UI.

### I02. Verify selector behavior

- Related Files:
  - `src/app/screens/CharacterSelect.test.tsx` :: tests; new.

#### Details

- Verify all four display names are shown, first character is selected by default when the supplied ID is invalid, click changes `aria-pressed`, selected preview uses run frames, unselected preview uses idle, CTA passes the chosen ID, back invokes only `onBack`, and frame timer is cleaned up on unmount.

## Acceptance Criteria

- [x] Four cards show the correct portrait, SD sprite, name, and accent border.
- [x] Selected character visibly runs in a repeating animation; unselected cards show front-facing idle.
- [x] Keyboard focus, screen-reader pressed state, reduced-motion behavior, and back/start actions work.
- [x] Cards remain horizontally scrollable and unclipped on narrow screens.

## Validation

- `npm test -- src/app/screens/CharacterSelect.test.tsx` — validates selector behavior.
- `npm run typecheck` — validates catalog and component props.

## Commit Message

```text
feat(ui): port animated runner character selector

Plan: 2026-10-26-running-action-redesign
Phase: P01-characters-and-entry
Task: T04-character-selector

- Show four portraits with selected-character running previews
- Confirm a character before entering the run flow
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm test`; `npm run typecheck`; `npm run build`)
- commit: 79e6214
