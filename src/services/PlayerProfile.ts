import type { CharacterId } from '../game/characters/characterTypes';
import type { StoryStageId } from '../game/runner/runnerTypes';

export type PlayerProfile = Readonly<{
  version: 1;
  walletCoins: number;
  unlockedCharacterIds: readonly CharacterId[];
  unlockedStageIds: readonly StoryStageId[];
  clearedStageIds: readonly StoryStageId[];
  completedChallengeKeys: readonly string[];
  achievementProgress: Readonly<Record<string, number>>;
  unlockedAchievementIds: readonly string[];
  unlockedCosmeticIds: readonly string[];
  equippedCosmeticIdsByCharacter: Readonly<Record<string, readonly string[]>>;
  processedRunIds: readonly string[];
  claimedRewardKeys: readonly string[];
}>;

export interface PlayerProfileStore {
  load(): PlayerProfile;
  save(profile: PlayerProfile): void;
  update(mutator: (current: PlayerProfile) => PlayerProfile): PlayerProfile;
  settleRunCoins(runId: string, amount: number): boolean;
  claimReward(rewardKey: string, mutator: (current: PlayerProfile) => PlayerProfile): boolean;
}
