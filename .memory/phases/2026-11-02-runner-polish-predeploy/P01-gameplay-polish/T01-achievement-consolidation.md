# Task: T01 Achievement Consolidation

## Status: done

## Goal
Remove achievement cards that repeat the same character-distance goal and remove the achievement that duplicates the Story no-hit challenge. Preserve distinct distance and wallet-coin tiers, then add one aggregate roster milestone and one all-Story-courses milestone with accurate progress and one-time rewards.

## Decision Summary
- Five separate “run 1,000m as this character” cards become one goal tracking how many of the five registered characters have individually reached 1,000m.
- The Story no-hit challenge remains per stage; the catalog uses a distinct “clear all four Story courses” aggregate goal instead.

## Implementation

### I01. Catalog and progress calculation
- Related Files:
  - `src/services/AchievementCatalog.ts` :: `AchievementMetric`, `ACHIEVEMENTS` — modify.
  - `src/services/AchievementService.ts` :: `recordRunAndUnlock` — modify.
  - `src/services/PlayerProfile.ts` :: `PlayerProfile.achievementProgress` — read-only unless type changes are necessary; progress remains a numeric keyed record.
  - `src/game/characters/characterCatalog.ts` :: `CHARACTERS` — read-only; use its five registered ids as the roster source.
  - `src/game/runner/storyConfig.ts` :: `STORY_STAGES` — read-only; use its four ids as the Story source.

#### Details
- Extend `AchievementMetric` with `'all-runners-distance' | 'story-courses-cleared'`.
- Replace five `runner-<slug>-1000` definitions with `all-runners-1000`, threshold `5`, metric `all-runners-distance`, a unique name/description, and one reward of 50 coins.
- Replace `story-no-hit` with `story-grand-tour`, threshold `4`, metric `story-courses-cleared`, a unique name/description, and one reward of 100 coins. Do not alter Story stage challenge cosmetic rewards.
- In `recordRunAndUnlock`, continue writing `character-distance:<characterId>` as the maximum distance reached for that character. Derive `all-runners-distance` as the count of registered `CHARACTERS` whose keyed distance is at least 1,000m; write it after the current run's character distance is updated.
- On a successfully completed Story run (`mode === 'story'`, `completedStage === true`, and a valid `storyStageId`), union the stage id with `profile.clearedStageIds` and write `story-courses-cleared` as the unique cleared stage count. Replays do not increment it twice. Failed runs do not increment it.
- Keep existing `claimReward` idempotency and stable achievement ids for retained catalog entries. Old unlocked ids for removed definitions remain harmless historical profile values; do not erase profile data.
- Update achievement display progress to use the new metric keys and show `n / threshold` as before.

### I02. Tests
- Related Files:
  - `src/services/AchievementService.test.ts` :: `recordRunAndUnlock` — new.
  - `src/app/screens/AchievementsScreen.test.tsx` :: aggregate progress display — new only if needed to verify rendering.
- Cover: six aggregate goals are replaced by exactly two; character progress requires all five distinct runners; Story clear counts unique stage ids only; failure and replay do not advance the Story metric; rewards are issued once; retained distance/coin/gate achievements still unlock.

## Acceptance Criteria
- [ ] No two visible achievement cards describe the same completion condition.
- [ ] Roster progress reaches 5 only after every registered character has a personal 1,000m record.
- [ ] Story completion progress reaches 4 only after clearing all unique Story stages.
- [ ] Existing wallet data and already claimed rewards are preserved.

## Validation
- `npm test -- src/services/AchievementService.test.ts` — aggregate progress, idempotency, and retained reward behavior.
- `npm run typecheck` — no TypeScript errors.

## Commit Message
```text
fix(achievements): consolidate repeated goals

Plan: 2026-11-02-runner-polish-predeploy
Phase: P01-gameplay-polish
Task: T01-achievement-consolidation

- Replace repeated character goals with one roster milestone
- Track unique Story course clears without duplicating stage challenges
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`npm test -- src/services/AchievementService.test.ts`, `npm run typecheck`)
- commit: a070347
