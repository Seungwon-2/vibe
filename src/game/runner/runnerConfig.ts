export const RUNNER_CONFIG = Object.freeze({
  countdownMs: 3_000,
  initialTimerMs: 90_000,
  maxTimerMs: 120_000,
  timePickupMs: 3_000,
  gateBonusMs: 20_000,
  initialSpeedUnitsPerSecond: 250,
  maxSpeedUnitsPerSecond: 325,
  speedRampMs: 90_000,
  metersPerWorldUnit: 1 / 3,
  collisionPenaltyMs: 5_000,
  staggerMs: 1_200,
  protectionMs: 1_200,
} as const);

export const RUNNER_GATE_DISTANCES_M = Object.freeze([2_500, 5_000, 7_500] as const);
