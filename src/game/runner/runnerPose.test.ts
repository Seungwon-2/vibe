import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import type { CharacterId } from '../characters/characterTypes';
import { getSlidePose, RUNNER_GROUND_Y, RUNNER_PLAYER_X,
  SLIDING_BODY_HEIGHT, SLIDING_BODY_WIDTH } from './runnerPose';

const characters: readonly { id: CharacterId; prefix: string }[] = [
  { id: 'player-default', prefix: '' },
  { id: 'goth-student', prefix: 'goth-student-' },
  { id: 'moonwing', prefix: 'moonwing-' },
  { id: 'akane-lize', prefix: 'akane-lize-' },
];

describe('slide art and collision alignment', () => {
  it('places both real slide frames of all four characters on the floor and inside the slide box', async () => {
    for (const character of characters) {
      for (const index of [0, 1]) {
        const frameName = `${character.prefix}slide-0${index}`;
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
        const pose = getSlidePose(character.id, frameName);
        const visualTop = pose.spriteY + (minY - 96) * pose.scaleY;
        const visualBottom = pose.spriteY + (maxY + 1 - 96) * pose.scaleY;
        const visualLeft = RUNNER_PLAYER_X + (minX - 48) * pose.scaleX;
        const visualRight = RUNNER_PLAYER_X + (maxX + 1 - 48) * pose.scaleX;
        const bodyTop = pose.spriteY + (pose.offsetY - 96) * pose.scaleY;
        const bodyBottom = bodyTop + pose.sourceBodyHeight * pose.scaleY;
        expect(visualBottom).toBeCloseTo(RUNNER_GROUND_Y, 5);
        expect(visualTop).toBeGreaterThanOrEqual(RUNNER_GROUND_Y - SLIDING_BODY_HEIGHT);
        expect(visualLeft).toBeGreaterThanOrEqual(RUNNER_PLAYER_X - SLIDING_BODY_WIDTH / 2);
        expect(visualRight).toBeLessThanOrEqual(RUNNER_PLAYER_X + SLIDING_BODY_WIDTH / 2);
        expect(bodyTop).toBeCloseTo(430, 5);
        expect(bodyBottom).toBeCloseTo(RUNNER_GROUND_Y, 5);
      }
    }
  });
});
