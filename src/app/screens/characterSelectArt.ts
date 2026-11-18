import type { CharacterDefinition, CharacterId } from '../../game/characters/characterTypes';

export type CharacterSelectArt = Readonly<{ faceUrl: string; fullUrl: string }>;

const rosterArtIds: ReadonlySet<CharacterId> = new Set([
  'player-default',
  'hanayo-hiyori',
  'tokino-mary',
  'goth-student',
  'cogane-rang',
]);

export function getCharacterSelectArt(character: CharacterDefinition): CharacterSelectArt {
  if (!rosterArtIds.has(character.id)) {
    return { faceUrl: character.portraitUrl, fullUrl: character.portraitUrl };
  }
  const baseUrl = `/assets/character/selector-art/roster/${character.id}`;
  return { faceUrl: `${baseUrl}-face.webp`, fullUrl: `${baseUrl}-full.webp` };
}
