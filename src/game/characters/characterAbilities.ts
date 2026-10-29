import type { CharacterId } from './characterTypes';

export type CharacterPassiveId = 'rin-speed' | 'hiyori-guard' | 'mary-pickup-magnet' | 'unassigned';

export type CharacterPassiveDefinition =
  | Readonly<{ id: 'rin-speed'; speedBonusRatio: number; name: string; icon: 'cloud'; effectLabel: string }>
  | Readonly<{ id: 'hiyori-guard'; chargesPerRun: number; name: string; icon: 'pink-flame'; effectLabel: string }>
  | Readonly<{ id: 'mary-pickup-magnet'; radiusPx: number; name: string; icon: 'sparkling-magnet'; effectLabel: string }>
  | Readonly<{ id: 'unassigned'; name: string; icon: null; effectLabel: string }>;

export const CHARACTER_PASSIVES: Readonly<Record<CharacterPassiveId, CharacterPassiveDefinition>> =
  Object.freeze({
    'rin-speed': Object.freeze({
      id: 'rin-speed', speedBonusRatio: 0.05, name: '질주의 메이드', icon: 'cloud', effectLabel: '최고 속도 +5%',
    }),
    'hiyori-guard': Object.freeze({
      id: 'hiyori-guard', chargesPerRun: 2, name: '유령의 수호', icon: 'pink-flame', effectLabel: '충돌·낭떠러지 방어 2회',
    }),
    'mary-pickup-magnet': Object.freeze({
      id: 'mary-pickup-magnet', radiusPx: 30, name: '별빛 자석', icon: 'sparkling-magnet', effectLabel: '수집 반경 +30px',
    }),
    unassigned: Object.freeze({ id: 'unassigned', name: '고유 능력 없음', icon: null, effectLabel: '기본 성능으로 플레이합니다' }),
  });

const CHARACTER_PASSIVE_BY_ID: Readonly<Record<CharacterId, CharacterPassiveId>> = Object.freeze({
  'player-default': 'rin-speed',
  'goth-student': 'unassigned',
  'cogane-rang': 'unassigned',
  'hanayo-hiyori': 'hiyori-guard',
  'tokino-mary': 'mary-pickup-magnet',
});

export function getCharacterPassive(characterId: CharacterId): CharacterPassiveDefinition {
  return CHARACTER_PASSIVES[CHARACTER_PASSIVE_BY_ID[characterId]];
}

export function getCharacterPassiveId(characterId: CharacterId): CharacterPassiveId {
  return CHARACTER_PASSIVE_BY_ID[characterId];
}
