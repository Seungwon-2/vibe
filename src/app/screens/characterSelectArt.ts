import type { CharacterDefinition, CharacterId } from '../../game/characters/characterTypes';

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

export function getCharacterSelectFaceUrl(character: CharacterDefinition): string {
  return rosterArtIds.has(character.id)
    ? `/assets/character/selector-art/roster/${character.id}-face.webp`
    : character.portraitUrl;
}
