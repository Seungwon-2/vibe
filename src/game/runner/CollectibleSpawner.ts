import type Phaser from 'phaser';
import { getCharacterPassive } from '../characters/characterAbilities';
import type { CharacterId } from '../characters/characterTypes';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type { RunnerPickupKind, RunnerSnapshot, StoryStageId } from './runnerTypes';
import { getDenseWaveSchedule, getHazardDistance, getPatternForDistance, getPatternStartDistance,
  isGateClearance, MAX_RUN_SPEED_UNITS_PER_SECOND, METERS_PER_WORLD_UNIT } from './hazardPatterns';
import { RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './RunnerPlayer';
import { getBiomeById, getBiomeForDistance, type RunnerBiomeDefinition } from '../visuals/runnerBiomes';
import { getStoryStage } from './storyConfig';
import { getStoryHazardSchedule } from './storyCourses';
import { drawRunnerGate, drawRunnerGoal } from '../visuals/runnerCourseObjects';
import { getPitDefinitions, isPitClearance, type PitDefinition } from './PitSpawner';
import { getStoryPitDefinitions } from './storyPitSchedule';
import { getHazardGeometry } from './CollisionSystem';
import type { HazardDefinition } from './hazardTypes';
import { boundsCenter, getCollisionBounds, sweptAabbIntersects, type CollisionBounds } from './sweptCollision';
import type { RunnerEngineCheckpoint, RunnerWorldEntityCheckpoint } from './runnerSessionTypes';

export type PickupDefinition = Readonly<{
  id: string;
  kind: RunnerPickupKind;
  distanceMeters: number;
  heightUnits: number;
  optionalJump: boolean;
  guideAction?: 'jump' | 'slide';
  guideHazardId?: string;
  motifId?: CoinMotifId;
  motifSectionId?: string;
}>;

export type CoinMotifId = 'star' | 'flower' | 'music-note' | 'cloud';
export type MotifPoint = Readonly<{ x: number; y: number }>;

const COIN_MOTIF_BY_BIOME = Object.freeze({
  'dawn-city': 'star',
  'moonlit-forest': 'flower',
  'crystal-mine': 'music-note',
  'cloud-skyway': 'cloud',
} as const satisfies Readonly<Record<RunnerBiomeDefinition['id'], CoinMotifId>>);

/** Stable normalized outlines used to lay out collectible coin formations. */
export function getCoinMotifPoints(motifId: CoinMotifId): readonly MotifPoint[] {
  const points: readonly MotifPoint[] = {
    star: [
      { x: 0.50, y: 0.98 }, { x: 0.61, y: 0.64 }, { x: 0.96, y: 0.62 },
      { x: 0.68, y: 0.42 }, { x: 0.79, y: 0.08 }, { x: 0.50, y: 0.29 },
      { x: 0.21, y: 0.08 }, { x: 0.32, y: 0.42 }, { x: 0.04, y: 0.62 },
      { x: 0.39, y: 0.64 },
    ],
    flower: [
      { x: 0.50, y: 0.98 }, { x: 0.62, y: 0.73 }, { x: 0.88, y: 0.84 },
      { x: 0.77, y: 0.58 }, { x: 0.98, y: 0.40 }, { x: 0.70, y: 0.38 },
      { x: 0.62, y: 0.08 }, { x: 0.40, y: 0.27 }, { x: 0.22, y: 0.16 },
      { x: 0.30, y: 0.45 }, { x: 0.04, y: 0.56 }, { x: 0.31, y: 0.72 },
      { x: 0.50, y: 0.48 }, { x: 0.82, y: 0.52 }, { x: 0.57, y: 0.65 },
      { x: 0.43, y: 0.65 }, { x: 0.38, y: 0.53 },
    ],
    'music-note': [
      { x: 0.05, y: 0.12 }, { x: 0.15, y: 0.04 }, { x: 0.26, y: 0.12 },
      { x: 0.20, y: 0.28 }, { x: 0.08, y: 0.32 }, { x: 0.48, y: 0.28 },
      { x: 0.58, y: 0.20 }, { x: 0.70, y: 0.29 }, { x: 0.64, y: 0.44 },
      { x: 0.52, y: 0.47 }, { x: 0.26, y: 0.62 }, { x: 0.26, y: 0.98 },
      { x: 0.70, y: 0.70 }, { x: 0.70, y: 0.98 },
      { x: 0.83, y: 0.80 },
    ],
    cloud: [
      { x: 0.05, y: 0.28 }, { x: 0.10, y: 0.46 }, { x: 0.20, y: 0.52 },
      { x: 0.29, y: 0.76 }, { x: 0.42, y: 0.84 }, { x: 0.53, y: 0.68 },
      { x: 0.66, y: 0.93 }, { x: 0.80, y: 0.81 }, { x: 0.84, y: 0.57 },
      { x: 0.96, y: 0.49 }, { x: 0.92, y: 0.28 }, { x: 0.76, y: 0.20 },
      { x: 0.57, y: 0.18 }, { x: 0.37, y: 0.20 }, { x: 0.18, y: 0.20 },
    ],
  }[motifId];
  return Object.freeze(points.map((point) => Object.freeze({ ...point })));
}

type GiantChallengeTarget = Readonly<{ startMeters: number; endMeters: number }>;

export function drawPickupArt(
  art: Phaser.GameObjects.Graphics,
  kind: RunnerPickupKind,
  biome: ReturnType<typeof getBiomeForDistance>,
): void {
  const { palette: p } = biome;
  if (kind === 'coin') {
    art.fillStyle(p.pickupCoin).fillCircle(0, 0, 11);
    art.lineStyle(2, p.hazardContrast, 0.96).strokeCircle(0, 0, 11);
    art.fillStyle(p.accent).fillCircle(0, 0, 7);
    art.lineStyle(1.5, p.hazardContrast, 0.9);
    switch (biome.id) {
      case 'dawn-city':
        art.lineBetween(-4, 2, 4, 2).lineBetween(-2, -1, 0, -4).lineBetween(0, -4, 2, -1);
        break;
      case 'moonlit-forest':
        art.fillStyle(p.hazardContrast).fillEllipse(0, 0, 8, 5);
        art.lineStyle(1, p.groundFace).lineBetween(-3, 2, 3, -2);
        break;
      case 'crystal-mine':
        art.fillStyle(p.hazardContrast).fillTriangle(-4, 3, 0, -4, 4, 3);
        art.fillStyle(p.accent).fillTriangle(-1, 2, 0, -2, 2, 2);
        break;
      case 'cloud-skyway':
        art.fillStyle(p.hazardContrast).fillTriangle(-1, -4, 1, -1, 0, 0)
          .fillTriangle(4, -1, 1, 1, 0, 0).fillTriangle(1, 4, -1, 1, 0, 0)
          .fillTriangle(-4, 1, -1, -1, 0, 0);
        break;
    }
    return;
  }

  if (kind === 'giant') {
    // A pink comet trail sits behind the larger, pointed purple star.
    art.fillStyle(GIANT_PICKUP_PINK, 0.96)
      .fillTriangle(-8, 4, -23, 16, -5, 12)
      .fillTriangle(-6, 1, -17, 13, -3, 8);
    art.lineStyle(2, GIANT_PICKUP_OUTLINE, 1)
      .lineBetween(-8, 4, -23, 16)
      .lineBetween(-23, 16, -5, 12);

    // Eight triangular wedges form one four-point star without a coin-like disc.
    art.fillStyle(GIANT_PICKUP_PURPLE, 1)
      .fillTriangle(0, 0, -4, -4, 0, -18)
      .fillTriangle(0, 0, 0, -18, 4, -4)
      .fillTriangle(0, 0, 4, -4, 18, 0)
      .fillTriangle(0, 0, 18, 0, 4, 4)
      .fillTriangle(0, 0, 4, 4, 0, 18)
      .fillTriangle(0, 0, 0, 18, -4, 4)
      .fillTriangle(0, 0, -4, 4, -18, 0)
      .fillTriangle(0, 0, -18, 0, -4, -4);
    art.lineStyle(2, GIANT_PICKUP_OUTLINE, 1)
      .lineBetween(0, -18, 4, -4)
      .lineBetween(4, -4, 18, 0)
      .lineBetween(18, 0, 4, 4)
      .lineBetween(4, 4, 0, 18)
      .lineBetween(0, 18, -4, 4)
      .lineBetween(-4, 4, -18, 0)
      .lineBetween(-18, 0, -4, -4)
      .lineBetween(-4, -4, 0, -18);
    return;
  }

  if (kind === 'speed') {
    // A cool-blue lightning bolt is visually separate from the warm coin and
    // the violet-pink giant comet pickup.
    art.fillStyle(0x68d8ff, 1)
      .fillTriangle(2, -19, -11, 1, -1, 1)
      .fillTriangle(-1, -1, 11, -1, -7, 19);
    art.lineStyle(2.5, 0x123d70, 1)
      .lineBetween(2, -19, -11, 1)
      .lineBetween(-11, 1, -1, 1)
      .lineBetween(-1, 1, -7, 19)
      .lineBetween(-7, 19, 11, -1)
      .lineBetween(11, -1, -1, -1);
    art.lineStyle(1.5, 0xffffff, 0.95)
      .lineBetween(1, -13, -7, 0)
      .lineBetween(-7, 0, -1, 0);
    return;
  }

  art.fillStyle(p.pickupTime).fillTriangle(0, -11, 10, 0, 0, 11)
    .fillTriangle(0, -11, 0, 11, -10, 0);
  art.lineStyle(2, p.hazardContrast, 0.96).lineBetween(0, -11, 10, 0)
    .lineBetween(10, 0, 0, 11).lineBetween(0, 11, -10, 0).lineBetween(-10, 0, 0, -11);
  art.fillStyle(p.groundFace).fillCircle(0, 0, 5);
  art.lineStyle(1.5, p.hazardContrast, 0.96).strokeCircle(0, 0, 5)
    .lineBetween(0, -3, 0, 0).lineBetween(0, 0, 2.5, 1.5);
  art.fillStyle(p.accent).fillCircle(7, -7, 2);
}

// Keep pickups away from the physical edge of each pit in addition to its width.
export const PICKUP_PIT_CLEARANCE_METERS = 40;
const PICKUP_VISUAL_MARGIN_PX = 12;
const PICKUP_ART_RADIUS_PX = 11;
const PICKUP_BASE_RADIUS_PX = 32;
const ENDLESS_PICKUP_SCHEDULE_CHUNK_METERS = 5_000;
const ENDLESS_PICKUP_SCHEDULE_LOOKAHEAD_METERS = 2_000;

// The standing-height row is frequent and predictable; elevated coins remain
// optional and can be skipped when the authored course has no safe placement.
const SAFE_PICKUP_START_METERS = 160;
const GIANT_PICKUP_PURPLE = 0x9b5de5;
const GIANT_PICKUP_PINK = 0xff77b7;
const GIANT_PICKUP_OUTLINE = 0xffffff;

function getPowerUpClearanceMeters(kind: 'giant' | 'speed'): number {
  const durationMs = kind === 'giant' ? RUNNER_CONFIG.giantDurationMs : RUNNER_CONFIG.speedPickupDurationMs;
  return Math.ceil(MAX_RUN_SPEED_UNITS_PER_SECOND * RUNNER_CONFIG.metersPerWorldUnit *
    RUNNER_CONFIG.speedPickupMultiplier * durationMs / 1_000) + RUNNER_CONFIG.powerUpPickupRecoveryMeters;
}

function hasPowerUpSpacing(
  candidateMeters: number,
  candidateKind: 'giant' | 'speed',
  pickups: readonly PickupDefinition[],
): boolean {
  return pickups.every((pickup) => {
    if (pickup.kind !== 'giant' && pickup.kind !== 'speed') return true;
    const gap = candidateMeters - pickup.distanceMeters;
    return gap >= 0
      ? gap >= getPowerUpClearanceMeters(pickup.kind)
      : -gap >= getPowerUpClearanceMeters(candidateKind);
  });
}

type ScheduledHazard = Readonly<{ distanceMeters: number; definition: HazardDefinition; patternIndex: number; id: string }>;

function hasPickupVisualClearance(existing: PickupDefinition, candidate: PickupDefinition): boolean {
  const clearance = existing.kind === 'giant' || candidate.kind === 'giant'
    ? RUNNER_CONFIG.pickupObjectClearanceMeters
    : existing.kind === 'speed' || candidate.kind === 'speed'
      ? RUNNER_CONFIG.speedPickupClearanceMeters
    : RUNNER_CONFIG.pickupCoinVisualClearanceMeters;
  return Math.abs(existing.distanceMeters - candidate.distanceMeters) >= clearance;
}

function getScheduledHazards(maxDistanceMeters: number, storyStageId: StoryStageId | null): ScheduledHazard[] {
  if (storyStageId) {
    return getStoryHazardSchedule(storyStageId)
      .filter(({ distanceMeters }) => distanceMeters <= maxDistanceMeters)
      .map(({ distanceMeters, definition, id }, patternIndex) => ({ distanceMeters, definition, patternIndex, id }));
  }
  const hazards: ScheduledHazard[] = [];
  for (let patternIndex = 0; ; patternIndex += 1) {
    const patternStart = getPatternStartDistance(patternIndex);
    if (patternStart > maxDistanceMeters) break;
    const pattern = getPatternForDistance(patternStart);
    for (const hazard of pattern.obstacles) {
      hazards.push({ distanceMeters: getHazardDistance(patternIndex, hazard), definition: hazard, patternIndex,
        id: `endless-${patternIndex}-${hazard.id}` });
    }
  }
  return hazards;
}

function isPickupDistanceSafe(
  distanceMeters: number,
  heightUnits: number,
  hazards: readonly ScheduledHazard[],
  pits: readonly PitDefinition[],
  slideGuideHazardId?: string,
): boolean {
  const pickupHalfExtentPx = Math.max(getPickupBodySize() / 2, PICKUP_ART_RADIUS_PX);
  const pickupCenterY = RUNNER_GROUND_Y - heightUnits;
  const pickupTop = pickupCenterY - pickupHalfExtentPx - PICKUP_VISUAL_MARGIN_PX;
  const pickupBottom = pickupCenterY + pickupHalfExtentPx + PICKUP_VISUAL_MARGIN_PX;
  const pickupHalfWidthMeters = (pickupHalfExtentPx + PICKUP_VISUAL_MARGIN_PX) *
    RUNNER_CONFIG.metersPerWorldUnit;

  for (const hazard of hazards) {
    const geometry = getHazardGeometry(hazard.definition, 0);
    if (hazard.id === slideGuideHazardId) {
      const artTop = pickupCenterY - PICKUP_ART_RADIUS_PX;
      const artBottom = pickupCenterY + PICKUP_ART_RADIUS_PX;
      if (hazard.definition.kind !== 'overhead' || artTop < geometry.y + geometry.height + 6 ||
          artBottom > RUNNER_GROUND_Y) return false;
      continue;
    }
    const hazardTop = geometry.y - PICKUP_VISUAL_MARGIN_PX;
    const hazardBottom = geometry.y + geometry.height + PICKUP_VISUAL_MARGIN_PX;
    const verticalOverlap = pickupTop <= hazardBottom && pickupBottom >= hazardTop;
    if (!verticalOverlap) continue;
    const hazardHalfWidthMeters = (hazard.definition.width / 2 + PICKUP_VISUAL_MARGIN_PX) *
      RUNNER_CONFIG.metersPerWorldUnit;
    if (Math.abs(distanceMeters - hazard.distanceMeters) <=
      pickupHalfWidthMeters + hazardHalfWidthMeters) return false;
  }

  if (pits.some((pit) =>
    isPitClearance(distanceMeters, pit, PICKUP_PIT_CLEARANCE_METERS + pickupHalfWidthMeters))) return false;
  return RUNNER_GATE_DISTANCES_M.every((gate) =>
    !isGateClearance(distanceMeters, gate, pickupHalfWidthMeters));
}

function nearestSafeDistance(
  targetMeters: number,
  minimumMeters: number,
  maximumMeters: number,
  hazards: readonly ScheduledHazard[],
  pits: readonly PitDefinition[],
): number | undefined {
  const candidates = Array.from(
    { length: Math.max(0, Math.floor(maximumMeters) - Math.ceil(minimumMeters) + 1) },
    (_, index) => Math.ceil(minimumMeters) + index,
  ).sort((left, right) => Math.abs(left - targetMeters) - Math.abs(right - targetMeters) || left - right);
  return candidates.find((distance) => isPickupDistanceSafe(distance, 52, hazards, pits));
}

function getTimePickupSlotIndexes(maxDistanceMeters: number, spacingMeters: number): Set<number> {
  const indexes = new Set<number>();
  for (let target = RUNNER_CONFIG.timePickupFirstDistanceMeters; target <= maxDistanceMeters;
    target += RUNNER_CONFIG.timePickupSpacingMeters) {
    indexes.add(Math.max(0, Math.round((target - SAFE_PICKUP_START_METERS) / spacingMeters)));
  }
  return indexes;
}

function getMotifSectionPickups(
  motifId: CoinMotifId,
  sectionId: string,
  centerMeters: number,
): readonly PickupDefinition[] {
  const width = RUNNER_CONFIG.coinMotifSafeWindowMeters;
  return getCoinMotifPoints(motifId).map(({ x, y }, pointIndex) => {
    const heightUnits = Math.round(48 + y * 84);
    return Object.freeze({
      id: `motif-${sectionId}-${pointIndex}`,
      kind: 'coin' as const,
      distanceMeters: Math.round(centerMeters - width / 2 + x * width),
      heightUnits,
      optionalJump: heightUnits > 68,
      motifId,
      motifSectionId: sectionId,
    });
  });
}

function hasMotifPointClearance(
  candidates: readonly PickupDefinition[],
  retainedPickups: readonly PickupDefinition[],
): boolean {
  const minCoinCenterGapPx = PICKUP_ART_RADIUS_PX * 2;
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    for (const previous of candidates.slice(0, index)) {
      const dxPx = (candidate.distanceMeters - previous.distanceMeters) / METERS_PER_WORLD_UNIT;
      const dyPx = candidate.heightUnits - previous.heightUnits;
      if (Math.hypot(dxPx, dyPx) < minCoinCenterGapPx) return false;
    }
    for (const existing of retainedPickups) {
      const dxPx = (candidate.distanceMeters - existing.distanceMeters) / METERS_PER_WORLD_UNIT;
      const dyPx = candidate.heightUnits - existing.heightUnits;
      const clearanceMeters = existing.kind === 'giant'
        ? RUNNER_CONFIG.pickupObjectClearanceMeters
        : existing.kind === 'speed' ? RUNNER_CONFIG.speedPickupClearanceMeters
          : RUNNER_CONFIG.pickupCoinVisualClearanceMeters;
      if (Math.hypot(dxPx, dyPx) < clearanceMeters / METERS_PER_WORLD_UNIT) return false;
    }
  }
  return true;
}

