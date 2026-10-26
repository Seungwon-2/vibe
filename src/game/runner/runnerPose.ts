import type { CharacterId } from '../characters/characterTypes';

export const RUNNER_GROUND_Y = 470;
export const RUNNER_PLAYER_X = 170;
export const STANDING_BODY_WIDTH = 40;
export const STANDING_BODY_HEIGHT = 76;
export const STANDING_FRAME_BOTTOM = 92;
export const STANDING_SPRITE_Y = RUNNER_GROUND_Y + (96 - STANDING_FRAME_BOTTOM);
export const STANDING_BODY_OFFSET_Y = STANDING_FRAME_BOTTOM - STANDING_BODY_HEIGHT;
export const SLIDING_BODY_WIDTH = 64;
export const SLIDING_BODY_HEIGHT = 48;
export const SLIDE_SCALE = 0.72;

// Opaque bottom edge (maxY + 1) of slide frames 01..03, measured at alpha > 20.
const SLIDE_FRAME_BOTTOM: Readonly<Record<CharacterId, number>> = {
  'player-default': 92,
  'goth-student': 92,
  'cogane-rang': 92,
  'hanayo-hiyori': 92,
  'tokino-mary': 92,
};

export function getSlidePose(characterId: CharacterId) {
  const opaqueBottom = SLIDE_FRAME_BOTTOM[characterId];
  const sourceBodyWidth = SLIDING_BODY_WIDTH / SLIDE_SCALE;
  const sourceBodyHeight = SLIDING_BODY_HEIGHT / SLIDE_SCALE;
  return {
    key: 'slide',
    spriteY: RUNNER_GROUND_Y + (96 - opaqueBottom) * SLIDE_SCALE,
    scaleX: SLIDE_SCALE,
    scaleY: SLIDE_SCALE,
    sourceBodyWidth,
    sourceBodyHeight,
    offsetX: (96 - sourceBodyWidth) / 2,
    offsetY: opaqueBottom - sourceBodyHeight,
  } as const;
}
