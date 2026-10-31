# Task: T02 Story Results and Achievements

## Status: done

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

- [x] Story clear and failure expose the correct next actions and rewards.
- [x] Achievement progress and first-earned rewards persist, with immediate notification.
- [x] Story and near-miss score never alter Endless leaderboard records.

## Validation

- `npm run typecheck` — passed.
- `npm run build` — passed. Vite reports the existing large-chunk advisory.
- Vitest was not run per session instruction not to run tests unless requested.

## Commit Message

    feat(progression): add story results and achievements

    Plan: 2026-10-30-runner-modes-progression
    Phase: P03-progression-and-rewards
    Task: T02-story-results-and-achievements

    - Add Story clear/failure result paths and challenge status
    - Persist achievement progress and one-time notifications

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: `feat(progression): add story results and achievements`
