# Task: T01 Wallet and Story Progression

## Status: done

## Goal

On every finished run, deposit collected coins exactly once, and on Story outcomes update stage clears, sequential unlocks, character unlocks, and one-time optional challenge rewards.

## Decision Summary

- Failed attempts still deposit collected coins; first-clear and challenge rewards are one-time only.
- Character unlock order is Hiyori, Mary, Toa, Rang after Story stages 1–4.

## Implementation

### I01. Add progression and settlement service

- Related Files:
  - src/services/PlayerProgression.ts :: settleRun, applyStoryOutcome, evaluateStageChallenges; new
  - src/services/LocalPlayerProfileStore.ts :: idempotent run/reward methods; modify
  - src/game/runner/storyConfig.ts :: targets/unlock data; read-only
  - src/App.tsx :: finish handling and profile state refresh; modify
  - src/services/PlayerProgression.test.ts :: exact-once and unlock scenarios; new

#### Details

- Define settleRun(profileStore, runId, result): SettlementResult; it deposits result.coins once for both Endless and Story, regardless of finish reason, pit, or life failure.
- Story success: add stage to cleared set; unlock next stage, and unlock that stage's configured character. Stage 1 Hiyori, 2 Mary, 3 Toa, 4 Rang. Replays never regrant these.
- Stage challenge keys are stageId:no-hit and stageId:coin-target. Award each challenge's configured reward only the first time achieved; challenge reward catalog resolves to cosmetic IDs. Coin target compares result.coins against STORY_STAGES[stageId].coinTarget.
- No-hit challenge requires completedStage && hitsTaken===0. Story failure cannot satisfy challenges.
- Run wallet deposit occurs even when Story fails; do not add the same coins again when showing a result or retrying.
- Return structured deltas for UI: depositedCoins, newlyUnlockedStageId, newlyUnlockedCharacterId, newlyClaimedCosmeticIds.

## Acceptance Criteria

- [x] Any finished run deposits run coins exactly once.
- [x] Story clear unlocks only the next stage and corresponding character.
- [x] Challenge and first-clear rewards are one-time and not farmable by replay.

## Validation

- `npm run typecheck` — passed.
- `npm run build` — passed. Vite reports the existing large-chunk advisory.
- Vitest was not run per session instruction not to run tests unless requested.

## Commit Message

    feat(progression): add wallet and story unlock rewards

    Plan: 2026-10-30-runner-modes-progression
    Phase: P03-progression-and-rewards
    Task: T01-wallet-and-story-progression

    - Settle run coins exactly once on success or failure
    - Unlock stages, characters, and challenge cosmetics

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: `feat(progression): add wallet and story unlock rewards`
