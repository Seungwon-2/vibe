import type { CharacterId, PlayerProfileDto, RunSubmission, StoryStageId } from '../shared/contracts.js';
import { ApiException } from '../shared/errors.js';

const STARTER_CHARACTERS: readonly CharacterId[] = ['player-default', 'hanayo-hiyori', 'tokino-mary'];
const STAGES: readonly { id: StoryStageId; distance: number; coinTarget: number; character: CharacterId | null;
  noHitCosmetic: string; coinCosmetic: string }[] = [
  { id: 'dawn-city', distance: 2500, coinTarget: 20, character: null, noHitCosmetic: 'dawn-no-hit-trail', coinCosmetic: 'dawn-coin-profile' },
  { id: 'moonlit-forest', distance: 3000, coinTarget: 25, character: null, noHitCosmetic: 'forest-no-hit-trail', coinCosmetic: 'forest-coin-profile' },
  { id: 'crystal-mine', distance: 3500, coinTarget: 30, character: 'goth-student', noHitCosmetic: 'mine-no-hit-trail', coinCosmetic: 'mine-coin-profile' },
  { id: 'cloud-skyway', distance: 4000, coinTarget: 35, character: 'cogane-rang', noHitCosmetic: 'skyway-no-hit-trail', coinCosmetic: 'skyway-coin-profile' },
];

const ACHIEVEMENTS = [
  { id: 'distance-2500', metric: 'endless-distance', threshold: 2500, coins: 25 },
  { id: 'distance-5000', metric: 'endless-distance', threshold: 5000, coins: 50, cosmetic: 'trail-starlight' },
  { id: 'distance-10000', metric: 'endless-distance', threshold: 10000, coins: 100, cosmetic: 'profile-sky-crown' },
  { id: 'wallet-coins-100', metric: 'wallet-coins-collected', threshold: 100, coins: 30 },
  { id: 'wallet-coins-500', metric: 'wallet-coins-collected', threshold: 500, coins: 75, cosmetic: 'trail-golden-notes' },
  { id: 'gates-5', metric: 'gates-passed', threshold: 5, coins: 35 },
  { id: 'all-runners-1000', metric: 'all-runners-distance', threshold: 5, coins: 50 },
  { id: 'story-grand-tour', metric: 'story-courses-cleared', threshold: 4, coins: 100 },
] as const;

function unique<T>(items: readonly T[]): T[] { return [...new Set(items)]; }
function claim(profile: PlayerProfileDto, key: string): boolean { return profile.claimedRewardKeys.includes(key); }

export function settleRunOnce(profile: PlayerProfileDto, run: RunSubmission): PlayerProfileDto {
  if (profile.processedRunIds.includes(run.runId)) return profile;
  const progress: Record<string, number> = { ...profile.achievementProgress };
  progress['wallet-coins-collected'] = (progress['wallet-coins-collected'] ?? 0) + run.coins;
  progress['gates-passed'] = (progress['gates-passed'] ?? 0) + run.passedGateCount;
  const characterMetric = `character-distance:${run.characterId}`;
  progress[characterMetric] = (progress[characterMetric] ?? 0) + run.distanceMeters;
  const characterIds: readonly CharacterId[] = ['player-default', 'hanayo-hiyori', 'tokino-mary', 'goth-student', 'cogane-rang'];
  progress['all-runners-distance'] = characterIds.filter((id) =>
    (progress[`character-distance:${id}`] ?? 0) >= 1000).length;
  const cleared = [...profile.clearedStageIds];
  const unlockedStages = [...profile.unlockedStageIds];
  const unlockedCharacters = unique([...profile.unlockedCharacterIds, ...STARTER_CHARACTERS]);
  const completedChallenges = [...profile.completedChallengeKeys];
  const unlockedCosmetics = [...profile.unlockedCosmeticIds];
  const claimed = [...profile.claimedRewardKeys];
  let earnedCoins = run.coins;

  if (run.mode === 'story' && run.completedStage) {
    const stageIndex = STAGES.findIndex((stage) => stage.id === run.storyStageId);
    const stage = STAGES[stageIndex];
    if (!stage || run.finishReason !== 'stage-complete' || run.distanceMeters < stage.distance) {
      throw new ApiException(400, 'INVALID_STAGE_CLEAR', 'INVALID_STAGE_CLEAR');
    }
    if (!unlockedStages.includes(stage.id)) throw new ApiException(403, 'STAGE_LOCKED', 'STAGE_LOCKED');
    cleared.splice(0, cleared.length, ...unique([...cleared, stage.id]));
    const nextStage = STAGES[stageIndex + 1];
    if (nextStage) unlockedStages.splice(0, unlockedStages.length, ...unique([...unlockedStages, nextStage.id]));
    if (stage.character) unlockedCharacters.splice(0, unlockedCharacters.length, ...unique([...unlockedCharacters, stage.character]));
    if (run.hitsTaken === 0) {
      const key = `${stage.id}:no-hit`;
      if (!claim(profile, `reward:${key}`)) {
        completedChallenges.push(key);
        unlockedCosmetics.push(stage.noHitCosmetic);
        claimed.push(`reward:${key}`);
      }
    }
    if (run.coins >= stage.coinTarget) {
      const key = `${stage.id}:coin-target`;
      if (!claim(profile, `reward:${key}`)) {
        completedChallenges.push(key);
        unlockedCosmetics.push(stage.coinCosmetic);
        claimed.push(`reward:${key}`);
      }
    }
    progress['story-courses-cleared'] = unique([...cleared]).length;
  }

  for (const achievement of ACHIEVEMENTS) {
    const key = `achievement:${achievement.id}`;
    if (profile.unlockedAchievementIds.includes(achievement.id) || claim(profile, key)) continue;
    let value = progress[achievement.metric] ?? 0;
    if (achievement.metric === 'endless-distance') {
      value = run.mode === 'endless' ? Math.max(progress[achievement.metric] ?? 0, run.distanceMeters) : 0;
      progress[achievement.metric] = value;
    }
    if (value >= achievement.threshold) {
      progress[achievement.id] = value;
      claimed.push(key);
      if ('cosmetic' in achievement) unlockedCosmetics.push(achievement.cosmetic);
      earnedCoins += achievement.coins;
    }
  }

  if (!Number.isSafeInteger(earnedCoins) || profile.walletCoins + earnedCoins > Number.MAX_SAFE_INTEGER - 1) {
    throw new ApiException(409, 'PROFILE_LIMIT', 'PROFILE_LIMIT');
  }
  const processedRunIds = [...profile.processedRunIds, run.runId].slice(-1000);
  return {
    ...profile, walletCoins: profile.walletCoins + earnedCoins,
    unlockedCharacterIds: unique(unlockedCharacters), unlockedStageIds: unique(unlockedStages),
    clearedStageIds: unique(cleared), completedChallengeKeys: unique(completedChallenges),
    achievementProgress: progress, unlockedAchievementIds: unique([...profile.unlockedAchievementIds,
      ...ACHIEVEMENTS.filter((achievement) => claimed.includes(`achievement:${achievement.id}`)).map((achievement) => achievement.id)]),
    unlockedCosmeticIds: unique(unlockedCosmetics), processedRunIds, claimedRewardKeys: unique(claimed),
  };
}

export function assertStoryStageUnlocked(profile: PlayerProfileDto, stageId: StoryStageId): void {
  if (!profile.unlockedStageIds.includes(stageId)) throw new ApiException(403, 'STAGE_LOCKED', 'STAGE_LOCKED');
}
