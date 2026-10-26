import type { CharacterPassiveId } from './characterAbilities';

export type CharacterId =
  | 'player-default'
  | 'goth-student'
  | 'moonwing'
  | 'akane-lize';

export type CharacterAnimationName =
  | 'idle'
  | 'run'
  | 'jump'
  | 'doubleJump'
  | 'slide'
  | 'hurt'
  | 'start'
  | 'victory'
  | 'gameOver';

export type RuntimeAtlasFrame = {
  frame: { x: number; y: number; w: number; h: number };
  rotated: false;
  trimmed: false;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
};

export type RuntimeAtlasManifest = {
  frames: Record<string, RuntimeAtlasFrame>;
  meta: {
    image: string;
    size: { w: number; h: number };
    scale: '1';
  };
};

export type CharacterDefinition = {
  id: CharacterId;
  displayName: string;
  accentColor: string;
  portraitUrl: string;
  textureKey: string;
  atlasUrl: string;
  atlasManifest: RuntimeAtlasManifest;
  frameWidth: 96;
  frameHeight: 96;
  animations: Record<CharacterAnimationName, readonly string[]>;
  passive: CharacterPassiveId;
};
