import type { PlayerProfileDto } from '../shared/contracts.js';

export function createDefaultProfile(): PlayerProfileDto {
  return {
    version: 1,
    walletCoins: 0,
    unlockedCharacterIds: ['player-default', 'hanayo-hiyori', 'tokino-mary'],
    unlockedStageIds: ['dawn-city'],
    clearedStageIds: [],
    completedChallengeKeys: [],
    achievementProgress: {},
    unlockedAchievementIds: [],
    unlockedCosmeticIds: [],
    equippedCosmeticIdsByCharacter: {},
    processedRunIds: [],
    claimedRewardKeys: [],
  };
}
