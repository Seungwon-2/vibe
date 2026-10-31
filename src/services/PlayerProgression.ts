import type { RunnerResult, StoryChallengeId, StoryStageId } from '../game/runner/runnerTypes';
import type { CharacterId } from '../game/characters/characterTypes';
import { getNextStoryStageId, getStoryStage } from '../game/runner/storyConfig';
import type { PlayerProfile, PlayerProfileStore } from './PlayerProfile';

export type StageChallengeOutcome = Readonly<{
  id: StoryChallengeId;
  achieved: boolean;
  cosmeticId: string;
  newlyClaimed: boolean;
}>;

export type SettlementResult = Readonly<{
  depositedCoins: number;
  newlyUnlockedStageId: StoryStageId | null;
  newlyUnlockedCharacterId: CharacterId | null;
  newlyClaimedCosmeticIds: readonly string[];
  challenges: readonly StageChallengeOutcome[];
  profile: PlayerProfile;
}>;

export function evaluateStageChallenges(result: RunnerResult): readonly Omit<StageChallengeOutcome, 'newlyClaimed'>[] {
  if (result.mode !== 'story' || !result.storyStageId) return [];
  const stage = getStoryStage(result.storyStageId);
  const completed = result.completedStage === true && result.finishReason === 'stage-complete';
  return [
    {
      id: 'no-hit',
      achieved: completed && (result.hitsTaken ?? 0) === 0,
      cosmeticId: stage.challengeRewardCosmeticIds.noHit,
    },
    {
      id: 'coin-target',
      achieved: completed && result.coins >= stage.coinTarget,
      cosmeticId: stage.challengeRewardCosmeticIds.coinTarget,
    },
  ];
}

export function applyStoryOutcome(
  profileStore: PlayerProfileStore,
  result: RunnerResult,
): Pick<SettlementResult, 'newlyUnlockedStageId' | 'newlyUnlockedCharacterId' | 'newlyClaimedCosmeticIds' | 'challenges'> {
  if (result.mode !== 'story' || !result.storyStageId || result.finishReason !== 'stage-complete' || !result.completedStage) {
    return { newlyUnlockedStageId: null, newlyUnlockedCharacterId: null, newlyClaimedCosmeticIds: [], challenges: [] };
  }

  const stage = getStoryStage(result.storyStageId);
  let newlyUnlockedStageId: StoryStageId | null = null;
  let newlyUnlockedCharacterId: CharacterId | null = null;
  const clearRewardKey = `story-clear:${stage.id}`;
  profileStore.claimReward(clearRewardKey, (profile) => {
    const nextStageId = getNextStoryStageId(stage.id);
    const unlockedStageIds = nextStageId && !profile.unlockedStageIds.includes(nextStageId)
      ? [...profile.unlockedStageIds, nextStageId]
      : profile.unlockedStageIds;
    const unlockedCharacterIds = stage.unlockCharacterId && !profile.unlockedCharacterIds.includes(stage.unlockCharacterId)
      ? [...profile.unlockedCharacterIds, stage.unlockCharacterId]
      : profile.unlockedCharacterIds;
    if (nextStageId && !profile.unlockedStageIds.includes(nextStageId)) newlyUnlockedStageId = nextStageId;
    if (stage.unlockCharacterId && !profile.unlockedCharacterIds.includes(stage.unlockCharacterId)) {
      newlyUnlockedCharacterId = stage.unlockCharacterId;
    }
    return {
      ...profile,
      clearedStageIds: profile.clearedStageIds.includes(stage.id) ? profile.clearedStageIds : [...profile.clearedStageIds, stage.id],
      unlockedStageIds,
      unlockedCharacterIds,
    };
  });
  // Replays after a first clear still persist the cleared marker if a prior profile was migrated.
  profileStore.update((profile) => profile.clearedStageIds.includes(stage.id) ? profile : {
    ...profile, clearedStageIds: [...profile.clearedStageIds, stage.id],
  });

  const challengeOutcomes = evaluateStageChallenges(result);
  const newlyClaimedCosmeticIds: string[] = [];
  const challenges = challengeOutcomes.map((challenge) => {
    const challengeKey = `${stage.id}:${challenge.id}`;
    const newlyClaimed = challenge.achieved && profileStore.claimReward(`reward:${challengeKey}`, (profile) => ({
      ...profile,
      completedChallengeKeys: profile.completedChallengeKeys.includes(challengeKey)
        ? profile.completedChallengeKeys : [...profile.completedChallengeKeys, challengeKey],
      unlockedCosmeticIds: profile.unlockedCosmeticIds.includes(challenge.cosmeticId)
        ? profile.unlockedCosmeticIds : [...profile.unlockedCosmeticIds, challenge.cosmeticId],
    }));
    if (newlyClaimed) newlyClaimedCosmeticIds.push(challenge.cosmeticId);
    return { ...challenge, newlyClaimed };
  });

  return { newlyUnlockedStageId, newlyUnlockedCharacterId, newlyClaimedCosmeticIds, challenges };
}

export function settleRun(profileStore: PlayerProfileStore, runId: string, result: RunnerResult): SettlementResult {
  const deposited = profileStore.settleRunCoins(runId, result.coins);
  const storyOutcome = applyStoryOutcome(profileStore, result);
  return {
    depositedCoins: deposited ? result.coins : 0,
    ...storyOutcome,
    profile: profileStore.load(),
  };
}
