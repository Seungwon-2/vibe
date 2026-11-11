# Task: T01 Personal History and Public Ranking UI

## Status: done

## Goal

Finish the UI for two different data scopes: a signed-in player can browse their own paginated run history, while the shared ranking screen displays only the public best-run projection returned by the API. Do not expose another player's run details or add email/IDs to ranking rows.

## Decision Summary

- Reuse the existing `RunGateway` contract and authenticated/local gateway implementations; do not add client-side authorization assumptions in place of server authorization.
- Public ranking criteria are endless-run distance descending, then coins descending. History is private and keyed by the identity enforced by the API.
- Keep browser-local records separate; do not migrate them to cloud storage.

## Implementation

### I01. Personal history screen and navigation

- Related Files:
  - `src/services/RunGateway.ts` :: `PersonalRunHistoryRecord`, `PersonalRunHistoryPage`, `RunGateway.getPersonalHistory`; read-only contract.
  - `src/services/AuthenticatedRunGateway.ts` :: `getPersonalHistory`; call existing authenticated endpoint and preserve cursor/limit behavior; modify only if contract mismatch is found.
  - `src/services/LocalRunGateway.ts` :: `getPersonalHistory`; preserve local-development fallback behavior; modify only if contract mismatch is found.
  - `src/app/screens/PersonalHistoryScreen.tsx` :: `PersonalHistoryScreen`; new owner history UI.
  - `src/app/screens/PersonalHistoryScreen.test.tsx` :: rendering/pagination tests; new.
  - `src/App.tsx` :: screen state and route callbacks; add history navigation and bind it to the active gateway.
  - `src/app/screens/MainMenu.tsx` :: `MainMenuProps`, account/navigation actions; expose the private history action when signed in.
  - `src/app/screens/PersonalHistoryScreen.css` :: history screen responsive styles, scoped to the screen.

#### Details

- **Signatures & Types**:
  - Consume existing `PersonalRunHistoryRecord` fields exactly: `id: string`, `characterId: CharacterId`, `mode: RunnerMode`, `storyStageId: StoryStageId | null`, `distanceMeters: number`, `coins: number`, `durationMs: number`, `finishedAtIso: string`, `finishReason: RunnerFinishReason`, `hitsTaken: number`, `passedGateCount: number`, `completedStage: boolean`.
  - Consume `PersonalRunHistoryPage = { items: readonly PersonalRunHistoryRecord[]; nextCursor: string | null }`.
  - Add screen props `rows`, `loading`, `error`, `hasMore`, `onLoadMore`, and `onBack`, using readonly arrays and typed callbacks.
  - Request pages with a fixed UI page size of 20 and pass `nextCursor` unchanged to `getPersonalHistory({ limit: 20, cursor })`.

- **Data & Schema Fields**:
  - No storage schema changes. Render only the fields returned in `PersonalRunHistoryRecord`.
  - Format `mode` as Endless/Story; for Story show stage name from the stage catalog. Format finish reason through exhaustive mapping with a safe fallback label; do not display raw IDs.
  - Do not display `playerId`, token claims, username/email, database IDs, or continuation cursor.

- **Execution Flow / Logic**:
  1. Route selection: add a `personal-history` screen state in `App.tsx`. Opening it requires cloud `signed-in` state in cloud mode; local mode may show the local browser history.
  2. Load initial page with `{ limit: 20, cursor: null }`; set loading state and clear prior error. On success replace current rows and save `nextCursor` in component/route state.
  3. On Load More, ignore duplicate requests while loading or when cursor is null. Append returned rows, update cursor, and surface a retryable error without discarding rows on failure.
  4. The API remains the authorization boundary: it derives `playerId` from validated token and ignores any client-supplied player identifier. UI must not accept a player ID input.
  5. Empty state explains that the signed-in player has no saved runs yet. Include accessible status/error regions and a clear back action.
  6. Keep public `RankingScreen` bound only to `getRanking()` rows, with display name, character, distance, coins, and date. Replace any lingering “local / this browser” title in cloud mode with “User Ranking”; local mode may clearly say “Local Records”.

### I02. Tests and visual states

- Related Files:
  - `src/app/screens/PersonalHistoryScreen.test.tsx` :: `PersonalHistoryScreen`; new.
  - `src/app/screens/RankingScreen.test.tsx` :: existing ranking assertions; modify.
  - `src/App.test.tsx` :: navigation/access gating if present; otherwise add focused route test in the existing app test location.

#### Details

- Cover loading, empty, populated, error, load-more append, cursor exhaustion, and duplicate-click prevention.
- Assert history rows show mode/stage, distance, coins, date, hits, and completion status without rendering identity IDs.
- Assert cloud ranking presentation does not claim the data is local and does not render email or IDs.
- Assert local gateway remains usable without Entra configuration.

## Acceptance Criteria

- [x] Signed-in user can navigate to their own history and load subsequent pages.
- [x] Cloud history requests contain no client-selected owner ID; API owner scoping remains authoritative.
- [x] Public ranking continues to show one best run per user and hides private run metadata.
- [x] Local development history and ranking continue to work.
- [x] Loading, empty, errors, and pagination states are accessible and tested.

## Validation

- `npm run test -- src/app/screens/PersonalHistoryScreen.test.tsx src/app/screens/RankingScreen.test.tsx src/services/AuthenticatedRunGateway.test.ts src/services/LocalRunGateway.test.ts` — all targeted tests pass.
- `npm run typecheck` — no TypeScript errors.
- `npm run lint` — no lint errors.
- `npm run build` — production client build succeeds.

## Commit Message

```text
feat(history): add private run history and clarify public ranking

Plan: 2026-11-11-azure-swa-github-deployment
Phase: P01-app-readiness
Task: T01-history-and-ranking-ui

- Add paginated owner history screen using existing gateway contract
- Clarify cloud public ranking and preserve local mode
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending
