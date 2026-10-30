# Task: T01 Domain Types

## Status: done

## Goal

Define the shared typed models and static metadata for the two modes, four Story stages, progression, wallet, achievements, cosmetics, and mode-aware run results. This task changes no runtime behavior.

## Decision Summary

- Story stage IDs reuse existing biome IDs and lengths are 2500, 3000, 3500, and 4000 meters.
- Rin alone starts unlocked; first clears unlock Hiyori, Mary, Toa, and Rang in that order.
- Components and gameplay depend on a profile-store interface, not browser storage details.

## Implementation

### I01. Add domain models and stage catalog

- Related Files:
  - src/game/runner/runnerTypes.ts :: RunnerMode, StoryStageId, StoryChallengeId, RunnerSnapshot, RunnerResult; modify
  - src/game/runner/storyConfig.ts :: STORY_STAGES, getStoryStage, getNextStoryStageId; new
  - src/services/PlayerProfile.ts :: PlayerProfile and PlayerProfileStore models; new
  - src/game/characters/characterTypes.ts :: CharacterId compatibility; read-only unless compiler requires a change

#### Details

- Define RunnerMode as endless | story; StoryStageId as RunnerBiomeId; StoryChallengeId as no-hit | coin-target.
- Define StoryStageDefinition fields: id, order (1|2|3|4), name, biomeId, lengthMeters, unlockCharacterId (CharacterId|null), coinTarget.
- Define PlayerProfile fields: version:1; walletCoins:number; unlockedCharacterIds:CharacterId[]; unlockedStageIds:StoryStageId[]; clearedStageIds:StoryStageId[]; completedChallengeKeys:string[]; achievementProgress:Record<string,number>; unlockedAchievementIds:string[]; unlockedCosmeticIds:string[]; equippedCosmeticIdsByCharacter:Record<string,string[]>; processedRunIds:string[]; claimedRewardKeys:string[].
- Define PlayerProfileStore methods load():PlayerProfile, save(profile):void, update(mutator):PlayerProfile.
- Extend RunnerSnapshot with mode, storyStageId|null, livesRemaining, nearMissScore, hitsTaken, and stageSpeedBoostRemainingMs. Extend RunnerResult with mode, storyStageId|null, hitsTaken, nearMissScore, completedStage:boolean.
- Story catalog order: dawn-city / Dawn City / 2500m / hanayo-hiyori / target 20; moonlit-forest / Moonlit Forest / 3000m / tokino-mary / target 25; crystal-mine / Crystal Mine / 3500m / goth-student / target 30; cloud-skyway / Cloudtop Skyway / 4000m / cogane-rang / target 35. Coin targets are centralized and tunable.
- No localStorage or screen changes in this task. Update compile-only fixtures if required.

### I02. Verify schema contract

- Related Files:
  - src/game/runner/storyConfig.ts :: exported stage catalog and next-stage resolver; read-only

#### Details

- Confirm the four exported definitions and next-stage resolver directly during implementation review.

## Acceptance Criteria

- [ ] New domain types compile under strict TypeScript.
- [ ] Four stage definitions match the confirmed order, lengths, and character unlock order.
- [ ] No runtime behavior changes.

## Validation

- npm run typecheck

## Commit Message

    feat(runner): define modes and progression models

    Plan: 2026-10-30-runner-modes-progression
    Phase: P01-mode-and-profile-foundation
    Task: T01-domain-types

    - Define Endless and Story domain types and stage metadata
    - Define local profile and reward progression schema

## Progress

- [x] Implementation complete
- [x] Validation passed: npm run typecheck
- commit: 897433b
