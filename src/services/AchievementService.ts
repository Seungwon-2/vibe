import { ACHIEVEMENTS } from './AchievementCatalog';
import { CHARACTERS } from '../game/characters/characterCatalog';
import { STORY_STAGES } from '../game/runner/storyConfig';
import type { PlayerProfile, PlayerProfileStore } from './PlayerProfile';
import type { RunnerResult } from '../game/runner/runnerTypes';

export type AchievementUpdate = Readonly<{
  profile: PlayerProfile;
  newlyUnlockedAchievementIds: readonly string[];
  bonusCoins: number;
}>;

export function recordRunAndUnlock(
  profileStore: PlayerProfileStore,
  runId: string,
  result: RunnerResult,
): AchievementUpdate {
  const progressKey = `achievement-run:${runId}`;
  const wasRecorded = profileStore.claimReward(progressKey, (profile) => {
    const progress = { ...profile.achievementProgress };
    if (result.mode === 'endless') {
      progress['endless-distance'] = Math.max(progress['endless-distance'] ?? 0, result.distanceMeters);
    }
    progress['wallet-coins-collected'] = (progress['wallet-coins-collected'] ?? 0) + result.coins;
    progress['gates-passed'] = (progress['gates-passed'] ?? 0) + (result.passedGateCount ?? 0);
    const characterMetric = `character-distance:${result.characterId}`;
    progress[characterMetric] = Math.max(progress[characterMetric] ?? 0, result.distanceMeters);
    progress['all-runners-distance'] = CHARACTERS.filter((character) =>
      (progress[`character-distance:${character.id}`] ?? 0) >= 1_000,
    ).length;
    if (result.mode === 'story' && result.completedStage && result.finishReason === 'stage-complete' &&
        result.storyStageId && STORY_STAGES.some((stage) => stage.id === result.storyStageId)) {
      const clearedStageIds = profile.clearedStageIds.includes(result.storyStageId)
        ? profile.clearedStageIds : [...profile.clearedStageIds, result.storyStageId];
      progress['story-courses-cleared'] = clearedStageIds.filter((stageId) =>
        STORY_STAGES.some((stage) => stage.id === stageId),
      ).length;
      return { ...profile, clearedStageIds, achievementProgress: progress };
    }
    return { ...profile, achievementProgress: progress };
  });

  const newlyUnlockedAchievementIds: string[] = [];
  let bonusCoins = 0;
  if (wasRecorded) {
    const profile = profileStore.load();
    for (const achievement of ACHIEVEMENTS) {
      if (profile.unlockedAchievementIds.includes(achievement.id)) continue;
      if (achievement.characterId && achievement.characterId !== result.characterId) continue;
      const metricKey = achievement.metric === 'character-distance'
        ? `character-distance:${achievement.characterId}` : achievement.metric;
      if ((profile.achievementProgress[metricKey] ?? 0) < achievement.threshold) continue;
      const claimed = profileStore.claimReward(`achievement:${achievement.id}`, (current) => ({
        ...current,
        unlockedAchievementIds: [...current.unlockedAchievementIds, achievement.id],
        walletCoins: current.walletCoins + achievement.rewardCoins,
        unlockedCosmeticIds: achievement.rewardCosmeticId && !current.unlockedCosmeticIds.includes(achievement.rewardCosmeticId)
          ? [...current.unlockedCosmeticIds, achievement.rewardCosmeticId] : current.unlockedCosmeticIds,
      }));
      if (claimed) {
        newlyUnlockedAchievementIds.push(achievement.id);
        bonusCoins += achievement.rewardCoins;
      }
    }
  }
  return { profile: profileStore.load(), newlyUnlockedAchievementIds, bonusCoins };
}
