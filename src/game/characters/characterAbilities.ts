import type { CharacterId } from './characterTypes';

export type CharacterPassiveId =
  | 'rin-speed'
  | 'hiyori-guard'
  | 'mary-pickup-magnet'
  | 'toa-ghost-glide'
  | 'rang-double-jump'
  | 'unassigned';

export type CharacterPassiveDefinition =
  | Readonly<{ id: 'rin-speed'; speedBonusRatio: number; name: string; icon: 'rin-cloud-tailwind'; effectLabel: string }>
  | Readonly<{ id: 'hiyori-guard'; chargesPerRun: number; name: string; icon: 'hiyori-blossom-ward'; effectLabel: string }>
  | Readonly<{ id: 'mary-pickup-magnet'; pickupRadiusMultiplier: number; name: string; icon: 'mary-music-magnet'; effectLabel: string }>
  | Readonly<{ id: 'toa-ghost-glide'; slideGuardMs: number; cooldownMs: number; name: string; icon: 'toa-ghost-glide'; effectLabel: string }>
  | Readonly<{ id: 'rang-double-jump'; doubleJumpVelocityMultiplier: number; name: string; icon: 'rang-tiger-spring'; effectLabel: string }>
  | Readonly<{ id: 'unassigned'; name: string; icon: null; effectLabel: string }>;

export const CHARACTER_PASSIVES: Readonly<Record<CharacterPassiveId, CharacterPassiveDefinition>> =
  Object.freeze({
    'rin-speed': Object.freeze({
      id: 'rin-speed', speedBonusRatio: 0.05, name: '질주의 메이드',
      icon: 'rin-cloud-tailwind', effectLabel: '기본 달리기 속도 +5%',
    }),
    'hiyori-guard': Object.freeze({
      id: 'hiyori-guard', chargesPerRun: 2, name: '벚꽃 수호',
      icon: 'hiyori-blossom-ward', effectLabel: '충돌·낭떠러지 방어 2회',
    }),
    'mary-pickup-magnet': Object.freeze({
      id: 'mary-pickup-magnet', pickupRadiusMultiplier: 1.5, name: '음표의 이끌림',
      icon: 'mary-music-magnet', effectLabel: '아이템 획득 범위 +50%',
    }),
    'toa-ghost-glide': Object.freeze({
      id: 'toa-ghost-glide', slideGuardMs: 250, cooldownMs: 20_000, name: '고스트 슬라이드',
      icon: 'toa-ghost-glide', effectLabel: '슬라이드 시작 0.25초 충돌 1회 무효 · 대기 20초',
    }),
    'rang-double-jump': Object.freeze({
      id: 'rang-double-jump', doubleJumpVelocityMultiplier: 1.058, name: '호랑이 탄력',
      icon: 'rang-tiger-spring', effectLabel: '2단 점프 높이 +12%',
    }),
    unassigned: Object.freeze({ id: 'unassigned', name: '고유 능력 없음', icon: null, effectLabel: '기본 성능으로 플레이합니다' }),
  });

const CHARACTER_PASSIVE_BY_ID: Readonly<Record<CharacterId, CharacterPassiveId>> = Object.freeze({
  'player-default': 'rin-speed',
  'goth-student': 'toa-ghost-glide',
  'cogane-rang': 'rang-double-jump',
  'hanayo-hiyori': 'hiyori-guard',
  'tokino-mary': 'mary-pickup-magnet',
});

export function getCharacterPassive(characterId: CharacterId): CharacterPassiveDefinition {
  return CHARACTER_PASSIVES[CHARACTER_PASSIVE_BY_ID[characterId]];
}

export function getCharacterPassiveId(characterId: CharacterId): CharacterPassiveId {
  return CHARACTER_PASSIVE_BY_ID[characterId];
}
