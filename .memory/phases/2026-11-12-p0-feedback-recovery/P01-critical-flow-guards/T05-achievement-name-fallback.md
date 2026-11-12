# Task: T05 Achievement Name Fallback

## Status: done

## Goal
Ensure achievement-unlock feedback always displays a localized achievement name or safe fallback instead of exposing internal IDs.

## Decision Summary
- Known achievements use `AchievementDefinition.name` from `ACHIEVEMENTS`.
- Unknown IDs render `알 수 없는 업적`; raw IDs are not user-visible.

## Implementation

### I01. Centralize safe achievement-name lookup
- Related Files:
  - `src/services/AchievementCatalog.ts` :: `AchievementDefinition`, `ACHIEVEMENTS`; modify.
  - `src/app/screens/RunResult.tsx` :: `newlyUnlockedAchievementIds` presentation; modify.
  - `src/app/screens/StoryResult.tsx` :: `unlockedNames` presentation; modify.

#### Details
- **Signature**:
  ```ts
  export function getAchievementDisplayName(id: string): string;
  ```
- **Logic**: Find the catalog entry by exact ID and return its `name`; otherwise return `알 수 없는 업적`. Never return `id` as fallback.
- Replace inline `ACHIEVEMENTS.find(...)` logic in both result screens with the shared resolver. Keep reward IDs and achievement persistence unchanged.
- Deduplicate repeated IDs in the same newly-unlocked list while preserving input order.

### I02. Verify known and unknown IDs in user-facing results
- Related Files:
  - `src/app/screens/RunResult.test.tsx` :: achievement settlement messages; modify.
  - `src/app/screens/StoryResult.test.tsx` :: story achievement messages; new.
  - `src/services/AchievementCatalog.test.ts` :: resolver behavior; new if no existing catalog test file.

#### Details
- Test known ID renders its catalog name.
- Test unknown ID renders `알 수 없는 업적` and does not render the ID string.
- Test StoryResult and RunResult share behavior; repeated IDs do not duplicate the visible message.

## Acceptance Criteria
- [x] Known achievements continue to display localized catalog names.
- [x] Unknown/corrupt achievement IDs never appear verbatim in result UI.
- [x] Run and story result screens use one shared resolver.

## Validation
- `npm test -- src/app/screens/RunResult.test.tsx src/app/screens/StoryResult.test.tsx src/services/AchievementCatalog.test.ts`
- `npm run typecheck`
- `npm run lint`

## Commit Message
```text
fix(achievements): hide internal ids in unlock feedback

Plan: 2026-11-12-p0-feedback-recovery
Phase: P01-critical-flow-guards
Task: T05-achievement-name-fallback

- Resolve achievement labels through one safe catalog helper
- Use a localized fallback for unknown identifiers
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: see Git history
