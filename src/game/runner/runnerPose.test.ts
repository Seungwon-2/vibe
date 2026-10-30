import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { CHARACTERS, getCharacter } from '../characters/characterCatalog';
import { getQualitySpriteY, getSlidePose, getTerminalSpriteY, RUNNER_GROUND_Y, RUNNER_PLAYER_X,
  SLIDING_BODY_HEIGHT, SLIDING_BODY_WIDTH, STANDING_BODY_HEIGHT, STANDING_BODY_WIDTH } from './runnerPose';

async function getOpaqueBounds(file: string) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
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
  return { minX, minY, maxX, maxY };
}

function localAssetPath(url: string): string {
  return path.join(process.cwd(), 'public', url.replace(/^\//, ''));
}

describe('quality sprite alignment and collision sizing', () => {
  it('uses source-resolution motion frames and preserves shared gameplay hitboxes', () => {
    for (const character of CHARACTERS) {
      expect(character.qualityAnimations.run).toHaveLength(12);
      expect(character.qualityFrameSize).toBe(character.id === 'player-default' ? 192 : 384);
      expect(character.qualityScale * character.qualityFrameSize).toBe(96);
      expect(STANDING_BODY_WIDTH).toBe(40);
      expect(STANDING_BODY_HEIGHT).toBe(76);
      expect(SLIDING_BODY_WIDTH).toBeGreaterThanOrEqual(64);
      expect(SLIDING_BODY_HEIGHT).toBe(48);
    }
  });

  it('keeps terminal victory and game-over art on the ground line', async () => {
    for (const character of CHARACTERS) {
      for (const animation of ['victory', 'gameOver'] as const) {
        const frame = character.qualityAnimations[animation].at(-1)!;
        const bounds = await getOpaqueBounds(localAssetPath(frame.url));
        const scale = character.qualityScale;
        const bottom = getTerminalSpriteY(character.id) + (bounds.maxY + 1 - character.qualityFrameSize) * scale;
        expect(Math.abs(bottom - RUNNER_GROUND_Y), `${character.id}:${animation}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('keeps active quality slide frames grounded with the same world-space body bounds', async () => {
    for (const character of CHARACTERS) {
      const activeFrames = character.available
        ? character.qualityAnimations.slide.slice(2, 4)
        : character.qualityAnimations.slide.slice(1, 4);
      const pose = getSlidePose(character.id);
      const scale = character.qualityScale * pose.scaleY;
      const spriteY = getQualitySpriteY(character.id, pose.scaleY);
      for (const frame of activeFrames) {
        const bounds = await getOpaqueBounds(localAssetPath(frame.url));
        const visualBottom = spriteY + (bounds.maxY + 1 - character.qualityFrameSize) * scale;
        const visualLeft = RUNNER_PLAYER_X + (bounds.minX - character.qualityFrameSize / 2) * scale;
        const visualRight = RUNNER_PLAYER_X + (bounds.maxX + 1 - character.qualityFrameSize / 2) * scale;
        const bodyWidth = pose.bodyWidth;
        const bodyHeight = pose.sourceBodyHeight * pose.scaleY;
        expect(Math.abs(visualBottom - RUNNER_GROUND_Y), `${character.id}:${frame.url}`).toBeLessThanOrEqual(2);
        expect(bodyWidth).toBeGreaterThanOrEqual(64);
        expect(bodyHeight).toBeCloseTo(SLIDING_BODY_HEIGHT, 5);
        expect(visualRight).toBeGreaterThan(visualLeft);
        expect(pose.bodyWidth).toBeLessThanOrEqual(SLIDING_BODY_WIDTH);
      }
    }
  });

  it('positions every standing source frame from a shared feet pivot', async () => {
    for (const character of CHARACTERS) {
      const frame = character.qualityAnimations.run[0];
      const bounds = await getOpaqueBounds(localAssetPath(frame.url));
      const visualBottom = getQualitySpriteY(character.id) + (bounds.maxY + 1 - character.qualityFrameSize) * character.qualityScale;
      expect(Math.abs(visualBottom - RUNNER_GROUND_Y), character.id).toBeLessThanOrEqual(2);
      expect(getCharacter(character.id).qualityPivotY).toBe(character.qualityFrameSize === 192 ? 180 : 360);
    }
  });
});