function isMotifSectionClear(
  centerMeters: number,
  expectedBiomeId: RunnerBiomeDefinition['id'],
  isStoryCourse: boolean,
  maxDistanceMeters: number,
  hazards: readonly ScheduledHazard[],
  pits: readonly PitDefinition[],
): boolean {
  const halfWindow = RUNNER_CONFIG.coinMotifSafeWindowMeters / 2;
  const startMeters = centerMeters - halfWindow;
  const endMeters = centerMeters + halfWindow;
  if (startMeters < SAFE_PICKUP_START_METERS || endMeters > maxDistanceMeters) return false;
  if (!isStoryCourse && (getBiomeForDistance(startMeters).id !== expectedBiomeId ||
      getBiomeForDistance(endMeters - 0.01).id !== expectedBiomeId)) return false;

  const hazardMarginMeters = (PICKUP_ART_RADIUS_PX + PICKUP_VISUAL_MARGIN_PX) *
    RUNNER_CONFIG.metersPerWorldUnit;
  if (hazards.some(({ distanceMeters, definition }) =>
    distanceMeters + definition.width / 2 * RUNNER_CONFIG.metersPerWorldUnit + hazardMarginMeters >= startMeters &&
    distanceMeters - definition.width / 2 * RUNNER_CONFIG.metersPerWorldUnit - hazardMarginMeters <= endMeters)) {
    return false;
  }
  if (pits.some((pit) => isPitClearance(centerMeters, pit,
    halfWindow + PICKUP_PIT_CLEARANCE_METERS))) return false;
  if (RUNNER_GATE_DISTANCES_M.some((gate) => isGateClearance(centerMeters, gate, halfWindow))) return false;
  return true;
}

