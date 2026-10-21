import atlas from './characterAtlas.json';
import { registerCharacter } from './characterRegistry';
import type { CharacterAnimationName, CharacterDefinition } from './characterTypes';

const animationNames: CharacterAnimationName[] = [
  'idle', 'idleLook', 'walk', 'run', 'jump', 'hurt', 'start', 'victory', 'gameOver',
];

export const defaultCharacter: CharacterDefinition = {
  id: atlas.id,
  displayName: atlas.displayName,
  textureKey: atlas.textureKey,
  stats: { walkSpeed: 170, runSpeed: 250, jumpVelocity: -420 },
  animations: Object.fromEntries(
    animationNames.map((animationName) => [
      animationName,
      atlas.frames
        .filter((frame) => frame.animation === animationName)
        .map((frame) => frame.name),
    ]),
  ) as CharacterDefinition['animations'],
  frameWidth: atlas.frameWidth,
  frameHeight: atlas.frameHeight,
};

registerCharacter(defaultCharacter);
