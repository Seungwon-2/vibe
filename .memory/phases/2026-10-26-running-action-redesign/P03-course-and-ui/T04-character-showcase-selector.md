# Task: T04 Character Showcase Selector

> **Needs replan before execution:** This older four-card/2×2 blueprint predates `2026-10-26-rin-unified-motion`. The active roster is Rin, Toa, Rang, Hiyori, and Mary. Replace all four-character assumptions, portrait/passive examples, card counts, and responsive acceptance criteria with five-character versions before this task is executed; do not reintroduce Yuni/Lize.

## Status: pending

## Goal

Recompose the existing four-character selection screen around one large selected-character showcase and a compact four-card roster, using the user's second screenshot for visual hierarchy while preserving Project 02's selection, animation, accessibility, and start flow.

## Decision Summary

- The four existing characters remain the complete roster: Aokumo Rin (`player-default`, `#2b66c0`), Shizuki Toa (`goth-student`, `#513661`), Ayatsuno Yuni (`moonwing`, `#857fd8`), and Akane Lize (`akane-lize`, `#971b2f`). Read these from `CHARACTERS`; do not duplicate their IDs, colors, portrait URLs, atlas URLs, or passive tuning in the view.
- The screenshot's composition is a reference only. Use a large left showcase and 2x2 portrait roster on the right. Do not add rarity, level, price, MAX, unlock, purchase, or upgrade state.
- Clicking a roster card changes the candidate and its accent frame. The large selected SD sprite loops its existing 12-frame `run` animation in 768ms; small roster SD sprites show front-facing idle. The primary button confirms the candidate and starts the existing 3-second runner countdown through `onConfirm`.
- This task changes React/CSS presentation, not sprite pixel artwork, physics, passives, runner timing, or the catalog schema.

## Implementation

### I01. Recompose the React selector

- Related Files:
  - `src/app/screens/CharacterSelect.tsx` :: `CharacterSelect`, `CharacterSelectProps`, candidate state, hero/roster markup; modify.
  - `src/app/components/CharacterPreview.tsx` :: `CharacterPreview`, `CharacterPreviewProps`, hero/roster variant; modify.
  - `src/game/characters/characterCatalog.ts` :: `CHARACTERS`, `getCharacter`, `resolveCharacterId`; read-only.
  - `src/game/characters/characterAbilities.ts` :: `CharacterPassiveId`, `getCharacterPassive`; read-only.

#### Details

- Preserve `CharacterSelectProps = { selectedCharacterId: CharacterId; onConfirm(characterId: CharacterId): void; onBack(): void }`. Initialize `candidateCharacterId` with `resolveCharacterId(selectedCharacterId)` and derive `selectedCharacter = getCharacter(candidateCharacterId)` each render. No new persistence or purchase fields.
- Replace the current four equal-width tall cards with `<div className="selector-layout">` containing `<section className="selector-showcase">` on the left and `<div className="character-roster">` on the right. Keep the back button in the header and the single confirm button in the footer, below both columns. Do not nest buttons inside roster buttons.
- Showcase: render the selected character's portrait as a decorative, dimmed background; overlay one large `CharacterPreview` in `variant="showcase"` with `selected={true}`; show its visible display name and one short passive summary. Map the four passive IDs to plain Korean descriptions using `getCharacterPassive(selectedCharacter.id)`: Rin `시간 아이템 +1초`, Toa `슬라이딩 해제 후 0.15초 유지`, Yuni `2단 점프 힘 +12%`, Lize `충돌 시간 감소 4초`. Keep the text tied to the central passive configuration instead of hard-coding alternate gameplay values.
- Roster: map `CHARACTERS` in catalog order to four buttons in a 2x2 grid. Each button contains the portrait, a smaller `CharacterPreview` in `variant="roster"` with `selected={false}` for front-facing idle, and a visible character name. Give the selected button `aria-pressed="true"`, `--character-accent: character.accentColor`, an accent border/glow, and a visible non-color-only selected marker. Nonselected buttons retain `aria-pressed="false"`.
- Change `CharacterPreviewProps` to `{ character: CharacterDefinition; selected: boolean; variant?: 'showcase' | 'roster' }` with `roster` as the default. Keep atlas frame extraction and the 12 x 64ms CSS step cycle; only the showcase loops `run`. Use distinct test IDs such as `character-preview-${character.id}-${variant}` so the selected character's hero and roster previews are separately queryable. Respect `prefers-reduced-motion` by holding the first run frame in the showcase.
- The confirm button calls `onConfirm(candidateCharacterId)` once on activation. The back button calls only `onBack`. Selection changes never start the run automatically. Keep button order logical for keyboard Tab, a visible `:focus-visible` outline, and a text-only `aria-live="polite"` selected-name announcement (do not announce animation frames).

