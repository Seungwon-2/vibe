# Task: T04 Character Showcase Selector

> **Roster reconciliation:** Keep the five catalog characters. Rin, Hiyori, and Mary are playable; Toa and Rang remain visible as “준비 중”. Do not restore Yuni/Lize or make unavailable characters selectable.

## Status: done

## Goal

Recompose character selection around one large selected-character showcase and a compact roster while preserving existing selection, availability, animation, accessibility, and run-start behavior.

## Decision Summary

- Use `CHARACTERS` and central character/passive configuration for IDs, accent colors, portrait and atlas URLs, availability, and tuning.
- Desktop/landscape shows a large left showcase and a two-column roster on the right. The fifth roster card is centered in the last row. Preparing characters remain after playable characters.
- The selected playable character runs its 12-frame animation at 64ms per frame (768ms); roster SD sprites show idle. The CTA confirms selection and starts the existing three-second countdown.
- This task changes React/CSS presentation only. It does not change sprite art, physics, passive values, runner timing, or catalog schema.

## Implementation

### I01. Recompose selector and previews

- `src/app/screens/CharacterSelect.tsx`: selected candidate state, showcase, roster, passive summary, CTA.
- `src/app/components/CharacterPreview.tsx`: add showcase/roster variants and animation test IDs.
- Read-only sources: `src/game/characters/characterCatalog.ts`, `src/game/characters/characterAbilities.ts`.
- Keep the existing props and `resolveCharacterId` behavior. The showcase portrait is decorative and dimmed; its large SD sprite, name, and passive summary update together. Passive descriptions derive from `getCharacterPassive`: Rin time bonus +1s, Toa slide release grace 150ms, Rang second jump +8%, Hiyori pickup radius +20px, Mary hit protection +250ms.
- Show five roster cards in playable-first order, two columns, with the fifth card centered. Every card shows portrait, idle SD sprite, and name. Toa and Rang are disabled and labeled “준비 중”. Selected state uses accent border/glow, pressed state, and a visible text marker.
- Use a polite, text-only selected-name announcement. Preserve keyboard order/focus, back and confirm separation, and `prefers-reduced-motion` first-frame fallback.

### I02. Responsive presentation

- `src/styles/global.css`: selector showcase, roster, portrait/landscape layout, focus and safe-area rules.
- `src/app/screens/CharacterSelect.test.tsx`: roster, motion, availability, CTA, and back behavior.
- Aim for a 42/58 showcase/roster split on wide layouts. At 844x390 and 667x375 reduce padding and sprite/card sizes, allowing vertical scrolling so CTA remains reachable. At portrait/narrow widths stack showcase above the roster. Avoid horizontal page scroll; touch targets remain at least 44px.
- Use existing local portrait and atlas assets only. No rarity, level, price, MAX, shop, unlock, or world/stage UI.

## Acceptance Criteria

- [x] One showcase sits beside the complete five-character roster; the fifth card is centered on the final row.
- [x] Selecting a playable character updates portrait, SD sprite, name, passive, and accent together; the showcase runs and roster sprites remain idle.
- [x] Toa and Rang remain visible as disabled “준비 중” cards.
- [x] No rarity, level, price, MAX, shop, unlock, or world/stage UI appears.
- [x] Responsive breakpoints implement a two-column roster and scrollable CTA layout for landscape and portrait widths. Manual viewport screenshots remain unverified.
- [x] Start passes only the current playable `CharacterId`; back only invokes `onBack`.

## Validation

- `npm test -- src/app/screens/CharacterSelect.test.tsx` — passed (5 tests).
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run build` — passed; existing large-bundle warning remains.
- Full `npm test` — passed (72 tests).
- Manual screenshot review at 1366x768, 844x390, 667x375, and 320px portrait could not be performed: no browser/device surface was connected and headless Edge produced no captures. Local preview is available at `http://localhost:5173/`.

## Commit Message

```text
feat(ui): build character showcase selector

Plan: 2026-10-26-running-action-redesign
Phase: P03-course-and-ui
Task: T04-character-showcase-selector

- Reframe five portraits into a selected hero and compact roster
- Preserve accessible selection and the existing run preview
```

## Progress

- [x] Implementation complete
- [x] Automated validation passed
- commit: pending