function addCoinMotifSections(
  pickups: readonly PickupDefinition[],
  maxDistanceMeters: number,
  storyStageId: StoryStageId | null,
  hazards: readonly ScheduledHazard[],
  pits: readonly PitDefinition[],
): readonly PickupDefinition[] {
  const anchors: number[] = [];
  if (storyStageId) {
    anchors.push(getStoryStage(storyStageId).lengthMeters / 2);
  } else {
    for (let anchor = RUNNER_CONFIG.coinMotifEndlessIntervalMeters;
      anchor <= maxDistanceMeters; anchor += RUNNER_CONFIG.coinMotifEndlessIntervalMeters) {
      anchors.push(anchor);
    }
  }

  let scheduled = [...pickups];
  const searchOffsets = Array.from(
    { length: Math.floor(RUNNER_CONFIG.coinMotifSearchRadiusMeters /
      RUNNER_CONFIG.coinMotifSearchStepMeters) * 2 + 1 },
    (_, index) => (index - Math.floor(RUNNER_CONFIG.coinMotifSearchRadiusMeters /
      RUNNER_CONFIG.coinMotifSearchStepMeters)) * RUNNER_CONFIG.coinMotifSearchStepMeters,
  ).sort((left, right) => Math.abs(left) - Math.abs(right) || left - right);

  for (const anchor of anchors) {
    const anchorBiome = storyStageId
      ? getBiomeById(getStoryStage(storyStageId).biomeId)
      : getBiomeForDistance(anchor);
    const motifId = COIN_MOTIF_BY_BIOME[anchorBiome.id];
    const center = searchOffsets.map((offset) => anchor + offset).find((candidateCenter) => {
      if (!isMotifSectionClear(candidateCenter, anchorBiome.id, storyStageId !== null,
        maxDistanceMeters, hazards, pits)) return false;
      const sectionId = `${storyStageId ?? anchorBiome.id}-${anchor}-${candidateCenter}`;
      const candidates = getMotifSectionPickups(motifId, sectionId, candidateCenter);
      const start = candidateCenter - RUNNER_CONFIG.coinMotifSafeWindowMeters / 2;
      const end = candidateCenter + RUNNER_CONFIG.coinMotifSafeWindowMeters / 2;
      if (candidates.some((pickup) => pickup.distanceMeters < SAFE_PICKUP_START_METERS ||
          pickup.distanceMeters > maxDistanceMeters ||
          !isPickupDistanceSafe(pickup.distanceMeters, pickup.heightUnits, hazards, pits))) return false;

      const replaceableSafeCoin = (pickup: PickupDefinition) => pickup.kind === 'coin' &&
        pickup.id.startsWith('safe-') && pickup.guideAction === undefined &&
        pickup.distanceMeters >= start && pickup.distanceMeters <= end;
      const retained = scheduled.filter((pickup) => !replaceableSafeCoin(pickup));
      return hasMotifPointClearance(candidates, retained);
    });
    if (center === undefined) continue;

    const start = center - RUNNER_CONFIG.coinMotifSafeWindowMeters / 2;
    const end = center + RUNNER_CONFIG.coinMotifSafeWindowMeters / 2;
    const sectionId = `${storyStageId ?? anchorBiome.id}-${anchor}-${center}`;
    scheduled = scheduled.filter((pickup) => !(pickup.kind === 'coin' && pickup.id.startsWith('safe-') &&
      pickup.guideAction === undefined && pickup.distanceMeters >= start && pickup.distanceMeters <= end));
    scheduled.push(...getMotifSectionPickups(motifId, sectionId, center));
  }
  return scheduled;
}

