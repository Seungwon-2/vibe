import type { CharacterDefinition, CharacterId } from '../../game/characters/characterTypes';

export type CharacterSelectArt = Readonly<{ faceUrl: string; fullUrl: string }>;

const rosterArtIds: ReadonlySet<CharacterId> = new Set([
  'player-default',
  'hanayo-hiyori',
  'tokino-mary',
  'goth-student',
  'cogane-rang',
]);

// Matches the numbered silhouette assets produced by build-selector-portraits.mjs.
export const upcomingCharacterSilhouettes = [
  'ayatsuno-yuni', 'tenko-shibuki', 'hanako-nana', 'yuzuha-riko', 'sakihane-fuya',
  'shirayuki-hina', 'neneko-mashiro', 'akane-lize', 'arahashi-tabi', 'airi-kanna',
].map((id, index) => ({ id, url: `/assets/character/selector-art/roster/upcoming-${index + 1}.webp` }));

export function getCharacterSelectArt(character: CharacterDefinition): CharacterSelectArt {
  if (!rosterArtIds.has(character.id)) {
    return { faceUrl: character.portraitUrl, fullUrl: character.portraitUrl };
  }
  const baseUrl = `/assets/character/selector-art/roster/${character.id}`;
  return { faceUrl: `${baseUrl}-face.webp`, fullUrl: `${baseUrl}-full.webp` };
}
