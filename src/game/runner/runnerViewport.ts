import { RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './runnerPose';

// Presentation only. Physics, spawn distances and checkpoint coordinates stay
// in the original 960×540 world. A modest zoom retains >90% of forward sight.
export const RUNNER_VIEWPORT = Object.freeze({ width: 960, height: 540, zoom: 1.05 });

export function getRunnerCameraFrame() {
  const { width, height, zoom } = RUNNER_VIEWPORT;
  const scrollX = (RUNNER_PLAYER_X - width / 2) * (1 - 1 / zoom);
  const scrollY = (RUNNER_GROUND_Y - height / 2) * (1 - 1 / zoom);
  return {
    zoom, scrollX, scrollY,
    left: scrollX + width / 2 * (1 - 1 / zoom),
    top: scrollY + height / 2 * (1 - 1 / zoom),
    visibleWidth: width / zoom,
    visibleHeight: height / zoom,
  };
}
