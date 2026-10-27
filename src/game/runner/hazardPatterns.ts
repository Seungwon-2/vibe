import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type { HazardBand, HazardDefinition, HazardKind, HazardPattern } from './hazardTypes';

export const PATTERN_START_METERS = RUNNER_CONFIG.earlyPatternStartMeters;
// Retained for early-course callers; dense patterns use their own slot spacing.
export const PATTERN_SPACING_METERS = RUNNER_CONFIG.earlyPatternSpacingMeters;
export const METERS_PER_WORLD_UNIT = RUNNER_CONFIG.metersPerWorldUnit;
// Five shared gate bonuses plus Rin's additional 5-point passive.
export const MAX_RUN_SPEED_UNITS_PER_SECOND = RUNNER_CONFIG.maxSpeedUnitsPerSecond *
  (1 + (RUNNER_GATE_DISTANCES_M.length + 1) * RUNNER_CONFIG.gateSpeedBonusRatio);

const DENSE_WAVE_PERIOD_METERS =
  (RUNNER_CONFIG.densePatternsPerSection - 1) * RUNNER_CONFIG.densePatternSpacingMeters +
  RUNNER_CONFIG.denseRecoveryGapMeters;
const DENSE_WAVE_FIRST_METERS = RUNNER_CONFIG.denseSectionStartMeters;

function obstacle(id: string, kind: HazardKind, offsetMeters = 0): HazardDefinition {
  return {
    id, kind, offsetMeters,
    // Arcade overlap uses these boxes, independent of the decorative pixels.
    width: kind === 'ground' ? 46 : 64,
    height: kind === 'ground' ? 48 : 36,
    warningColor: kind === 'ground' ? '#ffcf6b' : '#8fe5f8',
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
    maxDistanceMeters: 6_000, patternIds: ['combo-jump', 'combo-slide'] },
  { id: 'advanced', minDistanceMeters: 6_000, maxDistanceMeters: null,
    patternIds: ['advanced-jump', 'advanced-slide'] },
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
  singleActionPattern('advanced-jump', 'ground', 6_000, null),
  singleActionPattern('advanced-slide', 'overhead', 6_000, null),
]);

export function isGateClearance(
  distanceMeters: number,
  gateDistanceMeters: number,
  objectHalfWidthMeters: number,
): boolean {
  return Math.abs(distanceMeters - gateDistanceMeters) <=
    RUNNER_CONFIG.gateClearanceMeters + Math.max(0, objectHalfWidthMeters);
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

  let waveIndex = Math.floor((distanceMeters - DENSE_WAVE_FIRST_METERS) / DENSE_WAVE_PERIOD_METERS);
  const waveStart = DENSE_WAVE_FIRST_METERS + waveIndex * DENSE_WAVE_PERIOD_METERS;
  let slotIndex = Math.floor((distanceMeters - waveStart) / RUNNER_CONFIG.densePatternSpacingMeters);
  if (slotIndex >= RUNNER_CONFIG.densePatternsPerSection) {
    waveIndex += 1;
    slotIndex = 0;
  }
  return (waveIndex + slotIndex) % 2 === 0 ? 'ground' : 'overhead';
}

function getPatternId(band: HazardBand, kind: HazardKind): string {
  return band.patternIds[kind === 'ground' ? 0 : 1];
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
  const earlyCount = Math.floor(
    (RUNNER_CONFIG.denseSectionStartMeters - RUNNER_CONFIG.earlyPatternStartMeters) /
      RUNNER_CONFIG.earlyPatternSpacingMeters,
  );
  if (patternIndex < earlyCount) {
    return RUNNER_CONFIG.earlyPatternStartMeters + patternIndex * RUNNER_CONFIG.earlyPatternSpacingMeters;
  }
  const denseSlotIndex = patternIndex - earlyCount;
  const waveIndex = Math.floor(denseSlotIndex / RUNNER_CONFIG.densePatternsPerSection);
  const slotIndex = denseSlotIndex % RUNNER_CONFIG.densePatternsPerSection;
  // Recovery starts after slot three; from first slot to next wave this is
  // two 300m gaps plus the configured 550m clear interval (1,150m total).
  return DENSE_WAVE_FIRST_METERS + waveIndex * DENSE_WAVE_PERIOD_METERS +
    slotIndex * RUNNER_CONFIG.densePatternSpacingMeters;
}

export function getHazardDistance(patternIndex: number, hazard: HazardDefinition): number {
  return getPatternStartDistance(patternIndex) + hazard.offsetMeters;
}
