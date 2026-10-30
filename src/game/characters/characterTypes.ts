import type { CharacterPassiveId } from './characterAbilities';

export type CharacterId =
  | 'player-default'
  | 'goth-student'
  | 'cogane-rang'
  | 'hanayo-hiyori'
  | 'tokino-mary';

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

// Kept for migration tooling that validates the archived 96px atlases. Runtime rendering uses quality frames.
export type RuntimeAtlasFrame = {
  frame: { x: number; y: number; w: number; h: number };
  rotated: false;
  trimmed: false;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
};

export type RuntimeAtlasManifest = {
  frames: Record<string, RuntimeAtlasFrame>;
  meta: { image: string; size: { w: number; h: number }; scale: '1' };
};

export type CharacterFrameRef = Readonly<{ textureKey: string; url: string }>;
export type CharacterQualityAnimations = Readonly<Record<CharacterAnimationName, readonly CharacterFrameRef[]>>;
export type CharacterAnimationFps = Readonly<Record<CharacterAnimationName, number>>;

export type CharacterDefinition = {
  id: CharacterId;
  displayName: string;
  accentColor: string;
  available: boolean;
  portraitUrl: string;
  qualityAnimations: CharacterQualityAnimations;
  qualityAnimationFps: CharacterAnimationFps;
  qualityFrameSize: 192 | 384;
  qualityPivotY: 180 | 360;
  qualityScale: number;
  passive: CharacterPassiveId;
};
