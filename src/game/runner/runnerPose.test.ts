import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { getCharacter } from '../characters/characterCatalog';
import type { CharacterId } from '../characters/characterTypes';
import { getSlidePose, RUNNER_GROUND_Y, RUNNER_PLAYER_X,
  SLIDING_BODY_HEIGHT, SLIDING_BODY_WIDTH, STANDING_FRAME_BOTTOM,
  STANDING_SPRITE_Y } from './runnerPose';

const characters: readonly { id: CharacterId; prefix: string }[] = [
  { id: 'player-default', prefix: '' },
  { id: 'goth-student', prefix: 'goth-student-' },
  { id: 'cogane-rang', prefix: 'cogane-rang-' },
  { id: 'hanayo-hiyori', prefix: 'hanayo-hiyori-' },
  { id: 'tokino-mary', prefix: 'tokino-mary-' },
];

describe('slide art and collision alignment', () => {
  it('places the padded standing art on the physical floor', () => {
    expect(STANDING_SPRITE_Y + STANDING_FRAME_BOTTOM - 96).toBe(RUNNER_GROUND_Y);
  });

  it('places every active slide frame on the floor at its intended scale', async () => {
    for (const character of characters) {
      const available = getCharacter(character.id).available;
      for (const frameIndex of available ? [2, 3] : [1, 2, 3]) {
        const frameName = `${character.prefix}slide-0${frameIndex}`;
        const file = path.join(process.cwd(), 'assets/character/runtime/frames', `${frameName}.png`);
        const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        let minX = 96;
        let minY = 96;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < info.height; y += 1) {
          for (let x = 0; x < info.width; x += 1) {
            if (data[(y * info.width + x) * 4 + 3] <= 20) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
        const pose = getSlidePose(character.id);
        const visualTop = pose.spriteY + (minY - 96) * pose.scaleY;
        const visualBottom = pose.spriteY + (maxY + 1 - 96) * pose.scaleY;
        const visualLeft = RUNNER_PLAYER_X + (minX - 48) * pose.scaleX;
        const visualRight = RUNNER_PLAYER_X + (maxX + 1 - 48) * pose.scaleX;
        const bodyTop = pose.spriteY + (pose.offsetY - 96) * pose.scaleY;
        const bodyBottom = bodyTop + pose.sourceBodyHeight * pose.scaleY;
        expect(Math.abs(visualBottom - RUNNER_GROUND_Y)).toBeLessThanOrEqual(1);
        expect(pose.scaleX).toBe(pose.scaleY);
        if (available) {
          expect(pose.scaleX).toBe(1);
          expect(visualTop).toBeGreaterThanOrEqual(RUNNER_GROUND_Y - SLIDING_BODY_HEIGHT);
          expect(visualLeft).toBeGreaterThanOrEqual(RUNNER_PLAYER_X - SLIDING_BODY_WIDTH / 2);
          expect(visualRight).toBeLessThanOrEqual(RUNNER_PLAYER_X + SLIDING_BODY_WIDTH / 2);
        }
        expect(pose.sourceBodyWidth * pose.scaleX).toBeCloseTo(pose.bodyWidth, 5);
        expect(bodyTop).toBeCloseTo(422, 5);
        expect(bodyBottom).toBeCloseTo(RUNNER_GROUND_Y, 5);
      }
    }
  });
});
