import type { CharacterId } from '../characters/characterTypes';

export const RUNNER_GROUND_Y = 470;
export const RUNNER_PLAYER_X = 170;
export const STANDING_BODY_WIDTH = 40;
export const STANDING_BODY_HEIGHT = 76;
export const SLIDING_BODY_WIDTH = 72;
export const SLIDING_BODY_HEIGHT = 40;
export const SLIDE_SCALE_X = 0.8;
export const SLIDE_SCALE_Y = 0.6;

// Opaque bottom edge (maxY + 1) of each 96px source frame, measured at alpha > 20.
// The frames are transparent below the art, so a plain bottom-origin sprite floats.
const SLIDE_FRAME_BOTTOM: Readonly<Record<CharacterId, readonly [number, number]>> = {
  'player-default': [75, 68],
  'goth-student': [80, 80],
  moonwing: [78, 75],
  'akane-lize': [78, 72],
};

export function getSlidePose(characterId: CharacterId, frameName: string) {
  const frameIndex = frameName.endsWith('-01') ? 1 : 0;
  const opaqueBottom = SLIDE_FRAME_BOTTOM[characterId][frameIndex];
  const sourceBodyWidth = SLIDING_BODY_WIDTH / SLIDE_SCALE_X;
  const sourceBodyHeight = SLIDING_BODY_HEIGHT / SLIDE_SCALE_Y;
  return {
    key: `slide-${frameIndex}`,
    spriteY: RUNNER_GROUND_Y + (96 - opaqueBottom) * SLIDE_SCALE_Y,
    scaleX: SLIDE_SCALE_X,
    scaleY: SLIDE_SCALE_Y,
    sourceBodyWidth,
    sourceBodyHeight,
    offsetX: (96 - sourceBodyWidth) / 2,
    offsetY: opaqueBottom - sourceBodyHeight,
  } as const;
}
