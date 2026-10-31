import type { CharacterId } from '../game/characters/characterTypes';

export type AchievementMetric = 'distance' | 'wallet-coins-collected' | 'gates-passed' | 'story-no-hit' | 'character-distance';
export type AchievementDefinition = Readonly<{
  id: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  threshold: number;
  characterId?: CharacterId;
  rewardCoins: number;
  rewardCosmeticId?: string;
}>;

export const ACHIEVEMENTS: readonly AchievementDefinition[] = Object.freeze([
  { id: 'distance-2500', name: '첫 바람길', description: '한 번의 런에서 2,500m 달리기', metric: 'distance', threshold: 2_500, rewardCoins: 25 },
  { id: 'distance-5000', name: '별빛 질주', description: '한 번의 런에서 5,000m 달리기', metric: 'distance', threshold: 5_000, rewardCoins: 50, rewardCosmeticId: 'trail-starlight' },
  { id: 'distance-10000', name: '하늘 끝까지', description: '한 번의 런에서 10,000m 달리기', metric: 'distance', threshold: 10_000, rewardCoins: 100, rewardCosmeticId: 'profile-sky-crown' },
  { id: 'wallet-coins-100', name: '반짝이는 수집가', description: '누적 코인 100개 모으기', metric: 'wallet-coins-collected', threshold: 100, rewardCoins: 30 },
  { id: 'wallet-coins-500', name: '보물 사냥꾼', description: '누적 코인 500개 모으기', metric: 'wallet-coins-collected', threshold: 500, rewardCoins: 75, rewardCosmeticId: 'trail-golden-notes' },
  { id: 'gates-5', name: '풍경을 지나', description: '누적 게이트 5개 통과', metric: 'gates-passed', threshold: 5, rewardCoins: 35 },
  { id: 'story-no-hit', name: '흔들림 없는 발걸음', description: '스토리 코스 무피격 완주', metric: 'story-no-hit', threshold: 1, rewardCoins: 60, rewardCosmeticId: 'profile-perfect-run' },
  ...([
    ['player-default', 'aokumo-rin'],
    ['hanayo-hiyori', 'hanayo-hiyori'],
    ['tokino-mary', 'tokino-mary'],
    ['goth-student', 'shizuki-toa'],
    ['cogane-rang', 'cogane-rang'],
  ] as const).map(([characterId, slug]) => ({
    id: `runner-${slug}-1000`, name: '나만의 페이스', description: '이 캐릭터로 1,000m 달리기',
    metric: 'character-distance' as const, threshold: 1_000, characterId, rewardCoins: 20,
  })),
]);
