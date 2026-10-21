export const CHARACTER_ANIMATION_NAMES = [
  'idle',
  'idleLook',
  'walk',
  'run',
  'jump',
  'hurt',
  'start',
  'victory',
  'gameOver',
] as const;

export type CharacterAnimationName = (typeof CHARACTER_ANIMATION_NAMES)[number];

export type CharacterStats = {
  walkSpeed: number;
  runSpeed: number;
  jumpVelocity: number;
};

export type CharacterAnimationSet = Record<CharacterAnimationName, string[]>;

export type CharacterDefinition = {
  id: string;
  displayName: string;
  textureKey: string;
  stats: CharacterStats;
  animations: CharacterAnimationSet;
  frameWidth: number;
  frameHeight: number;
};
