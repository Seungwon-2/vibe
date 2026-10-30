# Task: T02 Story Results and Achievements

## Status: pending

## Goal

Show mode-specific clear/failure results and implement one-time achievements with local progress, rewards, entry points, and unlock notifications.

## Decision Summary

- Story result shows coins and challenge status; clear offers next stage/stage select; failure offers retry/stage select.
- Endless remains the only leaderboard mode. Near-miss bonus is result-only and does not affect ranking.

## Implementation

### I01. Add Story result and achievement tracker/UI

- Related Files:
  - src/app/screens/RunResult.tsx :: mode-aware result display/actions; modify
  - src/app/screens/StoryResult.tsx :: clear/failure view; new
  - src/services/AchievementCatalog.ts :: stable achievement IDs/thresholds/rewards; new
  - src/services/AchievementService.ts :: recordRunAndUnlock; new
  - src/app/screens/AchievementsScreen.tsx :: list/progress/reward display; new
  - src/App.tsx :: achievement entry, event notification, mode-aware ranking submission; modify
  - src/app/screens/MainMenu.tsx :: achievements entry; modify
  - src/app/screens/StageSelect.tsx :: achievements entry; modify
  - new or existing screen/service tests; add/modify

#### Details

- Catalog includes distance milestones, cumulative wallet coins, gate count, no-hit clear, and character-specific goals. IDs are stable kebab-case; thresholds/reward amounts/cosmetic IDs are centralized and tunable.
- On each result, update achievement progress from RunnerResult and profile once; newly unlocked reward keys are idempotent and trigger a toast/dialog.
- Endless nearMissScore appears in result but is excluded from RunRecord and ranking comparison. Only mode=endless calls RunGateway.submitRun.
- Story result: success displays stage name, deposited coins, challenge outcomes, unlocks, buttons Next Stage and Stage Select. Failure displays lives/coins and Retry Stage / Stage Select. Story never submits ranking.
- Achievements screen is reachable from Title and Stage Select and lists locked/unlocked state and progress.
- Keep personal best/ranking state unaffected by Story results.

## Acceptance Criteria

- [ ] Story clear and failure expose the correct next actions and rewards.
- [ ] Achievement progress and first-earned rewards persist, with immediate notification.
- [ ] Story and near-miss score never alter Endless leaderboard records.

## Validation

- npx vitest run src/app/screens/RunResult.test.tsx src/App.test.tsx src/services/AchievementService.test.ts
- npm run typecheck

## Commit Message

    feat(progression): add story results and achievements

    Plan: 2026-10-30-runner-modes-progression
    Phase: P03-progression-and-rewards
    Task: T02-story-results-and-achievements

    - Add Story clear/failure result paths and challenge status
    - Persist achievement progress and one-time notifications

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