function getStoryGiantTargets(hazards: readonly ScheduledHazard[]): GiantChallengeTarget[] {
  const groups: ScheduledHazard[][] = [];
  for (const hazard of [...hazards].sort((left, right) => left.distanceMeters - right.distanceMeters)) {
    const current = groups.at(-1);
    if (!current || hazard.distanceMeters - current.at(-1)!.distanceMeters > 350) {
      groups.push([hazard]);
    } else {
      current.push(hazard);
    }
  }
  return groups.filter((group) => group.length >= 2).map((group) => ({
    startMeters: group[0].distanceMeters,
    endMeters: group.at(-1)!.distanceMeters,
  }));
}

/** Generate stable, absolute-distance pickups for any requested course length. */
export function generatePickupSchedule(maxDistanceMeters: number,
  storyStageId: StoryStageId | null = null): readonly PickupDefinition[] {
  if (!Number.isFinite(maxDistanceMeters) || maxDistanceMeters < SAFE_PICKUP_START_METERS) return [];
  const hazards = getScheduledHazards(maxDistanceMeters + PICKUP_PIT_CLEARANCE_METERS, storyStageId);
  const initialPitHorizon = maxDistanceMeters + PICKUP_PIT_CLEARANCE_METERS;
  const getPits = (horizon: number) => storyStageId
    ? getStoryPitDefinitions(storyStageId, horizon)
    : getPitDefinitions(horizon);
  const initialPits = getPits(initialPitHorizon);
  // Preserve the existing Endless horizon behavior while using the same mode's
  // pit definitions for every safety check.
  const horizon = Math.max(maxDistanceMeters, initialPits.at(-1)?.distanceMeters ?? 0) +
    PICKUP_PIT_CLEARANCE_METERS;
  const pits = getPits(horizon);
  const safePickupSpacingMeters = storyStageId
    ? RUNNER_CONFIG.safePickupSpacingMeters
    : RUNNER_CONFIG.endlessSafePickupSpacingMeters;
  const timeSlots = getTimePickupSlotIndexes(maxDistanceMeters, safePickupSpacingMeters);
  const safePickups: PickupDefinition[] = [];
  const lastIndex = Math.floor((maxDistanceMeters - SAFE_PICKUP_START_METERS) / safePickupSpacingMeters);
  for (let index = 0; index <= lastIndex; index += 1) {
    const target = SAFE_PICKUP_START_METERS + index * safePickupSpacingMeters;
    const previous = safePickups.at(-1)?.distanceMeters;
    const localMinimum = Math.max(SAFE_PICKUP_START_METERS, target - 25,
      previous === undefined ? target : previous + RUNNER_CONFIG.safePickupMinimumGapMeters);
    const localMaximum = Math.min(maxDistanceMeters, target + 25);
    const preferredMaximum = previous === undefined ? localMaximum : Math.min(localMaximum,
      previous + RUNNER_CONFIG.safePickupMaximumGapMeters);
    // Prefer the target cadence and bounded local gaps. If a hazard blocks that
    // entire gap, keep searching the same local slot so later coins resume.
    const distanceMeters = nearestSafeDistance(target, localMinimum, preferredMaximum, hazards, pits) ??
      (preferredMaximum < localMaximum
        ? nearestSafeDistance(target, Math.max(localMinimum, preferredMaximum + 1), localMaximum, hazards, pits)
        : undefined);
    if (distanceMeters === undefined) continue;
    const kind = storyStageId && timeSlots.has(index) ? 'time' : 'coin';
    safePickups.push({ id: kind === 'time' ? `time-${index}` : `safe-${index}`, kind,
      distanceMeters, heightUnits: 52, optionalJump: false });
  }

  const optionalPickups: PickupDefinition[] = [];
  let groundHazardIndex = 0;
  let overheadHazardIndex = 0;
  for (const hazard of hazards) {
    const rowOffsets = Array.from(
      { length: Math.floor(RUNNER_CONFIG.postJumpCoinRowSearchRadiusMeters /
        RUNNER_CONFIG.postJumpCoinRowSearchStepMeters) * 2 + 1 },
      (_, index) => (index === 0 ? 0 : Math.ceil(index / 2) * RUNNER_CONFIG.postJumpCoinRowSearchStepMeters *
        (index % 2 === 1 ? 1 : -1)),
    );
    if (hazard.definition.kind === 'ground') {
      const rowIndex = groundHazardIndex++;
      if (rowIndex % RUNNER_CONFIG.postJumpCoinRowEveryNthHazard !== 0) continue;
      const rowStart = hazard.distanceMeters +
        hazard.definition.width / 2 * RUNNER_CONFIG.metersPerWorldUnit +
        RUNNER_CONFIG.postJumpCoinLandingClearanceMeters;
      const row = rowOffsets.map((offset) => Array.from({ length: RUNNER_CONFIG.postJumpCoinRowCount },
        (_, index) => ({
          id: `jump-guide-${hazard.patternIndex}-${index}`,
          kind: 'coin' as const,
          distanceMeters: rowStart + offset + index * RUNNER_CONFIG.postJumpCoinRowSpacingMeters,
          heightUnits: 132,
          optionalJump: true,
          guideAction: 'jump' as const,
          guideHazardId: hazard.id,
        }))).find((candidateRow) => candidateRow.every((pickup) =>
        pickup.distanceMeters <= maxDistanceMeters &&
        isPickupDistanceSafe(pickup.distanceMeters, pickup.heightUnits, hazards, pits) &&
        [...safePickups, ...optionalPickups].every((existing) => hasPickupVisualClearance(existing, pickup))));
      if (row) optionalPickups.push(...row);
      continue;
    }

    if (hazard.definition.kind !== 'overhead') continue;
    const rowIndex = overheadHazardIndex++;
    if (rowIndex % RUNNER_CONFIG.slideCoinRowEveryNthHazard !== 0) continue;
    const rowStart = hazard.distanceMeters -
      ((RUNNER_CONFIG.postJumpCoinRowCount - 1) * RUNNER_CONFIG.postJumpCoinRowSpacingMeters) / 2;
    const row = rowOffsets.map((offset) => Array.from({ length: RUNNER_CONFIG.postJumpCoinRowCount },
      (_, index) => ({
        id: `slide-guide-${hazard.patternIndex}-${index}`,
        kind: 'coin' as const,
        distanceMeters: rowStart + offset + index * RUNNER_CONFIG.postJumpCoinRowSpacingMeters,
        heightUnits: 14,
        optionalJump: false,
        guideAction: 'slide' as const,
        guideHazardId: hazard.id,
      }))).find((candidateRow) => candidateRow.every((pickup) =>
      pickup.distanceMeters >= SAFE_PICKUP_START_METERS && pickup.distanceMeters <= maxDistanceMeters &&
      isPickupDistanceSafe(pickup.distanceMeters, pickup.heightUnits, hazards, pits, hazard.id) &&
      [...safePickups, ...optionalPickups].every((existing) => hasPickupVisualClearance(existing, pickup))));
    if (row) optionalPickups.push(...row);
  }
  const existingPickups = [...safePickups, ...optionalPickups];
  const giantPickups: PickupDefinition[] = [];
  let giantIndex = 0;
  const giantPickupLead = RUNNER_CONFIG.giantPickupLeadMeters;
  const giantTargets: GiantChallengeTarget[] = [];
  if (storyStageId) {
    giantTargets.push(...getStoryGiantTargets(hazards));
  } else {
    for (let waveIndex = 0; ; waveIndex += 1) {
      const wave = getDenseWaveSchedule(waveIndex);
      if (wave.waveStartMeters - giantPickupLead > maxDistanceMeters) break;
      giantTargets.push({ startMeters: wave.waveStartMeters,
        endMeters: wave.patternDistances.at(-1)! });
    }
  }
  const fastestMetersPerSecond = MAX_RUN_SPEED_UNITS_PER_SECOND * RUNNER_CONFIG.metersPerWorldUnit;
  for (const challenge of giantTargets) {
    const target = challenge.startMeters - giantPickupLead;
    if (target > maxDistanceMeters ||
        (challenge.endMeters - target) / fastestMetersPerSecond > RUNNER_CONFIG.giantDurationMs / 1_000) continue;
    const offsets = Array.from(
      { length: RUNNER_CONFIG.giantPickupSearchRadiusMeters * 2 + 1 },
      (_, index) => index - RUNNER_CONFIG.giantPickupSearchRadiusMeters,
    ).sort((left, right) => Math.abs(left) - Math.abs(right) || left - right);
    const distanceMeters = offsets.map((offset) => target + offset).find((candidate) =>
      candidate >= Math.max(SAFE_PICKUP_START_METERS, target - RUNNER_CONFIG.giantPickupSearchRadiusMeters) &&
      candidate <= Math.min(maxDistanceMeters, target + RUNNER_CONFIG.giantPickupSearchRadiusMeters,
        challenge.startMeters - 1) &&
      (challenge.endMeters - candidate) / fastestMetersPerSecond <= RUNNER_CONFIG.giantDurationMs / 1_000 &&
      isPickupDistanceSafe(candidate, 52, hazards, pits) &&
      [...existingPickups, ...giantPickups].every((pickup) =>
        Math.abs(pickup.distanceMeters - candidate) >= 30) &&
      (storyStageId !== null || hasPowerUpSpacing(candidate, 'giant', giantPickups)),
    );
    if (distanceMeters === undefined) continue;
    giantPickups.push({ id: `giant-${giantIndex++}`, kind: 'giant', distanceMeters,
      heightUnits: 52, optionalJump: false });
  }
  const scheduledPickups = [...existingPickups, ...giantPickups];
  const speedPickups: PickupDefinition[] = [];
  for (let target = RUNNER_CONFIG.speedPickupFirstDistanceMeters;
    target <= maxDistanceMeters; target += RUNNER_CONFIG.speedPickupSpacingMeters) {
    const minimum = Math.max(SAFE_PICKUP_START_METERS, target - RUNNER_CONFIG.speedPickupSearchRadiusMeters);
    const maximum = Math.min(maxDistanceMeters, target + RUNNER_CONFIG.speedPickupSearchRadiusMeters);
    const candidates = Array.from({ length: Math.max(0, maximum - minimum + 1) },
      (_, index) => minimum + index)
      .sort((left, right) => Math.abs(left - target) - Math.abs(right - target) || left - right);
    const distanceMeters = candidates.find((candidate) =>
      isPickupDistanceSafe(candidate, 52, hazards, pits) &&
      [...scheduledPickups, ...speedPickups].every((pickup) =>
        Math.abs(pickup.distanceMeters - candidate) >= RUNNER_CONFIG.speedPickupClearanceMeters) &&
        (storyStageId !== null || hasPowerUpSpacing(candidate, 'speed', [...scheduledPickups, ...speedPickups])),
    );
    if (distanceMeters !== undefined) {
      speedPickups.push({ id: `speed-${speedPickups.length}`, kind: 'speed', distanceMeters,
        heightUnits: 52, optionalJump: false });
    }
  }
  const withMotifs = addCoinMotifSections([...scheduledPickups, ...speedPickups], maxDistanceMeters,
    storyStageId, hazards, pits);
  return Object.freeze([...withMotifs]
    .sort((left, right) => left.distanceMeters - right.distanceMeters || left.id.localeCompare(right.id)));
}

