# Task: T04 Results and Progression Screens

## Status: done

## Goal
Improve the readability and responsive layout of endless/story results, local rankings, achievements, and the coin shop while preserving their data and actions.

## Decision Summary
- Preserve all result values, wallet/progression notices, achievement progress, shop purchase/equip state, and button callbacks.
- Keep the established pastel presentation and existing character/runner art.
- Avoid changing game rules, score order, coin values, unlock logic, or shop inventory.

## Implementation

### I01. Results and local rankings
- Related Files:
  - `src/app/screens/RunResult.tsx` :: `RunResult` — endless result panel, character showcase, stats, settlement notices, and actions; layout-only changes.
  - `src/app/screens/StoryResult.tsx` :: `StoryResult` — story result panel, challenge/reward rows, and next/retry actions; layout-only changes.
  - `src/app/screens/RankingScreen.tsx` :: `RankingScreen`, `formatRunDate` — ranking rows, loading/error/empty state, and back action; layout-only changes.
  - `src/styles/global.css` :: `.result-shell`, `.result-panel`, `.result-character`, `.result-details`, `.result-stats`, `.result-settlement`, `.story-result-rewards`, `.story-challenges`, `.result-actions`, `.rankings-card`, `.rankings-list`, `.ranking-record`, `.rankings-actions` — modify.
- **Layout constraints**:
  - Preserve distinct outcome title/cause, distance, stats, record status, coin settlement, unlock notices, and retry/navigation actions.
  - Keep character art within its existing portrait frame without enlarging it beyond the result panel.
  - Use consistent, compact data cards and action spacing; long names and reward text must wrap instead of overflow.
  - Keep ranking podium rows, distances, coin counts, and dates distinguishable at narrow widths; retain explicit loading/error/empty feedback.
- **Acceptance Criteria**:
  - Both result modes clearly distinguish primary distance, supporting stats, reward/unlock notices, and next actions.
  - Result character art remains fully visible and ranking data does not clip at desktop, landscape mobile, or narrow mobile sizes.

### I02. Achievements and shop
- Related Files:
  - `src/app/screens/AchievementsScreen.tsx` :: `AchievementsScreen` — wallet summary and achievement progress cards; layout-only changes.
  - `src/app/screens/ShopScreen.tsx` :: `ShopScreen`, `SHOP_ITEMS`, `SHOP_CATEGORIES` — coin balance, character selection, loadout, item previews, and purchase/equip actions; do not change catalog/filter logic.
  - `src/styles/global.css` :: `.achievement-panel`, `.achievement-wallet`, `.achievement-list`, `.achievement-card`, `.shop-panel`, `.shop-toolbar`, `.shop-loadout`, `.shop-category`, `.shop-items`, `.shop-item`, `.shop-item__preview`, `.shop-item__actions`, and mobile media queries — modify.
- **Layout constraints**:
  - Keep coin balance and achievement progress visible and easy to scan; use a single-column card layout only when the viewport requires it.
  - Keep shop item previews, name/description, price, ownership/equipped state, and action buttons together as one readable card.
  - Preserve internal scrolling for long lists where necessary, while avoiding unintended page-level horizontal scrolling.
  - Keep disabled, purchased, equipped, insufficient-coin, and status notice states visually distinct and legible.
- **Acceptance Criteria**:
  - Achievement progress and rewards remain readable without duplicate or hidden values.
  - Shop cards retain all purchase/equip/remove states with no clipped text or unreachable controls.
  - All existing callbacks and data conditions remain unchanged.

## Validation
- `npm test -- src/app/screens/RunResult.test.tsx src/app/screens/RankingScreen.test.tsx` — existing result and ranking behavior tests pass.
- `npm run lint` — no lint errors.
- `npm run typecheck` — no TypeScript errors.
- `npm run build` — production build completes.
- Manual visual review at 1440×900, 915×412, and 390×844; inspect long labels, empty/error/loading states, locked/progress cards, and shop actions.

## 결과 카드 후속 조정

- 두 결과 화면의 전신 원본에서 얼굴과 상반신을 중심으로 확대해 표시하고, 배경 그림을 반투명하게 처리한다. 포즈는 카드 하단 가운데에 두고, 결과별 모션과 재생 속도는 기존 동작을 사용한다.
- `src/styles/global.css`의 공통 카드 스타일에 세로 비율과 레이어 순서를 지정한다. 좁은 화면과 낮은 가로 화면의 카드 크기도 같은 비율로 조정한다.
- 로컬 Edge에서 데스크톱의 다섯 캐릭터와 모바일 세로·가로의 무한·스토리 결과를 확인했다. 카드 비율 `13 / 18`과 배지, 승리·실패 포즈가 카드 안에 들어간다.

## Commit Message
```text
fix(ui): polish results and progression screens

Plan: 2026-11-04-predeploy-ui-ux-polish
Phase: P01-screen-polish
Task: T04-results-and-progression-screens

- Clarify result and ranking information hierarchy
- Keep achievement and shop cards readable across breakpoints
```

## Progress
- [x] Implementation complete
- [x] Automated validation passed
- [ ] Manual visual review unavailable: the browser access host could not be reached in this environment.
- `npm test -- src/app/screens/RunResult.test.tsx src/app/screens/RankingScreen.test.tsx` — passed (2 files, 7 tests).
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed; Vite reports the existing large game chunk warning for the 1.28 MB `RunScreen` chunk.
- `commit: fix(ui): polish results and progression screens`
