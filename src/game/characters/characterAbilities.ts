import type { CharacterId } from './characterTypes';

export type CharacterPassiveId =
  | 'time-pickup'
  | 'slide-release-grace'
  | 'rang-second-jump'
  | 'hiyori-pickup-magnet'
  | 'mary-hit-protection';

export type CharacterPassiveDefinition =
  | Readonly<{ id: 'time-pickup'; bonusMs: number }>
  | Readonly<{ id: 'slide-release-grace'; graceMs: number }>
  | Readonly<{ id: 'rang-second-jump'; multiplier: number }>
  | Readonly<{ id: 'hiyori-pickup-magnet'; radiusPx: number }>
  | Readonly<{ id: 'mary-hit-protection'; bonusMs: number }>;

export const CHARACTER_PASSIVES: Readonly<Record<CharacterPassiveId, CharacterPassiveDefinition>> =
  Object.freeze({
    'time-pickup': Object.freeze({ id: 'time-pickup', bonusMs: 1000 }),
    'slide-release-grace': Object.freeze({ id: 'slide-release-grace', graceMs: 150 }),
    'rang-second-jump': Object.freeze({ id: 'rang-second-jump', multiplier: 1.08 }),
    'hiyori-pickup-magnet': Object.freeze({ id: 'hiyori-pickup-magnet', radiusPx: 20 }),
    'mary-hit-protection': Object.freeze({ id: 'mary-hit-protection', bonusMs: 250 }),
  });

const CHARACTER_PASSIVE_BY_ID: Readonly<Record<CharacterId, CharacterPassiveId>> = Object.freeze({
  'player-default': 'time-pickup',
  'goth-student': 'slide-release-grace',
  'cogane-rang': 'rang-second-jump',
  'hanayo-hiyori': 'hiyori-pickup-magnet',
  'tokino-mary': 'mary-hit-protection',
});

export function getCharacterPassive(characterId: CharacterId): CharacterPassiveDefinition {
  return CHARACTER_PASSIVES[CHARACTER_PASSIVE_BY_ID[characterId]];
}

export function getCharacterPassiveId(characterId: CharacterId): CharacterPassiveId {
  return CHARACTER_PASSIVE_BY_ID[characterId];
}
