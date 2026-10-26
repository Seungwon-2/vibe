import type { CharacterId } from './characterTypes';

export type CharacterPassiveId =
  | 'time-pickup'
  | 'slide-release-grace'
  | 'double-jump-impulse'
  | 'collision-penalty-reduction';

export type CharacterPassiveDefinition =
  | Readonly<{ id: 'time-pickup'; bonusMs: number }>
  | Readonly<{ id: 'slide-release-grace'; graceMs: number }>
  | Readonly<{ id: 'double-jump-impulse'; multiplier: number }>
  | Readonly<{ id: 'collision-penalty-reduction'; reductionMs: number }>;

export const CHARACTER_PASSIVES: Readonly<Record<CharacterPassiveId, CharacterPassiveDefinition>> =
  Object.freeze({
    'time-pickup': Object.freeze({ id: 'time-pickup', bonusMs: 1000 }),
    'slide-release-grace': Object.freeze({ id: 'slide-release-grace', graceMs: 150 }),
    'double-jump-impulse': Object.freeze({ id: 'double-jump-impulse', multiplier: 1.12 }),
    'collision-penalty-reduction': Object.freeze({ id: 'collision-penalty-reduction', reductionMs: 1000 }),
  });

const CHARACTER_PASSIVE_BY_ID: Readonly<Record<CharacterId, CharacterPassiveId>> = Object.freeze({
  'player-default': 'time-pickup',
  'goth-student': 'slide-release-grace',
  moonwing: 'double-jump-impulse',
  'akane-lize': 'collision-penalty-reduction',
});

export function getCharacterPassive(characterId: CharacterId): CharacterPassiveDefinition {
  return CHARACTER_PASSIVES[CHARACTER_PASSIVE_BY_ID[characterId]];
}

export function getCharacterPassiveId(characterId: CharacterId): CharacterPassiveId {
  return CHARACTER_PASSIVE_BY_ID[characterId];
}
