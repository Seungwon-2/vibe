import type { CharacterId } from '../characters/characterTypes';
import { getCharacter } from '../characters/characterCatalog';

export const RUNNER_GROUND_Y = 470;
export const RUNNER_PLAYER_X = 170;
export const STANDING_BODY_WIDTH = 40;
export const STANDING_BODY_HEIGHT = 76;
export const STANDING_FRAME_BOTTOM = 92;
export const STANDING_SPRITE_Y = RUNNER_GROUND_Y + (96 - STANDING_FRAME_BOTTOM);
export const STANDING_BODY_OFFSET_Y = STANDING_FRAME_BOTTOM - STANDING_BODY_HEIGHT;

export function getQualitySpriteY(characterId: CharacterId, poseScale = 1): number {
  const character = getCharacter(characterId);
  const scale = character.qualityScale * poseScale;
  return RUNNER_GROUND_Y + (character.qualityFrameSize - character.qualityPivotY) * scale;
}

export function getTerminalSpriteY(characterId: CharacterId): number {
  return getQualitySpriteY(characterId);
}
export const SLIDING_BODY_WIDTH = 80;
export const SLIDING_BODY_HEIGHT = 48;

// Opaque bottom edge (maxY + 1) of the active slide frames, measured at alpha > 20.
const SLIDE_FRAME_BOTTOM: Readonly<Record<CharacterId, number>> = {
  'player-default': 90,
  'goth-student': 89,
  'cogane-rang': 89,
  'hanayo-hiyori': 89,
  'tokino-mary': 89,
};

export function getSlidePose(characterId: CharacterId) {
  const opaqueBottom = SLIDE_FRAME_BOTTOM[characterId];
  const bodyWidth = characterId === 'goth-student' ? 64 : SLIDING_BODY_WIDTH;
  return {
    key: 'slide',
    spriteY: RUNNER_GROUND_Y + 96 - opaqueBottom,
    scaleX: 1,
    scaleY: 1,
    bodyWidth,
    sourceBodyWidth: bodyWidth,
    sourceBodyHeight: SLIDING_BODY_HEIGHT,
    offsetX: (96 - bodyWidth) / 2,
    offsetY: opaqueBottom - SLIDING_BODY_HEIGHT,
  } as const;
}
