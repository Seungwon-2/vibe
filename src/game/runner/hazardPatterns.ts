import { ENDLESS_GATE_INTERVAL_METERS, isEndlessGateClearance, RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import { getCharacterPassive } from '../characters/characterAbilities';
import type { HazardBand, HazardDefinition, HazardKind, HazardPattern } from './hazardTypes';

export const PATTERN_START_METERS = RUNNER_CONFIG.earlyPatternStartMeters;
// Retained for early-course callers; dense patterns use their own slot spacing.
export const PATTERN_SPACING_METERS = RUNNER_CONFIG.earlyPatternSpacingMeters;
export const METERS_PER_WORLD_UNIT = RUNNER_CONFIG.metersPerWorldUnit;
// Gate bonuses stack additively; Rin's passive multiplies the resulting speed.
const RIN_SPEED_BONUS = getCharacterPassive('player-default');
export const MAX_RUN_SPEED_UNITS_PER_SECOND = RUNNER_CONFIG.maxSpeedUnitsPerSecond *
  (1 + RUNNER_GATE_DISTANCES_M.length * RUNNER_CONFIG.gateSpeedBonusRatio) *
  (RIN_SPEED_BONUS.id === 'rin-speed' ? 1 + RIN_SPEED_BONUS.speedBonusRatio : 1);

export function getMaximumRunSpeedUnitsPerSecond(distanceMeters: number): number {
  const passedGateCount = Math.max(0, Math.floor(distanceMeters / ENDLESS_GATE_INTERVAL_METERS));
  return RUNNER_CONFIG.maxSpeedUnitsPerSecond * (1 + passedGateCount * RUNNER_CONFIG.gateSpeedBonusRatio) *
    (RIN_SPEED_BONUS.id === 'rin-speed' ? 1 + RIN_SPEED_BONUS.speedBonusRatio : 1);
}

const DENSE_WAVE_FIRST_METERS = RUNNER_CONFIG.denseSectionStartMeters;

function getDenseDifficultyTier(waveIndex: number): number {
  return Math.floor(waveIndex / RUNNER_CONFIG.endlessDenseWavesPerDifficultyTier);
}

function getDensePatternSpacing(waveIndex: number): number {
  return Math.max(RUNNER_CONFIG.endlessDenseSpacingFloorMeters,
    RUNNER_CONFIG.densePatternSpacingMeters - getDenseDifficultyTier(waveIndex) *
      RUNNER_CONFIG.endlessDenseSpacingDecreasePerTierMeters);
}

function getDenseRecoveryGap(waveIndex: number): number {
  if ((waveIndex + 1) % RUNNER_CONFIG.endlessDenseWidePitRecoveryIntervalWaves === 0) {
    return RUNNER_CONFIG.endlessDenseWidePitRecoveryGapMeters;
  }
  return Math.max(RUNNER_CONFIG.endlessDenseRecoveryFloorMeters,
    RUNNER_CONFIG.denseRecoveryGapMeters - getDenseDifficultyTier(waveIndex) *
      RUNNER_CONFIG.endlessDenseRecoveryDecreasePerTierMeters);
}

export function getDenseWaveSchedule(waveIndex: number): Readonly<{
  waveStartMeters: number;
  patternDistances: readonly number[];
  nextWaveStartMeters: number;
}> {
  if (!Number.isInteger(waveIndex) || waveIndex < 0) {
    throw new RangeError('Wave index must be a non-negative integer');
  }
  let waveStartMeters: number = DENSE_WAVE_FIRST_METERS;
  for (let index = 0; index < waveIndex; index += 1) {
    waveStartMeters += getDensePatternSpacing(index) * (RUNNER_CONFIG.densePatternsPerSection - 1) +
      getDenseRecoveryGap(index);
  }
  const spacing = getDensePatternSpacing(waveIndex);
  const patternDistances = [waveStartMeters];
  for (let slot = 1; slot < RUNNER_CONFIG.densePatternsPerSection; slot += 1) {
    patternDistances.push(patternDistances[slot - 1] + spacing);
  }
  const recovery = getDenseRecoveryGap(waveIndex);
  return Object.freeze({
    waveStartMeters,
    patternDistances: Object.freeze(patternDistances),
    nextWaveStartMeters: patternDistances.at(-1)! + recovery,
  });
}

function obstacle(id: string, kind: HazardKind, offsetMeters = 0): HazardDefinition {
  return {
    id, kind, offsetMeters,
    // Arcade overlap uses these boxes, independent of the decorative pixels.
    width: kind === 'ground' ? 46 : kind === 'double-jump'
      ? RUNNER_CONFIG.doubleJumpBarrierWidthPx : 64,
    height: kind === 'ground' ? 48 : kind === 'double-jump'
      ? RUNNER_CONFIG.doubleJumpBarrierHeightPx : 36,
    warningColor: kind === 'ground' ? '#ffcf6b' : kind === 'double-jump' ? '#ff9a66' : '#8fe5f8',
  };
}

function singleActionPattern(id: string, kind: HazardKind, min: number, max: number | null): HazardPattern {
  return { id, minDistanceMeters: min, maxDistanceMeters: max,
    obstacles: [obstacle(kind === 'ground' ? 'low-crate' : 'high-bar', kind)] };
}

export const HAZARD_BANDS: readonly HazardBand[] = Object.freeze([
  { id: 'tutorial', minDistanceMeters: 0, maxDistanceMeters: RUNNER_CONFIG.tutorialEndMeters,
    patternIds: ['tutorial-jump', 'tutorial-slide'] },
  { id: 'practice', minDistanceMeters: RUNNER_CONFIG.tutorialEndMeters,
    maxDistanceMeters: RUNNER_CONFIG.practiceEndMeters, patternIds: ['practice-jump', 'practice-slide'] },
  { id: 'combination', minDistanceMeters: RUNNER_CONFIG.denseSectionStartMeters,
    maxDistanceMeters: 6_000, patternIds: ['combo-jump', 'combo-slide', 'combo-double-jump'] },
  { id: 'advanced', minDistanceMeters: 6_000, maxDistanceMeters: null,
    patternIds: ['advanced-jump', 'advanced-slide', 'advanced-double-jump'] },
]);

export const HAZARD_PATTERNS: readonly HazardPattern[] = Object.freeze([
  singleActionPattern('tutorial-jump', 'ground', 0, RUNNER_CONFIG.tutorialEndMeters),
  singleActionPattern('tutorial-slide', 'overhead', 0, RUNNER_CONFIG.tutorialEndMeters),
  singleActionPattern('practice-jump', 'ground', RUNNER_CONFIG.tutorialEndMeters,
    RUNNER_CONFIG.practiceEndMeters),
  singleActionPattern('practice-slide', 'overhead', RUNNER_CONFIG.tutorialEndMeters,
    RUNNER_CONFIG.practiceEndMeters),
  singleActionPattern('combo-jump', 'ground', RUNNER_CONFIG.denseSectionStartMeters, 6_000),
  singleActionPattern('combo-slide', 'overhead', RUNNER_CONFIG.denseSectionStartMeters, 6_000),
  singleActionPattern('combo-double-jump', 'double-jump', RUNNER_CONFIG.denseSectionStartMeters, 6_000),
  singleActionPattern('advanced-jump', 'ground', 6_000, null),
  singleActionPattern('advanced-slide', 'overhead', 6_000, null),
  singleActionPattern('advanced-double-jump', 'double-jump', 6_000, null),
]);

export function isGateClearance(
  distanceMeters: number,
  gateDistanceMeters: number,
  objectHalfWidthMeters: number,
): boolean {
  return Math.abs(distanceMeters - gateDistanceMeters) <=
    RUNNER_CONFIG.gateClearanceMeters + Math.max(0, objectHalfWidthMeters);
}

export function isEndlessGateClearanceForObject(distanceMeters: number, objectHalfWidthMeters: number): boolean {
  return isEndlessGateClearance(distanceMeters, objectHalfWidthMeters);
}

function getBandForDistance(distanceMeters: number): HazardBand {
  return HAZARD_BANDS.find(({ minDistanceMeters, maxDistanceMeters }) =>
    distanceMeters >= minDistanceMeters && (maxDistanceMeters === null || distanceMeters < maxDistanceMeters),
  ) ?? HAZARD_BANDS[0];
}

function getScheduledKind(distanceMeters: number): HazardKind {
  if (distanceMeters === RUNNER_CONFIG.tutorialSlideDistanceMeters) return 'overhead';
  if (distanceMeters < DENSE_WAVE_FIRST_METERS) {
    const earlyIndex = Math.max(0, Math.floor(
      (distanceMeters - RUNNER_CONFIG.earlyPatternStartMeters) / RUNNER_CONFIG.earlyPatternSpacingMeters,
    ));
    return earlyIndex % 2 === 0 ? 'ground' : 'overhead';
  }

  let waveIndex = 0;
  let wave = getDenseWaveSchedule(waveIndex);
  while (distanceMeters >= wave.nextWaveStartMeters) {
    waveIndex += 1;
    wave = getDenseWaveSchedule(waveIndex);
  }
  const slotIndex = wave.patternDistances.reduce((slot, start, index) =>
    distanceMeters >= start ? index : slot, 0);
  if (waveIndex >= 3 && (waveIndex - 3) % 4 === 0) {
    const doubleJumpSlots = [0, 1, 2, 1] as const;
    const rotation = Math.floor((waveIndex - 3) / 4) % doubleJumpSlots.length;
    if (slotIndex === doubleJumpSlots[rotation]) return 'double-jump';
  }
  return (waveIndex + slotIndex) % 2 === 0 ? 'ground' : 'overhead';
}

function getPatternId(band: HazardBand, kind: HazardKind): string {
  return band.patternIds[kind === 'ground' ? 0 : kind === 'overhead' ? 1 : 2];
}

export function getPatternForDistance(distanceMeters: number): HazardPattern {
  const band = getBandForDistance(distanceMeters);
  const kind = getScheduledKind(distanceMeters);
  const id = getPatternId(band, kind);
  const pattern = HAZARD_PATTERNS.find((item) => item.id === id);
  if (!pattern) throw new Error(`Unknown hazard pattern: ${id}`);
  return pattern;
}

export function getPatternStartDistance(patternIndex: number): number {
  if (!Number.isInteger(patternIndex) || patternIndex < 0) {
    throw new RangeError('Pattern index must be a non-negative integer');
  }
  if (patternIndex === 1) return RUNNER_CONFIG.tutorialSlideDistanceMeters;
  const earlyCount = Math.ceil(
    (RUNNER_CONFIG.denseSectionStartMeters - RUNNER_CONFIG.earlyPatternStartMeters) /
      RUNNER_CONFIG.earlyPatternSpacingMeters,
  );
  if (patternIndex < earlyCount) {
    return RUNNER_CONFIG.earlyPatternStartMeters + patternIndex * RUNNER_CONFIG.earlyPatternSpacingMeters;
  }
  const denseSlotIndex = patternIndex - earlyCount;
  const waveIndex = Math.floor(denseSlotIndex / RUNNER_CONFIG.densePatternsPerSection);
  const slotIndex = denseSlotIndex % RUNNER_CONFIG.densePatternsPerSection;
  return getDenseWaveSchedule(waveIndex).patternDistances[slotIndex];
}

export function getHazardDistance(patternIndex: number, hazard: HazardDefinition): number {
  return getPatternStartDistance(patternIndex) + hazard.offsetMeters;
}
