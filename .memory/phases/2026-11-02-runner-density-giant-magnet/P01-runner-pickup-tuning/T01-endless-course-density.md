# Task: T01 Endless Course Density

## Status: done

## Goal
Increase hazard and safe-route coin frequency in Endless while preserving Story schedules and keeping valid recovery windows after dense waves.

## Decision Summary
- Endless dense hazard spacing starts at 330m with a 605m recovery gap; set these to 280m and 515m.
- The Endless safe coin target cadence is currently shared at 90m; set the Endless target to 75m and retain Story's 90m cadence.
- Keep the 0–1,000m tutorial, 1,000–2,000m practice section, Story-authored hazards, gates, pits, progressive late-course reductions, and their existing spacing floors unchanged.

## Implementation

### I01. Separate Endless and Story pickup cadence and tighten Endless waves
- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG.densePatternSpacingMeters`, `denseRecoveryGapMeters`, and safe-pickup spacing fields — modify.
  - `src/game/runner/hazardPatterns.ts` :: `getDensePatternSpacing`, `getDenseRecoveryGap`, `getDenseWaveSchedule` — use the new Endless bases without changing the tier reductions/floors.
  - `src/game/runner/CollectibleSpawner.ts` :: `SAFE_PICKUP_SPACING_METERS`, `getTimePickupSlotIndexes`, `generatePickupSchedule` — select cadence by `storyStageId`.

#### Details
- **Signatures & Types**:
  ```ts
  RUNNER_CONFIG.densePatternSpacingMeters: 280
  RUNNER_CONFIG.denseRecoveryGapMeters: 515
  RUNNER_CONFIG.endlessSafePickupSpacingMeters: 75
  RUNNER_CONFIG.safePickupSpacingMeters: 90 // Story cadence
  ```
  Change `getTimePickupSlotIndexes(maxDistanceMeters, spacingMeters)` to receive the active mode's safe-pickup cadence.
- **Data & Schema Fields**:
  - Preserve `endlessDenseSpacingDecreasePerTierMeters: 22`, `endlessDenseSpacingFloorMeters: 253`, `endlessDenseRecoveryDecreasePerTierMeters: 66`, and `endlessDenseRecoveryFloorMeters: 385`.
  - Preserve safe gap bounds and relocation behavior; only target cadence differs by mode.
- **Execution Flow / Logic**:
  1. `generatePickupSchedule(maxDistanceMeters, storyStageId)` selects 90m when a Story ID is provided and 75m otherwise.
  2. Use that local spacing value consistently for safe-slot count, target distance, and time-item slot-index calculation.
  3. Keep all existing safety tests for hazard art/body extents, Mary pickup bounds, gates, pits, row guides, and giant pickups.
  4. Derive wave positions from the updated config. Preserve the current difficulty tier cadence, progressive spacing and recovery reductions, and floors.
  5. Do not alter Story hazard or pit tables, stage lengths, gate distances, physics, or collision boxes.
- **Error & Exception Handling**: Preserve deterministic schedule ordering and unique pickup IDs; when an obstacle/landmark blocks a target, continue to relocate or omit the safe pickup using existing bounded search behavior.

### I02. Verify Endless density and Story isolation
- Related Files:
  - `src/game/runner/hazardPatterns.test.ts` :: dense-wave base and progression expectations — update.
  - `src/game/runner/CollectibleSpawner.test.ts` :: Endless and Story safe cadence/time-slot expectations — update.
  - `src/game/runner/pitChallengeSchedule.test.ts` :: pit traversal assertions — read-only regression test.
- **Details**:
  - Assert first Endless dense wave positions are 2,000m, 2,280m, 2,560m, followed by a 515m recovery gap.
  - Assert subsequent waves continue to apply the existing tier reductions and floors.
  - Assert Endless safe-route targets use 75m cadence and Story targets use 90m; time-item replacement indexes remain correct for each cadence.
  - Assert all schedules remain deterministic, in-bounds, and clear of hazards, gates, and pits.

## Acceptance Criteria
- [x] Endless dense section uses 280m spacing and a 515m recovery gap before progressive late-course tightening.
- [x] Endless safe pickup targets use 75m cadence; Story remains at 90m.
- [x] Story authored hazard/pit layouts, tutorial, practice, gates, and gameplay physics remain unchanged.
- [x] Existing pickup clearance and double-jump pit requirements pass.

## Validation
- `npm test -- src/game/runner/hazardPatterns.test.ts src/game/runner/CollectibleSpawner.test.ts src/game/runner/pitChallengeSchedule.test.ts`
- `npm run typecheck`

## Commit Message
```text
feat(game): increase endless pickup density

Plan: 2026-11-02-runner-density-giant-magnet
Phase: P01-runner-pickup-tuning
Task: T01-endless-course-density

- Shorten dense obstacle and recovery intervals in Endless
- Increase Endless safe coin cadence while preserving Story courses
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
