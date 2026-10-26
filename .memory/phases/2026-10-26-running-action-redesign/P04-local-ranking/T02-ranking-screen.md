# Task: T02 Ranking Screen

## Status: pending

## Goal

Submit each finished run once and present the unified local ranking with character identity, distance, and coins.

## Decision Summary

- Distance is the primary ranking value; coins break ties. The same ranking includes Rin, Toa, Yuni, and Lize.
- The result screen shows personal best; a separate ranking screen shows up to 10 local runs.

## Implementation

### I01. Connect result submission and ranking query

- Related Files:
  - `src/App.tsx` :: submit-once, load best/ranking, gateway error state; modify.
  - `src/app/screens/RunResult.tsx` :: show submitted rank and personal best; modify.
  - `src/services/RunGateway.ts` :: gateway contract; read-only.
  - `src/App.test.tsx` :: submit and dedup lifecycle tests; modify.

#### Details

- On the first `run-finished` event, call `RunGateway.submitRun(result)` exactly once. Guard by run ID/state transition so React StrictMode or repeated Phaser callbacks cannot submit duplicates.
- Load `getBest()` when showing menu/result and `getRanking()` when opening ranking screen. Show a local-only label to distinguish it from a future company-wide ranking.
- If storage read/write fails, show a non-blocking “기록을 저장하지 못했습니다” message; preserve final distance and allow retry/selection.

### I02. Render accessible ranking rows

- Related Files:
  - `src/app/screens/RankingScreen.tsx` :: `RankingScreenProps`, ordered list; new.
  - `src/app/screens/RankingScreen.test.tsx` :: ordering, empty, error, and character labels; new.
  - `src/styles/global.css` :: ranking rows and mobile layout; modify.

#### Details

- Props: `{ rows: readonly RankedRunRecord[]; loading: boolean; error: string | null; onBack(): void }`.
- Render rank, character display name/accent, distance as integer meters, coins, and run date. Use semantic `<ol>` and meaningful labels; do not expose hex values.
- Empty state explains that completing a run creates the first local record. Include back action to main menu.
- Keep character color as a small border/icon cue only; all rows use the same sorting logic.

## Acceptance Criteria

- [ ] A finished run is submitted once, including when callbacks repeat.
- [ ] Result screen shows current distance, coins, and best distance.
- [ ] Ranking screen contains all characters in one top-ten list, ordered by distance then coins.
- [ ] Empty and storage-error states are understandable and do not block retry.

## Validation

- `npm test -- src/App.test.tsx src/app/screens/RankingScreen.test.tsx src/app/screens/RunResult.test.tsx` — validates submission and display.
- `npm run typecheck` — validates ranking props.

## Commit Message

```text
feat(ranking): add unified local distance leaderboard

Plan: 2026-10-26-running-action-redesign
Phase: P04-local-ranking
Task: T02-ranking-screen

- Submit completed runs once and show personal best
- Render a unified distance-first ranking across characters
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
