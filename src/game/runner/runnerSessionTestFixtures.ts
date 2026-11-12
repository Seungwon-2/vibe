import type { RunnerEngineCheckpoint } from './runnerSessionTypes';

export function createRunnerEngineCheckpoint(): RunnerEngineCheckpoint {
  return {
    version: 1,
    player: {
      x: 120, y: 420, velocityX: 0, velocityY: 0,
      bodyWidth: 42, bodyHeight: 58, bodySourceWidth: 42, bodySourceHeight: 58,
      bodyOffsetX: 0, bodyOffsetY: 0, scaleX: 1, scaleY: 1, alpha: 1,
      allowGravity: true, bodyEnabled: true, grounded: true, jumpsUsed: 0,
      slidingHeld: false, hurt: false, passiveRescuing: false, pitFalling: false,
      passiveEffectActive: false, giantActive: false, airPhase: 'ascending',
      animation: 'run', animationFrame: 0, animationElapsedMs: 0,
    },
    worldDistance: 0,
    randomSeed: 0,
    obstacleCursor: 0,
    obstaclePending: [],
    obstacleWarnedKinds: [],
    obstacleSkipPatternAfterDoubleJump: false,
    pickupCursor: 0,
    pickupHorizonMeters: 0,
    pickupStageId: null,
    createdGateDistances: [],
    pitCursor: 0,
    entities: [],
    collectedPickupIds: [],
    passedGateIds: [],
  };
}