### I02. Implement reference-led responsive layout

- Related Files:
  - `src/styles/global.css` :: `.selector-*`, `.character-roster`, `.character-card`, `.character-preview*`, `.selector-confirm`, landscape/portrait media rules; modify.
  - `src/app/screens/CharacterSelect.test.tsx` :: selector semantics, hero/roster animation, CTA, reduced-motion structure; modify.

#### Details

- Desktop/landscape: set `.selector-layout` to roughly 42% showcase / 58% roster with a 16-24px gap. Let the left portrait crop decoratively behind an SD sprite scaled from the 96x96 atlas; keep the name, passive text, and sprite fully visible. Use a 2x2 roster rather than more cards, with portrait-dominant interiors and compact name strips. Use inner pseudo-elements for the reference's slanted/angled trim; keep the outer button and its focus outline rectangular and unclipped.
- Landscape 844x390 and 667x375: reduce panel padding, hero sprite scale, portrait height, and card gaps so the back button, all four cards, names, and primary CTA are reachable. Allow vertical scrolling when needed; never clip the CTA or add horizontal page scrolling. All click/touch targets are at least 44 CSS px tall. Respect `env(safe-area-inset-*)` around edges.
- Portrait/narrow viewports: stack showcase above roster, keep the roster 2x2, allow vertical page scroll, and avoid clipped cards/CTA. The runner itself still requires landscape; do not make portrait gameplay here.
- Keep the selected accent `#2b66c0`, `#513661`, `#857fd8`, or `#971b2f` via `character.accentColor` without printing the hex value. Use existing local portraits and atlases, no screenshot crop, remote URL, new currency icon, or gacha label.
- Update the existing tests to expect one running showcase preview for the selected ID, four idle roster previews, correct names and pressed states, no level/price/MAX text, candidate changes reflected in the hero, confirm/back separation, and the reduced-motion CSS fallback. Do not change `CharacterDefinition` or `CharacterId`.

## Acceptance Criteria

- [ ] One large selected-character showcase appears left of a complete 2x2 four-character roster in desktop and landscape layouts.
- [ ] Selected portrait/SD/name/passive and accent border change together; only the hero runs, roster SD previews remain front-facing idle, and reduced-motion users see a still run pose.
- [ ] The selection screen contains no level, rarity, MAX, price, shop, unlock, or world/stage map UI.
- [ ] Back, four roster buttons, and the single start CTA remain keyboard accessible and usable at 1366x768, 844x390, 667x375, and a 320px-wide portrait viewport without clipped content.
- [ ] Clicking the start CTA passes only the currently selected `CharacterId`; no gameplay value or persisted record changes.

## Validation

- `npm test -- src/app/screens/CharacterSelect.test.tsx` — verifies candidate state, previews, accessible controls, and confirm/back behavior.
- `npm run typecheck` — verifies unchanged catalog IDs and updated preview props.
- `npm run build` — verifies local portrait and atlas bundling.
- Manual: inspect the selector at 1366x768, 844x390, 667x375, and 320px portrait; switch through all four characters and verify full names, SD sprites, accent states, the back button, and a reachable start CTA.

## Commit Message

```text
feat(ui): build character showcase selector

Plan: 2026-10-26-running-action-redesign
Phase: P03-course-and-ui
Task: T04-character-showcase-selector

- Reframe four portraits into a selected hero and compact roster
- Preserve accessible selection and the existing run preview
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
