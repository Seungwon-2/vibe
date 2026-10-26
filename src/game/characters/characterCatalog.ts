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
  const animations = getAnimationFrames(Object.keys(atlas.atlasManifest.frames), id);
  const expected = { idle: 6, run: 12, jump: 6, doubleJump: 6, slide: 6,
    hurt: 6, start: 6, victory: 6, gameOver: 6 } as const;
  if (atlas.atlasManifest.meta.size.w !== 1152 || atlas.atlasManifest.meta.size.h !== 480 ||
      Object.keys(atlas.atlasManifest.frames).length !== 60) {
    throw new Error(`Invalid atlas layout: ${id}`);
  }
  for (const name of Object.keys(expected) as CharacterAnimationName[]) {
    if (animations[name].length !== expected[name] || animations[name].some((frameName) => {
      const frame = atlas.atlasManifest.frames[frameName]?.frame;
      return !frame || frame.w !== 96 || frame.h !== 96;
    })) throw new Error(`Missing or malformed ${id}:${name} frames`);
  }

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
    animations,
    passive: getCharacterPassiveId(id),
  };
}

export const CHARACTERS: readonly CharacterDefinition[] = Object.freeze([
  createCharacter('player-default', 'Aokumo Rin', '#2b66c0'),
  createCharacter('goth-student', 'Shizuki Toa', '#513661'),
  createCharacter('cogane-rang', 'Cogane Rang', '#c98743'),
  createCharacter('hanayo-hiyori', 'Hanayo Hiyori', '#fca6d0'),
  createCharacter('tokino-mary', 'Tokino Mary', '#6d929a'),
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
