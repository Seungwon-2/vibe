import { getCharacterPassiveId } from './characterAbilities';
import type { CharacterAnimationFps, CharacterAnimationName, CharacterDefinition, CharacterFrameRef, CharacterId } from './characterTypes';

const READY_CHARACTER_IDS: ReadonlySet<CharacterId> = new Set([
  'player-default', 'goth-student', 'cogane-rang', 'hanayo-hiyori', 'tokino-mary',
]);
const ANIMATION_NAMES: readonly CharacterAnimationName[] = [
  'idle', 'run', 'jump', 'doubleJump', 'slide', 'hurt', 'start', 'victory', 'gameOver',
];

const SELECTOR_PORTRAITS: Readonly<Record<CharacterId, string>> = {
  'player-default': '/assets/character/selector-art/aokumo-rin.webp',
  'goth-student': '/assets/character/selector-art/shizuki-toa.webp',
  'cogane-rang': '/assets/character/selector-art/cogane-rang.webp',
  'hanayo-hiyori': '/assets/character/selector-art/hanayo-hiyori.webp',
  'tokino-mary': '/assets/character/selector-art/tokino-mary.webp',
};

type QualitySource = Readonly<{
  frameSize: 192 | 384;
  pivotY: 180 | 360;
  extension: 'png' | 'webp';
  actionStem: Readonly<Partial<Record<'hurt' | 'slide' | 'jump' | 'doubleJump' | 'victory' | 'gameOver', string>>>;
  fps: Readonly<Partial<Record<CharacterAnimationName, number>>>;
}>;

const QUALITY_SOURCES: Readonly<Record<CharacterId, QualitySource>> = {
  'player-default': {
    frameSize: 192, pivotY: 180, extension: 'png',
    actionStem: { hurt: 'hurt', slide: 'slide', jump: 'jump', doubleJump: 'double-jump', victory: 'victory', gameOver: 'game-over' },
    fps: { run: 20, idle: 20, start: 20, hurt: 10, slide: 10, jump: 10, doubleJump: 10, victory: 10, gameOver: 10 },
  },
  'hanayo-hiyori': {
    frameSize: 384, pivotY: 360, extension: 'webp',
    actionStem: { hurt: 'hurt', slide: 'slide', jump: 'jump', doubleJump: 'double-jump', victory: 'victory', gameOver: 'game-over' },
    fps: { run: 20, idle: 20, start: 20, hurt: 10, slide: 10, jump: 10, doubleJump: 10, victory: 10, gameOver: 10 },
  },
  'tokino-mary': {
    frameSize: 384, pivotY: 360, extension: 'webp',
    actionStem: { hurt: 'hurt', slide: 'slide', jump: 'jump', doubleJump: 'double-jump', victory: 'victory', gameOver: 'game-over' },
    fps: { run: 20, idle: 20, start: 20, hurt: 10, slide: 10, jump: 10, doubleJump: 10, victory: 10, gameOver: 10 },
  },
  'goth-student': {
    frameSize: 384, pivotY: 360, extension: 'webp',
    actionStem: { hurt: 'hurt', slide: 'slide', jump: 'jump', doubleJump: 'double-jump', victory: 'victory', gameOver: 'game-over' },
    fps: { run: 20, idle: 20, start: 20, hurt: 10, slide: 12, jump: 12, doubleJump: 12, victory: 8, gameOver: 6 },
  },
  'cogane-rang': {
    frameSize: 384, pivotY: 360, extension: 'webp',
    actionStem: { hurt: 'hurt', slide: 'slide', jump: 'jump', doubleJump: 'double-jump', victory: 'victory', gameOver: 'game-over' },
    fps: { run: 20, idle: 20, start: 20, hurt: 10, slide: 12, jump: 12, doubleJump: 12, victory: 8, gameOver: 6 },
  },
};

function createQualityFrame(
  characterId: CharacterId,
  animation: CharacterAnimationName,
  frameNumber: number,
  url: string,
): CharacterFrameRef {
  return { textureKey: `${characterId}:quality:${animation}:${frameNumber}`, url };
}

function createQualityAnimations(characterId: CharacterId): {
  animations: Record<CharacterAnimationName, readonly CharacterFrameRef[]>;
  fps: CharacterAnimationFps;
} {
  const source = QUALITY_SOURCES[characterId];
  const runFrames = Array.from({ length: 12 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    const extension = characterId === 'player-default' ? 'png' : 'webp';
    const url = `/assets/character/selector-art/runs/${characterId}/run-${number}.${extension}`;
    return createQualityFrame(characterId, 'run', index + 1, url);
  });
  const actionNames = ['hurt', 'slide', 'jump', 'doubleJump', 'victory', 'gameOver'] as const;
  const animations = Object.fromEntries([
    ['run', runFrames],
    ['idle', [runFrames[0]]],
    ['start', runFrames.slice(0, 6)],
    ...actionNames.map((animation) => {
      const stem = source.actionStem[animation];
      if (!stem) throw new Error(`Missing quality source mapping: ${characterId}:${animation}`);
      const frames = Array.from({ length: 6 }, (_, index) => {
        const number = String(index + 1).padStart(2, '0');
        const fileName = `${stem}-${number}.${source.extension}`;
        const url = `/assets/character/game-motion/${characterId}/${fileName}`;
        return createQualityFrame(characterId, animation, index + 1, url);
      });
      return [animation, frames];
    }),
  ]) as unknown as Record<CharacterAnimationName, readonly CharacterFrameRef[]>;
  const fps = Object.fromEntries(ANIMATION_NAMES.map((name) => [
    name, source.fps[name as CharacterAnimationName] ?? 10,
  ])) as CharacterAnimationFps;
  return { animations, fps };
}

function createCharacter(
  id: CharacterId,
  displayName: string,
  accentColor: string,
): CharacterDefinition {
  const quality = QUALITY_SOURCES[id];
  const qualityAnimations = createQualityAnimations(id);

  return {
    id,
    displayName,
    accentColor,
    available: READY_CHARACTER_IDS.has(id),
    portraitUrl: SELECTOR_PORTRAITS[id],
    qualityAnimations: qualityAnimations.animations,
    qualityAnimationFps: qualityAnimations.fps,
    qualityFrameSize: quality.frameSize,
    qualityPivotY: quality.pivotY,
    qualityScale: 96 / quality.frameSize,
    passive: getCharacterPassiveId(id),
  };
}

export const CHARACTERS: readonly CharacterDefinition[] = Object.freeze([
  createCharacter('player-default', '아오쿠모 린', '#2b66c0'),
  createCharacter('goth-student', '시즈키 토아', '#513661'),
  createCharacter('cogane-rang', '코가네 랑', '#c98743'),
  createCharacter('hanayo-hiyori', '하나요 히요리', '#fca6d0'),
  createCharacter('tokino-mary', '토키노 메리', '#6d929a'),
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
  if (value && CHARACTER_BY_ID.get(value as CharacterId)?.available) return value as CharacterId;
  return 'player-default';
}
