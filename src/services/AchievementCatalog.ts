import type { CharacterId } from '../game/characters/characterTypes';

export type AchievementMetric = 'endless-distance' | 'wallet-coins-collected' | 'gates-passed' |
  'character-distance' | 'all-runners-distance' | 'story-courses-cleared';
export type AchievementModeScope = 'endless' | 'both' | 'story';
export type AchievementDefinition = Readonly<{
  id: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  modeScope: AchievementModeScope;
  threshold: number;
  characterId?: CharacterId;
  rewardCoins: number;
  rewardCosmeticId?: string;
}>;

export const ACHIEVEMENTS: readonly AchievementDefinition[] = Object.freeze([
  { id: 'distance-2500', name: '첫 바람길', description: '무한 모드 한 번의 런에서 2,500m 달리기', metric: 'endless-distance', modeScope: 'endless', threshold: 2_500, rewardCoins: 25 },
  { id: 'distance-5000', name: '별빛 질주', description: '무한 모드 한 번의 런에서 5,000m 달리기', metric: 'endless-distance', modeScope: 'endless', threshold: 5_000, rewardCoins: 50, rewardCosmeticId: 'trail-starlight' },
  { id: 'distance-10000', name: '하늘 끝까지', description: '무한 모드 한 번의 런에서 10,000m 달리기', metric: 'endless-distance', modeScope: 'endless', threshold: 10_000, rewardCoins: 100, rewardCosmeticId: 'profile-sky-crown' },
  { id: 'wallet-coins-100', name: '반짝이는 수집가', description: '무한·스토리 모드에서 획득한 코인 누적 100개 모으기', metric: 'wallet-coins-collected', modeScope: 'both', threshold: 100, rewardCoins: 30 },
  { id: 'wallet-coins-500', name: '보물 사냥꾼', description: '무한·스토리 모드에서 획득한 코인 누적 500개 모으기', metric: 'wallet-coins-collected', modeScope: 'both', threshold: 500, rewardCoins: 75, rewardCosmeticId: 'trail-golden-notes' },
  { id: 'gates-5', name: '풍경을 지나', description: '무한·스토리 모드에서 게이트 누적 5개 통과', metric: 'gates-passed', modeScope: 'both', threshold: 5, rewardCoins: 35 },
  { id: 'all-runners-1000', name: '다섯 빛의 동행', description: '무한·스토리 모드에서 모든 러너로 각각 1,000m 달리기',
    metric: 'all-runners-distance', modeScope: 'both', threshold: 5, rewardCoins: 50 },
  { id: 'story-grand-tour', name: '별길 완주', description: '스토리 코스 네 곳 모두 완주',
    metric: 'story-courses-cleared', modeScope: 'story', threshold: 4, rewardCoins: 100 },
]);