export const PICKUP_SCHEDULE = generatePickupSchedule(15_000);

export function getPickupBodySize(): number {
  return PICKUP_BASE_RADIUS_PX * 2;
}

type ActivePickup = {
  definition: PickupDefinition;
  box: Phaser.GameObjects.Rectangle;
  art: Phaser.GameObjects.Graphics;
  collected: boolean;
  magnetStarted: boolean;
  magnetElapsedMs: number;
  magnetStartX: number;
  magnetStartY: number;
  magnetLastProjectedX: number;
  lastX: number | null;
  lastY: number | null;
  sparkle: Phaser.GameObjects.Graphics | null;
};

type GateArt = { distanceMeters: number; art: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text };
type GoalArt = { distanceMeters: number; art: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text };

export class CollectibleSpawner {
  private nextPickupIndex = 0;
  private activePickupSchedule: readonly PickupDefinition[] = PICKUP_SCHEDULE;
  private endlessPickupScheduleHorizonMeters = 15_000;
  private scheduledStoryStageId: StoryStageId | null = null;
  private active: ActivePickup[] = [];
  private gates: GateArt[] = [];
  private goal: GoalArt | null = null;
  private createdGates = new Set<number>();
  private activeStoryBiome: RunnerBiomeDefinition | null = null;
  private previousDistanceMeters: number | null = null;
  private previousPlayerBounds: CollisionBounds | null = null;
  private readonly passive: ReturnType<typeof getCharacterPassive>;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly onPickup: (pickup: PickupDefinition) => void,
    characterId: CharacterId,
  ) {
    this.passive = getCharacterPassive(characterId);
  }

  update(snapshot: RunnerSnapshot, deltaMs = 0): void {
    if (snapshot.phase !== 'running') return;
    const storyStage = snapshot.mode === 'story' && snapshot.storyStageId
      ? getStoryStage(snapshot.storyStageId) : null;
    const stageBiome = storyStage ? getBiomeById(storyStage.biomeId) : null;
    this.activeStoryBiome = stageBiome;
    const storyStageId = storyStage?.id ?? null;
    if (storyStageId !== this.scheduledStoryStageId) {
      this.scheduledStoryStageId = storyStageId;
      this.activePickupSchedule = storyStage
        ? generatePickupSchedule(storyStage.lengthMeters, storyStage.id)
        : PICKUP_SCHEDULE;
      this.nextPickupIndex = 0;
    }
    const visibleLead = (960 - RUNNER_PLAYER_X) * METERS_PER_WORLD_UNIT;
    const requiredPickupHorizon = snapshot.distanceMeters + visibleLead;
    if (!storyStage && requiredPickupHorizon >
        this.endlessPickupScheduleHorizonMeters - ENDLESS_PICKUP_SCHEDULE_LOOKAHEAD_METERS) {
      this.endlessPickupScheduleHorizonMeters = Math.ceil(
        (requiredPickupHorizon + ENDLESS_PICKUP_SCHEDULE_LOOKAHEAD_METERS) /
          ENDLESS_PICKUP_SCHEDULE_CHUNK_METERS,
      ) * ENDLESS_PICKUP_SCHEDULE_CHUNK_METERS;
      this.activePickupSchedule = generatePickupSchedule(this.endlessPickupScheduleHorizonMeters);
    }
    while (this.nextPickupIndex < this.activePickupSchedule.length &&
      this.activePickupSchedule[this.nextPickupIndex].distanceMeters <= snapshot.distanceMeters + visibleLead) {
      this.spawnPickup(this.activePickupSchedule[this.nextPickupIndex]);
      this.nextPickupIndex += 1;
    }
    const frameDeltaMs = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
    const playerBounds = getCollisionBounds(this.player, 20, 38);
    const previousPlayerBounds = this.previousPlayerBounds ?? playerBounds;
    const previousDistanceMeters = this.previousDistanceMeters ?? snapshot.distanceMeters;
    const previousPlayerCenter = boundsCenter(previousPlayerBounds);
    const playerCenter = boundsCenter(playerBounds);
    for (const pickup of [...this.active]) {
      if (pickup.collected) continue;
      const projectedX = this.screenX(pickup.definition.distanceMeters, snapshot.distanceMeters);
      const previousProjectedX = this.screenX(pickup.definition.distanceMeters, previousDistanceMeters);
      const projectedY = RUNNER_GROUND_Y - pickup.definition.heightUnits;
      const target = this.playerPickupCenter();
      const eligibleForMagnet = this.passive.id === 'mary-pickup-magnet' &&
        (pickup.definition.kind === 'coin' || pickup.definition.kind === 'time');
      let x = projectedX;
      let y = projectedY;

      if (!pickup.magnetStarted && eligibleForMagnet && Math.hypot(
        projectedX - target.x, projectedY - target.y,
      ) <= this.passive.magnetRadiusPx) {
        pickup.magnetStarted = true;
        pickup.magnetElapsedMs = 0;
        pickup.magnetStartX = projectedX;
        pickup.magnetStartY = projectedY;
        pickup.magnetLastProjectedX = projectedX;
        pickup.sparkle = this.scene.add.graphics().setDepth(4);
      }

      if (pickup.magnetStarted && this.passive.id === 'mary-pickup-magnet') {
        pickup.magnetStartX += projectedX - pickup.magnetLastProjectedX;
        pickup.magnetLastProjectedX = projectedX;
        pickup.magnetElapsedMs = Math.min(this.passive.magnetPullDurationMs,
          pickup.magnetElapsedMs + frameDeltaMs);
        const progress = pickup.magnetElapsedMs / this.passive.magnetPullDurationMs;
        const easedProgress = 1 - (1 - progress) ** 2;
        x = pickup.magnetStartX + (target.x - pickup.magnetStartX) * easedProgress;
        y = pickup.magnetStartY + (target.y - pickup.magnetStartY) * easedProgress;
        this.drawMagnetSparkle(pickup, x, y, target.x, target.y, progress);
      }

      pickup.box.setPosition(x, y);
      pickup.art.setPosition(x, y);
      const previousX = pickup.lastX ?? previousProjectedX;
      const previousY = pickup.lastY ?? projectedY;
      const pickupRadius = getPickupBodySize() / 2;
      if (sweptAabbIntersects(
        previousX - previousPlayerCenter.x,
        previousY - previousPlayerCenter.y,
        x - playerCenter.x,
        y - playerCenter.y,
        pickupRadius + (playerBounds.right - playerBounds.left) / 2,
        pickupRadius + (playerBounds.bottom - playerBounds.top) / 2,
      )) {
        this.collectPickup(pickup);
      }
      pickup.lastX = x;
      pickup.lastY = y;
      if (x < -20 || snapshot.collectedPickupIds.includes(pickup.definition.id)) this.removePickup(pickup);
    }
    this.previousDistanceMeters = snapshot.distanceMeters;
    this.previousPlayerBounds = playerBounds;

    for (const distanceMeters of RUNNER_GATE_DISTANCES_M) {
      if (storyStage && distanceMeters >= storyStage.lengthMeters) continue;
      if (distanceMeters > snapshot.distanceMeters + visibleLead ||
        this.createdGates.has(distanceMeters) ||
        snapshot.distanceMeters > distanceMeters + 100) continue;
      this.createdGates.add(distanceMeters);
      const biome = stageBiome ?? getBiomeForDistance(distanceMeters);
      const { palette, landmark } = biome;
      const art = this.scene.add.graphics().setDepth(-5);
      // Story milestones are visual landmarks only; Endless retains its gate rewards.
      drawRunnerGate(art, biome);
      const label = this.scene.add.text(0, 0, `${landmark} · ${distanceMeters.toLocaleString()}m`,
        { color: `#${palette.hazardContrast.toString(16).padStart(6, '0')}`,
          fontSize: '15px', fontFamily: 'monospace',
          backgroundColor: '#fffffff0', padding: { x: 5, y: 3 } }).setOrigin(0.5)
        .setDepth(5);
      this.gates.push({ distanceMeters, art, label });
    }
    for (const gate of [...this.gates]) {
      const x = this.screenX(gate.distanceMeters, snapshot.distanceMeters);
      gate.art.setPosition(x, RUNNER_GROUND_Y);
      gate.label.setPosition(x, RUNNER_GROUND_Y - 190);
      if (x < -30) {
        gate.art.destroy();
        gate.label.destroy();
        this.gates = this.gates.filter((item) => item !== gate);
      }
    }

    if (storyStage && !this.goal && storyStage.lengthMeters <= snapshot.distanceMeters + visibleLead) {
      const art = this.scene.add.graphics().setDepth(-5);
      drawRunnerGoal(art, stageBiome!);
      const label = this.scene.add.text(0, 0, 'GOAL', {
        color: `#${stageBiome!.palette.hazardContrast.toString(16).padStart(6, '0')}`,
        fontSize: '20px', fontStyle: 'bold', fontFamily: 'monospace',
        backgroundColor: '#fffffff2', padding: { x: 9, y: 5 },
      }).setOrigin(0.5).setDepth(6);
      this.goal = { distanceMeters: storyStage.lengthMeters, art, label };
    }
    if (storyStage && this.goal) {
      const x = this.screenX(storyStage.lengthMeters, snapshot.distanceMeters);
      this.goal.art.setPosition(x, RUNNER_GROUND_Y);
      this.goal.label.setPosition(x, RUNNER_GROUND_Y - 224);
    }
  }

  createCheckpoint(): Pick<RunnerEngineCheckpoint,
    'pickupCursor' | 'pickupHorizonMeters' | 'pickupStageId' | 'createdGateDistances'> &
    { entities: readonly Extract<RunnerWorldEntityCheckpoint, { kind: 'pickup' | 'gate' | 'goal' }>[] } {
    return {
      pickupCursor: this.nextPickupIndex,
      pickupHorizonMeters: this.endlessPickupScheduleHorizonMeters,
      pickupStageId: this.scheduledStoryStageId,
      createdGateDistances: [...this.createdGates],
      entities: [
        ...this.active.map((pickup) => ({ kind: 'pickup' as const, id: pickup.definition.id,
          distanceMeters: pickup.definition.distanceMeters, definition: pickup.definition,
          collected: pickup.collected, magnetStarted: pickup.magnetStarted,
          magnetElapsedMs: pickup.magnetElapsedMs, magnetStartX: pickup.magnetStartX,
          magnetStartY: pickup.magnetStartY, magnetLastProjectedX: pickup.magnetLastProjectedX,
          lastX: pickup.lastX, lastY: pickup.lastY })),
        ...this.gates.map((gate) => ({ kind: 'gate' as const,
          id: `gate-${gate.distanceMeters}`, distanceMeters: gate.distanceMeters })),
        ...(this.goal ? [{ kind: 'goal' as const, id: 'goal', distanceMeters: this.goal.distanceMeters }] : []),
      ],
    };
  }

  canRestoreCheckpoint(
    checkpoint: ReturnType<CollectibleSpawner['createCheckpoint']>, snapshot: RunnerSnapshot,
  ): boolean {
    const storyStage = snapshot.mode === 'story' && snapshot.storyStageId
      ? getStoryStage(snapshot.storyStageId) : null;
    if (!Number.isSafeInteger(checkpoint.pickupCursor) || checkpoint.pickupCursor < 0 ||
      !Number.isFinite(checkpoint.pickupHorizonMeters) || checkpoint.pickupHorizonMeters < 0 ||
      checkpoint.pickupStageId !== (storyStage?.id ?? null) ||
      !Array.isArray(checkpoint.createdGateDistances) || !Array.isArray(checkpoint.entities) ||
      checkpoint.createdGateDistances.some((distance) => !Number.isFinite(distance) ||
        !RUNNER_GATE_DISTANCES_M.includes(distance)) ||
      new Set(checkpoint.createdGateDistances).size !== checkpoint.createdGateDistances.length) return false;

    const schedule = storyStage
      ? generatePickupSchedule(storyStage.lengthMeters, storyStage.id)
      : generatePickupSchedule(checkpoint.pickupHorizonMeters);
    if (checkpoint.pickupCursor > schedule.length) return false;

    const ids = new Set<string>();
    const gateDistances = new Set<number>();
    let hasGoal = false;
    for (const entity of checkpoint.entities) {
      if (!entity || !Number.isFinite(entity.distanceMeters) || typeof entity.id !== 'string' ||
        ids.has(`${entity.kind}:${entity.id}`)) return false;
      ids.add(`${entity.kind}:${entity.id}`);
      if (entity.kind === 'pickup') {
        const definition = entity.definition;
        if (!definition || entity.id !== definition.id || entity.distanceMeters !== definition.distanceMeters ||
          !['coin', 'time', 'giant', 'speed'].includes(definition.kind) ||
          typeof definition.optionalJump !== 'boolean' || !Number.isFinite(definition.heightUnits) ||
          (definition.guideAction !== undefined && !['jump', 'slide'].includes(definition.guideAction)) ||
          ![entity.magnetElapsedMs, entity.magnetStartX, entity.magnetStartY,
            entity.magnetLastProjectedX].every(Number.isFinite) || entity.magnetElapsedMs < 0 ||
          typeof entity.collected !== 'boolean' || typeof entity.magnetStarted !== 'boolean' ||
          (entity.lastX !== null && !Number.isFinite(entity.lastX)) ||
          (entity.lastY !== null && !Number.isFinite(entity.lastY)) ||
          ((entity.lastX === null) !== (entity.lastY === null)) ||
          (entity.magnetStarted && !['coin', 'time'].includes(definition.kind))) return false;
      } else if (entity.kind === 'gate') {
        if (entity.id !== `gate-${entity.distanceMeters}` ||
          !RUNNER_GATE_DISTANCES_M.includes(entity.distanceMeters) || gateDistances.has(entity.distanceMeters)) return false;
        gateDistances.add(entity.distanceMeters);
      } else if (entity.kind === 'goal') {
        if (!storyStage || hasGoal || entity.id !== 'goal' || entity.distanceMeters !== storyStage.lengthMeters) return false;
        hasGoal = true;
      } else return false;
    }
    return snapshot.phase === 'paused';
  }

  restoreCheckpoint(checkpoint: ReturnType<CollectibleSpawner['createCheckpoint']>, snapshot: RunnerSnapshot): boolean {
    if (!this.canRestoreCheckpoint(checkpoint, snapshot)) return false;
    const storyStage = snapshot.mode === 'story' && snapshot.storyStageId
      ? getStoryStage(snapshot.storyStageId) : null;
    this.activeStoryBiome = storyStage ? getBiomeById(storyStage.biomeId) : null;
    this.scheduledStoryStageId = checkpoint.pickupStageId;
    this.activePickupSchedule = storyStage
      ? generatePickupSchedule(storyStage.lengthMeters, storyStage.id)
      : generatePickupSchedule(checkpoint.pickupHorizonMeters);
    if (checkpoint.pickupCursor > this.activePickupSchedule.length) return false;
    this.nextPickupIndex = checkpoint.pickupCursor;
    this.endlessPickupScheduleHorizonMeters = checkpoint.pickupHorizonMeters;
    this.createdGates = new Set(checkpoint.createdGateDistances);
    for (const entity of checkpoint.entities) {
      if (entity.kind === 'pickup') {
        if (snapshot.collectedPickupIds.includes(entity.id)) continue;
        const pickup = this.spawnPickup(entity.definition);
        pickup.magnetStarted = entity.magnetStarted;
        pickup.magnetElapsedMs = entity.magnetElapsedMs;
        pickup.magnetStartX = entity.magnetStartX;
        pickup.magnetStartY = entity.magnetStartY;
        pickup.magnetLastProjectedX = entity.magnetLastProjectedX;
        pickup.lastX = entity.lastX;
        pickup.lastY = entity.lastY;
        pickup.collected = entity.collected;
        if (pickup.magnetStarted) pickup.sparkle = this.scene.add.graphics().setDepth(4);
        if (pickup.collected) this.scene.time.delayedCall(0, () => {
          if (!this.active.includes(pickup)) return;
          this.onPickup(pickup.definition);
          this.removePickup(pickup);
        });
      } else if (entity.kind === 'gate') this.restoreGate(entity.distanceMeters);
      else if (entity.kind === 'goal') this.restoreGoal(entity.distanceMeters, storyStage);
    }
    this.previousDistanceMeters = snapshot.distanceMeters;
    this.previousPlayerBounds = getCollisionBounds(this.player, 20, 38);
    return true;
  }

  private restoreGate(distanceMeters: number): void {
    const biome = this.activeStoryBiome ?? getBiomeForDistance(distanceMeters);
    const { palette, landmark } = biome;
    const art = this.scene.add.graphics().setDepth(-5);
    drawRunnerGate(art, biome);
    const label = this.scene.add.text(0, 0, `${landmark} · ${distanceMeters.toLocaleString()}m`, {
      color: `#${palette.hazardContrast.toString(16).padStart(6, '0')}`,
      fontSize: '15px', fontFamily: 'monospace', backgroundColor: '#fffffff0',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(5);
    this.gates.push({ distanceMeters, art, label });
  }

  private restoreGoal(distanceMeters: number, storyStage: ReturnType<typeof getStoryStage> | null): void {
    if (!storyStage) return;
    const biome = getBiomeById(storyStage.biomeId);
    const art = this.scene.add.graphics().setDepth(-5);
    drawRunnerGoal(art, biome);
    const label = this.scene.add.text(0, 0, 'GOAL', {
      color: `#${biome.palette.hazardContrast.toString(16).padStart(6, '0')}`,
      fontSize: '20px', fontStyle: 'bold', fontFamily: 'monospace',
      backgroundColor: '#fffffff2', padding: { x: 9, y: 5 },
    }).setOrigin(0.5).setDepth(6);
    this.goal = { distanceMeters, art, label };
  }

  destroy(): void {
    for (const pickup of [...this.active]) this.removePickup(pickup);
    for (const gate of this.gates) { gate.art.destroy(); gate.label.destroy(); }
    this.gates = [];
    this.goal?.art.destroy();
    this.goal?.label.destroy();
    this.goal = null;
  }

  private screenX(atMeters: number, currentMeters: number): number {
    return RUNNER_PLAYER_X + (atMeters - currentMeters) / METERS_PER_WORLD_UNIT;
  }

  private playerPickupCenter(): { x: number; y: number } {
    const body = this.player.body as Phaser.Physics.Arcade.Body | undefined;
    return body?.center
      ? { x: body.center.x, y: body.center.y }
      : { x: this.player.x, y: this.player.y };
  }

  private drawMagnetSparkle(
    pickup: ActivePickup,
    pickupX: number,
    pickupY: number,
    targetX: number,
    targetY: number,
    progress: number,
  ): void {
    if (!pickup.sparkle) return;
    if (progress >= 1) {
      pickup.sparkle.clear().setVisible(false);
      return;
    }
    const sparkleProgress = (pickup.magnetElapsedMs % 180) / 180;
    const sparkleX = pickupX + (targetX - pickupX) * sparkleProgress;
    const sparkleY = pickupY + (targetY - pickupY) * sparkleProgress;
    pickup.sparkle.setVisible(true).clear()
      .lineStyle(2, 0xcab4ff, 0.28).lineBetween(pickupX, pickupY, targetX, targetY)
      .lineStyle(1.5, 0xffffff, 0.72)
      .lineBetween(sparkleX - 3, sparkleY, sparkleX + 3, sparkleY)
      .lineBetween(sparkleX, sparkleY - 3, sparkleX, sparkleY + 3);
  }

  private spawnPickup(definition: PickupDefinition): ActivePickup {
    const pickupSize = getPickupBodySize();
    const box = this.scene.add.rectangle(0, 0, pickupSize, pickupSize, 0xffffff, 0);
    this.scene.physics.add.existing(box);
    const body = box.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setCircle(pickupSize / 2);
    const art = this.scene.add.graphics();
    const biome = this.activeStoryBiome
      ? this.activeStoryBiome
      : getBiomeForDistance(definition.distanceMeters);
    drawPickupArt(art, definition.kind, biome);
    const active: ActivePickup = { definition, box, art, collected: false, magnetStarted: false,
      magnetElapsedMs: 0, magnetStartX: 0, magnetStartY: 0, magnetLastProjectedX: 0,
      lastX: null, lastY: null, sparkle: null };
    this.active.push(active);
    this.scene.physics.add.overlap(this.player, box, () => {
      this.collectPickup(active);
    });
    return active;
  }

  private collectPickup(pickup: ActivePickup): void {
    if (!this.active.includes(pickup) || pickup.collected) return;
    pickup.collected = true;
    // Defer body removal until Arcade has finished its overlap iteration.
    this.scene.time.delayedCall(0, () => {
      if (!this.active.includes(pickup)) return;
      this.onPickup(pickup.definition);
      this.removePickup(pickup);
    });
  }

  private removePickup(pickup: ActivePickup): void {
    this.active = this.active.filter((item) => item !== pickup);
    pickup.box.destroy();
    pickup.art.destroy();
    pickup.sparkle?.destroy();
  }
}
