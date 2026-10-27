import type { CharacterId } from '../characters/characterTypes';

export const RUNNER_GROUND_Y = 470;
export const RUNNER_PLAYER_X = 170;
export const STANDING_BODY_WIDTH = 40;
export const STANDING_BODY_HEIGHT = 76;
export const STANDING_FRAME_BOTTOM = 92;
export const STANDING_SPRITE_Y = RUNNER_GROUND_Y + (96 - STANDING_FRAME_BOTTOM);
export const STANDING_BODY_OFFSET_Y = STANDING_FRAME_BOTTOM - STANDING_BODY_HEIGHT;
export const SLIDING_BODY_WIDTH = 80;
export const SLIDING_BODY_HEIGHT = 48;

// The curated slides already share the standing artwork's scale. The older
// placeholder sheets remain smaller until they receive matching slide art.
const SLIDE_SCALE: Readonly<Record<CharacterId, number>> = {
  'player-default': 1,
  'goth-student': 0.72,
  'cogane-rang': 0.72,
  'hanayo-hiyori': 1,
  'tokino-mary': 1,
};

// Opaque bottom edge (maxY + 1) of the active slide frames, measured at alpha > 20.
const SLIDE_FRAME_BOTTOM: Readonly<Record<CharacterId, number>> = {
  'player-default': 90,
  'goth-student': 92,
  'cogane-rang': 92,
  'hanayo-hiyori': 89,
  'tokino-mary': 90,
};

export function getSlidePose(characterId: CharacterId) {
  const opaqueBottom = SLIDE_FRAME_BOTTOM[characterId];
  const scale = SLIDE_SCALE[characterId];
  const bodyWidth = scale === 1 ? SLIDING_BODY_WIDTH : 64;
  const sourceBodyWidth = bodyWidth / scale;
  const sourceBodyHeight = SLIDING_BODY_HEIGHT / scale;
  return {
    key: 'slide',
    spriteY: RUNNER_GROUND_Y + (96 - opaqueBottom) * scale,
    scaleX: scale,
    scaleY: scale,
    bodyWidth,
    sourceBodyWidth,
    sourceBodyHeight,
    offsetX: (96 - sourceBodyWidth) / 2,
    offsetY: opaqueBottom - sourceBodyHeight,
  } as const;
}
