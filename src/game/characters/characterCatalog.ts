import { CHARACTER_ATLASES } from './characterAtlases';
import { getCharacterPassiveId } from './characterAbilities';
import type { CharacterAnimationName, CharacterDefinition, CharacterId } from './characterTypes';

const ANIMATION_FRAME_SUFFIXES: Readonly<Record<CharacterAnimationName, string>> = {
  idle: 'idle-',
  run: 'run-',
  jump: 'jump-',
  doubleJump: 'double-jump-',
  slide: 'slide-',
  hurt: 'hurt-',
  start: 'start-',
  victory: 'victory-',
  gameOver: 'game-over-',
};

function getAnimationFrames(
  frameNames: string[],
  characterId: CharacterId,
): Record<CharacterAnimationName, readonly string[]> {
  const prefix = characterId === 'player-default' ? '' : `${characterId}-`;

  return Object.fromEntries(
    Object.entries(ANIMATION_FRAME_SUFFIXES).map(([animation, suffix]) => [
      animation,
      frameNames
        .filter((name) => name.startsWith(`${prefix}${suffix}`))
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true })),
    ]),
  ) as unknown as Record<CharacterAnimationName, readonly string[]>;
}

function createCharacter(
  id: CharacterId,
  displayName: string,
  accentColor: string,
): CharacterDefinition {
  const atlas = CHARACTER_ATLASES[id];

  return {
    id,
    displayName,
    accentColor,
    portraitUrl: atlas.portraitUrl,
    textureKey: id,
    atlasUrl: atlas.atlasUrl,
    atlasManifest: atlas.atlasManifest,
    frameWidth: 96,
    frameHeight: 96,
    animations: getAnimationFrames(Object.keys(atlas.atlasManifest.frames), id),
    passive: getCharacterPassiveId(id),
  };
}

export const CHARACTERS: readonly CharacterDefinition[] = Object.freeze([
  createCharacter('player-default', 'Aokumo Rin', '#2b66c0'),
  createCharacter('goth-student', 'Shizuki Toa', '#513661'),
  createCharacter('moonwing', 'Ayatsuno Yuni', '#857fd8'),
  createCharacter('akane-lize', 'Akane Lize', '#971b2f'),
]);

const CHARACTER_BY_ID: ReadonlyMap<CharacterId, CharacterDefinition> = new Map(
  CHARACTERS.map((character) => [character.id, character]),
);

export function getCharacter(id: CharacterId): CharacterDefinition {
  const character = CHARACTER_BY_ID.get(id);
  if (!character) throw new Error(`Unknown character: ${id}`);
  return character;
}

export function resolveCharacterId(value: string | null | undefined): CharacterId {
  if (value && CHARACTER_BY_ID.has(value as CharacterId)) return value as CharacterId;
  return 'player-default';
}
