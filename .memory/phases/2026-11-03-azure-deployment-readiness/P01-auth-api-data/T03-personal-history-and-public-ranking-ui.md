# Task: T03 Personal History and Public Ranking UI

## Status: pending

## Goal
Give signed-in users two clearly separate record destinations: private paginated history containing only their own runs, and a public user leaderboard showing each account's single best endless run. Preserve a usable local-only experience and identify local records as local.

## Decision Summary
- Apply [Private Run History and Public Best Ranking](../../../decisions/2026-11-06-private-run-history-public-best-ranking.md).
- Consume the shared DTOs and gateway methods introduced in P01-T01; consume the authenticated Functions endpoints implemented in P01-T02.
- Public names come from the API's validated Entra `name` claim; absent claim is rendered as `Runner`. Do not request Graph data, display email, or send account identity from the UI.
- Every authenticated run submission is owner-private history. The public leaderboard includes one account-level best endless run; story runs stay private.
- Local browser data is not uploaded; without cloud auth configuration, the existing browser-local gateway powers both local records destinations.

## Implementation

### I01. Separate personal-history and public-leaderboard navigation/screens
- Related Files:
  - `src/App.tsx` :: `AppScreen`, run gateway selection, best/history/ranking request state, `openPersonalHistory`, `openRankings`; modify
  - `src/app/screens/MainMenu.tsx` :: record actions and callback props; modify
  - `src/app/screens/RunResult.tsx` :: record navigation label and receipt feedback; modify
  - `src/app/screens/RankingScreen.tsx` :: public `displayName` rows and cloud/local label; modify
  - `src/app/screens/PersonalHistoryScreen.tsx` :: owner-only history list, load-more, empty/error/loading state; new
  - `src/app/screens/PersonalHistoryScreen.test.tsx` :: history rendering and pagination; new
  - `src/App.test.tsx` :: navigation and separation tests; modify
  - `src/app/screens/RankingScreen.test.tsx` :: public display-name row contract; modify
  - `src/styles/global.css` :: personal-history list layout and mobile breakpoints; modify
- Add distinct `AppScreen` values `'personal-history'` and `'rankings'`; do not combine private history and public leaderboard records into one interchangeable list.
- In signed-in cloud mode, menu actions are labelled `내 기록` and `유저 랭킹`. `내 기록` opens private history and states it is visible only to the signed-in account. `유저 랭킹` opens the public leaderboard and explains that each user's best endless run is listed. The history screen renders endless and story records with mode/stage, distance, coins, date and finish outcome, and a `더 보기` action only when `nextCursor` exists.
- In local mode, retain existing local ranking semantics and label them `이 브라우저 기록`/`로컬 랭킹`; the personal-history screen reads only local gateway records. Do not upload, merge, or present old local records as cloud-submitted records.
- Public leaderboard rows show rank, Entra display name (or API fallback `Runner`), character, distance, coins and finish date. Never render run ID, email, tenant/object IDs, `playerId`, or private run details. Use rank as a stable-enough rendered row key for each fetched page; do not add a public identity field to solve UI keying.
- `RunSubmissionReceipt.personalBest` updates result-screen rank feedback using the player's current account-level best, not the just-finished run when that run is not their best. Story results have no public rank.
- Preserve loading/error/empty states and back navigation. If the cloud API fails, show a retryable cloud error and do not quietly show local rows in the public ranking screen.
- Tests verify signed-in navigation to private vs public destinations; no private data in `RankingScreen`; story rows appear only in personal history; cursor/load-more behavior; empty/error states; local mode remains browser-local; submission of a non-best run does not replace the account's displayed best rank; email/account identifiers are not rendered.

## Acceptance Criteria
- [ ] Authenticated users can page through their own endless and story history; UI provides no route to request another player's history.
- [ ] Public leaderboard shows Entra display name or `Runner` fallback and at most one best endless row per player.
- [ ] Public leaderboard never shows run ID, email, tenant/object IDs, or private run details.
- [ ] Public/private destinations have separate labels and data-loading paths.
- [ ] Local mode keeps records local, labels them accordingly, and does not fabricate cloud identity.
- [ ] Cloud errors do not fall back to misleading local ranking data.
- [ ] UI tests cover privacy, pagination, tie/result semantics, and local fallback.

## Validation
- `npm test -- src/app/screens/RankingScreen.test.tsx src/app/screens/PersonalHistoryScreen.test.tsx src/App.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Commit Message
```text
feat(ui): separate private run history from public best rankings

Plan: 2026-11-03-azure-deployment-readiness
Phase: P01-auth-api-data
Task: T03-personal-history-and-public-ranking-ui

- Add authenticated owner-only run history with pagination
- Show one public best run per account with Entra display name
- Keep browser-local records separate from cloud account data
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
