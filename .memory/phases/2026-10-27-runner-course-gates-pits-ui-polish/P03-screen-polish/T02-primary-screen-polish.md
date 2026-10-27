# Task: T02 Primary Screen Polish

## Status: done

## Goal

Refine the visual hierarchy and detail of the character selector, runner HUD, run result, and local ranking screens while keeping their existing functions and responsive behavior.

## Decision Summary

- Retain the current pastel-fairytale palette, character accent colors, screen flow, control layout, record semantics, and interaction behavior.
- Add detail through clearer panels, icon alignment, card/status states, spacing, and result feedback; do not introduce a new screen or art asset dependency.
- A pit-fall result identifies the pit as its finish cause while retaining normal distance/coin record behavior.

## Implementation

### I01. Selector and runner HUD visual details

- Related Files:
  - `src/styles/global.css` :: `.selector-*`, `.runner-hud*`, responsive selector/HUD rules — modify.
  - `src/app/screens/CharacterSelect.tsx` :: existing showcase/cards/footer — modify only if semantic wrappers are needed.
  - `src/app/components/RunnerHud.tsx` :: existing information hierarchy — modify only if semantic wrappers are needed.
  - `src/app/screens/CharacterSelect.test.tsx` and `src/app/components/RunnerHud.test.tsx` — modify only if DOM semantics change.

#### Details

- Keep existing card grid, portrait/SD arrangement, selected border, names, start button, HUD timer/distance/coin/pause positions, and touch controls.
- Use existing `--ui-*` design tokens for layered cloud-white/sky-blue panels, lavender secondary emphasis, and per-character accent colors; do not add remote assets or a second palette.
- Refine selector panel hierarchy with character-accent selection state, a separated passive block, subtle card elevation, and consistent keyboard focus, hover, selected, and unavailable states.
- Refine HUD with distinct visual grouping for timer, distance, coins, pause, biome/gate description, passive badge, and transient feedback. Preserve warning contrast for the final 10 seconds.
- Verify small landscape and portrait selector layouts do not crop character sprites, text, ability effects, or the confirmation button. Keep the runner playfield's established 16:9 sizing and input hit areas.

### I02. Result and ranking visual details

- Related Files:
  - `src/styles/global.css` :: `.result-*`, `.rankings-*`, `.ranking-record__*`, responsive rules — modify.
  - `src/app/screens/RunResult.tsx` :: outcome title/details — modify.
  - `src/app/screens/RankingScreen.tsx` :: row semantics/layout — modify only if needed.
  - `src/app/screens/RunResult.test.tsx` and `src/app/screens/RankingScreen.test.tsx` — modify.

#### Details

- Preserve the portrait plus SD character outcome stage, distance, best record, coin total, submitted rank, retry, character-selection, and local-ranking actions.
- When `result.finishReason === 'pit'`, show a concise pit game-over label in the result details even if the distance is a personal best; do not hide the new-best distance or change record eligibility.
- Keep ranking order and record fields unchanged. Improve row rank prominence, character accent strip, distance/coin hierarchy, and date readability using the existing pastel tokens.
- Preserve loading, empty, error, and saved-result messages with accessible live/status semantics.
- Give result statistics compact labeled surfaces and ensure the pit cause is visually distinct from the best-record badge. In rankings, use clear rank chips (with a restrained top-three treatment), keep each character accent stripe, and prevent metadata wrapping from causing horizontal overflow.
- Do not retheme or rearrange MainMenu or PauseOverlay; they are outside this approved screen scope.

## Acceptance Criteria

- [x] Four named screens have a consistent, polished pastel visual hierarchy without function/flow changes.
- [x] Desktop, compact landscape, and portrait layouts retain complete text, character art, buttons, and usable controls.
- [x] Pit-fall result is clearly identified while record submission and best-distance behavior remain intact.
- [x] Ranking sort, loading/error/empty states, and all result actions remain unchanged.

## Validation

- `npm run test -- src/app/screens/CharacterSelect.test.tsx src/app/components/RunnerHud.test.tsx src/app/screens/RunResult.test.tsx src/app/screens/RankingScreen.test.tsx` — 18 tests pass.
- `npm run typecheck`, `npm run lint`, `npm run build` — pass; the existing large JavaScript chunk warning remains.
- Manual Edge review: selector/result at 1366×768, 915×412 landscape, and 390×844 portrait; HUD at 915×412; ranking at all three sizes. No horizontal overflow or clipped text, art, or actions; compact landscape can scroll vertically to the complete result/ranking content.

## Commit Message

```text
style(ui): polish selector runner result and ranking screens

Plan: 2026-10-27-runner-course-gates-pits-ui-polish
Phase: P03-screen-polish
Task: T02-primary-screen-polish

- Refine pastel panel, card, HUD, and ranking details
- Identify pit falls in results without changing ranking rules
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: included in the P03 completion commit
