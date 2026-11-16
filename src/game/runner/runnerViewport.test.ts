import { describe, expect, it } from 'vitest';
import { RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './runnerPose';
import { getRunnerCameraFrame, RUNNER_VIEWPORT } from './runnerViewport';
import { RUNNER_CONFIG } from './runnerConfig';

describe('runner presentation camera', () => {
  const view = getRunnerCameraFrame();

  it('keeps the player lane and ground anchored without changing world coordinates', () => {
    const screenX = (RUNNER_PLAYER_X - view.scrollX - 480) * view.zoom + 480;
    const screenY = (RUNNER_GROUND_Y - view.scrollY - 270) * view.zoom + 270;
    expect(screenX).toBeCloseTo(RUNNER_PLAYER_X);
    expect(screenY).toBeCloseTo(RUNNER_GROUND_Y);
    expect(RUNNER_VIEWPORT.width / RUNNER_VIEWPORT.height).toBeCloseTo(16 / 9);
  });

  it('retains over 90% of the original forward sight and keeps ground artwork in view', () => {
    const sight = view.left + view.visibleWidth - RUNNER_PLAYER_X;
    expect(sight).toBeGreaterThan((960 - RUNNER_PLAYER_X) * .9);
    expect(view.top).toBeGreaterThan(0);
    expect(view.top + view.visibleHeight).toBeLessThanOrEqual(540);
    expect(view.top + view.visibleHeight).toBeGreaterThan(RUNNER_GROUND_Y + 50);
  });

  it('keeps the strongest double jump and enlarged artwork below the compact HUD band', () => {
    const normalApex = RUNNER_CONFIG.jumpImpulseY ** 2 / (2 * RUNNER_CONFIG.gravityY);
    // Rang's +12% second jump apex, plus generous 150px tall enlarged artwork.
    const top = RUNNER_GROUND_Y - normalApex * (1 + 1.12) - 150;
    const screenTop = (top - view.scrollY - 270) * view.zoom + 270;
    // Smallest tested landscape: 640×360, 8px total frame padding, 60px HUD.
    const hudWorldHeight = 60 / ((360 - 8) / 540);
    expect(screenTop).toBeGreaterThan(hudWorldHeight + 2);
  });
});
