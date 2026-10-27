# Task: T01 Ability Visibility

## Status: done

## Goal

Make each assigned passive understandable before the run and visible during play, including Hiyori's remaining defensive charges and a short activation cue.

## Decision Summary

- Selection view: character-matched icon and name plus exact numeric effect.
- HUD: compact passive badge, remaining Hiyori defenses, and an event-driven activation cue. No active-skill button or settings screen.
- Names/icons: Rin 「질주의 메이드」 with cloud; Hiyori 「유령의 수호」 with pink flame; Mary 「별빛 자석」 with sparkling magnet. Toa/Rang stay unassigned.

## Implementation

### I01. Shared passive presentation and selector

- Related Files:
  - `src/game/characters/characterAbilities.ts` :: passive metadata — read-only from P02-T01.
  - `src/app/components/CharacterAbilityIcon.tsx` :: icon renderer — new.
  - `src/app/screens/CharacterSelect.tsx` :: `passiveSummary`, selected showcase — modify.
  - `src/app/screens/CharacterSelect.test.tsx` :: ability identity assertions — modify.
  - `src/styles/global.css` :: selector ability badge styles — modify.

#### Details

- Add `CharacterAbilityIcon({ icon, accentColor, size }: { icon: 'cloud' | 'pink-flame' | 'sparkling-magnet'; accentColor: string; size?: number }): React.JSX.Element` using inline SVG only; no external icon package or remote asset.
- Draw: cloud as three joined circles/curved base; pink flame as a single flame silhouette; sparkling magnet as a horseshoe with two sparkle marks. Set `viewBox="0 0 24 24"`, `aria-hidden="true"`, `focusable="false"`, use `accentColor` for fill/stroke, and do not embed numeric text in the SVG.
- Replace the switch's hardcoded old passive descriptions with `CharacterPassiveDefinition` metadata. The selected showcase shows icon, passive name, and exact `effectLabel` together. For `unassigned`, show “능력 준비 중” without a fabricated icon/effect.
- Keep each card's selection/unavailable accessibility names, character animation, confirmation, and responsive layout unchanged.

### I02. HUD badge and activation feedback

- Related Files:
  - `src/app/components/RunnerHud.tsx` :: passive labels, details, badge — modify.
  - `src/app/screens/RunScreen.tsx` :: `RecentBonus`, `handleEvent`, timer cleanup — modify.
  - `src/game/runner/runnerEvents.ts` :: `passive-triggered` event from P02-T01 — read-only.
  - `src/app/components/RunnerHud.test.tsx` :: badge/charges/cue — modify.
  - `src/app/screens/RunScreen.test.tsx` :: activation event behavior — modify.
  - `src/styles/global.css` :: HUD ability cue styles — modify.

#### Details

- Derive label, icon key, and accent from `getCharacterPassive(character.id)`; remove obsolete `PASSIVE_LABELS` entries.
- In the running HUD, display an accessible compact badge with icon and passive name. For Hiyori, show `passiveChargesRemaining` as two/one/zero shield pips with text alternative `남은 방어 N회`.
- Extend `RecentBonus` as a discriminated state for passive trigger; the cue text must identify the passive and trigger outcome. Hiyori examples: `유령의 수호 · 장애물 방어` / `유령의 수호 · 낭떠러지 방어 · 남은 1회`.
- Show the cue for 1,200ms, clear it on pause/orientation change/unmount using the existing timeout cleanup pattern, and do not interrupt game animation or controls.
- If the character is unassigned, do not render a fake icon or active cue.

## Acceptance Criteria

- [ ] Selector shows the three exact names/icons/effects and marks unassigned characters without placeholder mechanics.
- [ ] HUD shows the selected passive, Hiyori's remaining charges, and a readable short cue on each defense activation.
- [ ] Cues clear on timeout, pause, orientation changes, and unmount without stale updates.
- [ ] Keyboard/touch actions, countdown, pause, and game simulation remain unchanged.

## Validation

- `npm run test -- src/app/screens/CharacterSelect.test.tsx src/app/components/RunnerHud.test.tsx src/app/screens/RunScreen.test.tsx` — assigned/unassigned presentation, defense count, and cue lifecycle assertions pass.
- `npm run typecheck` — passive metadata and React SVG prop types compile.
- `npm run lint` — accessibility and hook rules pass.

## Commit Message

```text
feat(ui): surface character passive identities in play

Plan: 2026-10-27-runner-course-gates-pits-ui-polish
Phase: P03-screen-polish
Task: T01-ability-visibility

- Add themed inline passive icons and exact selector descriptions
- Show Hiyori defense charges and passive trigger feedback in the HUD
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (15 targeted tests, typecheck, lint)
- commit: pending
