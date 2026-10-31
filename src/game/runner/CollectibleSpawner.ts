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
import { drawRunnerGate } from '../visuals/runnerCourseObjects';
import { getPitDefinitions, isPitClearance } from './PitSpawner';
import { getHazardGeometry } from './CollisionSystem';
import type { HazardDefinition } from './hazardTypes';

export type PickupDefinition = Readonly<{
  id: string;
  kind: RunnerPickupKind;
  distanceMeters: number;
  heightUnits: number;
  optionalJump: boolean;
}>;

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
    art.fillStyle(0xffd66e).fillCircle(0, 0, 11);
    art.lineStyle(2, p.hazardContrast, 0.96).strokeCircle(0, 0, 11);
    art.fillStyle(0xfff4bd).fillTriangle(0, -9, 3, -2, 9, 0)
      .fillTriangle(9, 0, 3, 2, 0, 9).fillTriangle(0, 9, -3, 2, -9, 0)
      .fillTriangle(-9, 0, -3, -2, 0, -9);
    art.fillStyle(0xffffff).fillCircle(0, 0, 3);
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

// The standing-height row is frequent and predictable; elevated coins remain
// optional and can be skipped when the authored course has no safe placement.
const SAFE_PICKUP_START_METERS = 160;
const SAFE_PICKUP_SPACING_METERS = RUNNER_CONFIG.safePickupSpacingMeters;

type ScheduledHazard = Readonly<{ distanceMeters: number; definition: HazardDefinition; patternIndex: number }>;

function getScheduledHazards(maxDistanceMeters: number, storyStageId: StoryStageId | null): ScheduledHazard[] {
  if (storyStageId) {
    return getStoryHazardSchedule(storyStageId)
      .filter(({ distanceMeters }) => distanceMeters <= maxDistanceMeters)
      .map(({ distanceMeters, definition }, patternIndex) => ({ distanceMeters, definition, patternIndex }));
  }
  const hazards: ScheduledHazard[] = [];
  for (let patternIndex = 0; ; patternIndex += 1) {
    const patternStart = getPatternStartDistance(patternIndex);
    if (patternStart > maxDistanceMeters) break;
    const pattern = getPatternForDistance(patternStart);
    for (const hazard of pattern.obstacles) {
      hazards.push({ distanceMeters: getHazardDistance(patternIndex, hazard), definition: hazard, patternIndex });
    }
  }
  return hazards;
}

function isPickupDistanceSafe(
  distanceMeters: number,
  heightUnits: number,
  hazards: readonly ScheduledHazard[],
  maxDistanceMeters: number,
): boolean {
  const pickupHalfExtentPx = Math.max(getPickupBodySize('tokino-mary') / 2, PICKUP_ART_RADIUS_PX);
  const pickupCenterY = RUNNER_GROUND_Y - heightUnits;
  const pickupTop = pickupCenterY - pickupHalfExtentPx - PICKUP_VISUAL_MARGIN_PX;
  const pickupBottom = pickupCenterY + pickupHalfExtentPx + PICKUP_VISUAL_MARGIN_PX;
  const pickupHalfWidthMeters = (pickupHalfExtentPx + PICKUP_VISUAL_MARGIN_PX) *
    RUNNER_CONFIG.metersPerWorldUnit;

  for (const hazard of hazards) {
    const geometry = getHazardGeometry(hazard.definition, 0);
    const hazardTop = geometry.y - PICKUP_VISUAL_MARGIN_PX;
    const hazardBottom = geometry.y + geometry.height + PICKUP_VISUAL_MARGIN_PX;
    const verticalOverlap = pickupTop <= hazardBottom && pickupBottom >= hazardTop;
    if (!verticalOverlap) continue;
    const hazardHalfWidthMeters = (hazard.definition.width / 2 + PICKUP_VISUAL_MARGIN_PX) *
      RUNNER_CONFIG.metersPerWorldUnit;
    if (Math.abs(distanceMeters - hazard.distanceMeters) <=
      pickupHalfWidthMeters + hazardHalfWidthMeters) return false;
  }

  if (getPitDefinitions(maxDistanceMeters).some((pit) =>
    isPitClearance(distanceMeters, pit, PICKUP_PIT_CLEARANCE_METERS + pickupHalfWidthMeters))) return false;
  return RUNNER_GATE_DISTANCES_M.every((gate) =>
    !isGateClearance(distanceMeters, gate, pickupHalfWidthMeters));
}

function nearestSafeDistance(
  targetMeters: number,
  minimumMeters: number,
  maximumMeters: number,
  hazards: readonly ScheduledHazard[],
  maxDistanceMeters: number,
): number | undefined {
  const candidates = Array.from(
    { length: Math.max(0, Math.floor(maximumMeters) - Math.ceil(minimumMeters) + 1) },
    (_, index) => Math.ceil(minimumMeters) + index,
  ).sort((left, right) => Math.abs(left - targetMeters) - Math.abs(right - targetMeters) || left - right);
  return candidates.find((distance) => isPickupDistanceSafe(distance, 52, hazards, maxDistanceMeters));
}

function getTimePickupSlotIndexes(maxDistanceMeters: number): Set<number> {
  const indexes = new Set<number>();
  for (let target = RUNNER_CONFIG.timePickupFirstDistanceMeters; target <= maxDistanceMeters;
    target += RUNNER_CONFIG.timePickupSpacingMeters) {
    indexes.add(Math.max(0, Math.round((target - SAFE_PICKUP_START_METERS) / SAFE_PICKUP_SPACING_METERS)));
  }
  return indexes;
}

/** Generate stable, absolute-distance pickups for any requested course length. */
export function generatePickupSchedule(maxDistanceMeters: number,
  storyStageId: StoryStageId | null = null): readonly PickupDefinition[] {
  if (!Number.isFinite(maxDistanceMeters) || maxDistanceMeters < SAFE_PICKUP_START_METERS) return [];
  const hazards = getScheduledHazards(maxDistanceMeters + PICKUP_PIT_CLEARANCE_METERS, storyStageId);
  const pits = getPitDefinitions(maxDistanceMeters + PICKUP_PIT_CLEARANCE_METERS);
  // isPickupDistanceSafe accepts a horizon for pit enumeration; include the
  // clearance beyond the requested end so a pit just outside the range counts.
  const horizon = Math.max(maxDistanceMeters, pits.at(-1)?.distanceMeters ?? 0) +
    PICKUP_PIT_CLEARANCE_METERS;
  const timeSlots = getTimePickupSlotIndexes(maxDistanceMeters);
  const safePickups: PickupDefinition[] = [];
  const lastIndex = Math.floor((maxDistanceMeters - SAFE_PICKUP_START_METERS) / SAFE_PICKUP_SPACING_METERS);
  for (let index = 0; index <= lastIndex; index += 1) {
    const target = SAFE_PICKUP_START_METERS + index * SAFE_PICKUP_SPACING_METERS;
    const previous = safePickups.at(-1)?.distanceMeters;
    const localMinimum = Math.max(SAFE_PICKUP_START_METERS, target - 25, previous === undefined ? target : previous + 100);
    const localMaximum = Math.min(maxDistanceMeters, target + 25);
    const preferredMaximum = previous === undefined ? localMaximum : Math.min(localMaximum, previous + 150);
    // Prefer the target cadence and 100–150m gaps. If a hazard blocks that
    // entire gap, keep searching the same local slot so later coins resume.
    const distanceMeters = nearestSafeDistance(target, localMinimum, preferredMaximum, hazards, horizon) ??
      (preferredMaximum < localMaximum
        ? nearestSafeDistance(target, Math.max(localMinimum, preferredMaximum + 1), localMaximum, hazards, horizon)
        : undefined);
    if (distanceMeters === undefined) continue;
    const kind = timeSlots.has(index) ? 'time' : 'coin';
    safePickups.push({ id: kind === 'time' ? `time-${index}` : `safe-${index}`, kind,
      distanceMeters, heightUnits: 52, optionalJump: false });
  }

  const optionalPickups: PickupDefinition[] = [];
  let groundHazardIndex = 0;
  for (const hazard of hazards) {
    if (hazard.definition.kind !== 'ground') continue;
    const rowIndex = groundHazardIndex++;
    if (rowIndex % RUNNER_CONFIG.postJumpCoinRowEveryNthHazard !== 0) continue;
    const rowStart = hazard.distanceMeters +
      hazard.definition.width / 2 * RUNNER_CONFIG.metersPerWorldUnit +
      RUNNER_CONFIG.postJumpCoinLandingClearanceMeters;
    const row = Array.from({ length: RUNNER_CONFIG.postJumpCoinRowCount }, (_, index) => ({
      id: `post-jump-${hazard.patternIndex}-${index}`,
      kind: 'coin' as const,
      distanceMeters: rowStart + index * RUNNER_CONFIG.postJumpCoinRowSpacingMeters,
      heightUnits: 52,
      optionalJump: true,
    }));
    const rowIsSafe = row.every((pickup) => pickup.distanceMeters <= maxDistanceMeters &&
      isPickupDistanceSafe(pickup.distanceMeters, pickup.heightUnits, hazards, horizon) &&
      [...safePickups, ...optionalPickups].every((existing) =>
        Math.abs(existing.distanceMeters - pickup.distanceMeters) >= RUNNER_CONFIG.pickupObjectClearanceMeters));
    if (rowIsSafe) optionalPickups.push(...row);
  }
  const existingPickups = [...safePickups, ...optionalPickups];
  const giantPickups: PickupDefinition[] = [];
  let giantIndex = 0;
  const giantPickupLead = RUNNER_CONFIG.giantPickupLeadMeters;
  for (let waveIndex = 0; ; waveIndex += 1) {
    const wave = getDenseWaveSchedule(waveIndex);
    if (wave.waveStartMeters - giantPickupLead > maxDistanceMeters) break;
    const target = wave.waveStartMeters - giantPickupLead;
    const finalPatternDistance = wave.patternDistances.at(-1)!;
    const fastestMetersPerSecond = MAX_RUN_SPEED_UNITS_PER_SECOND * RUNNER_CONFIG.metersPerWorldUnit;
    if ((finalPatternDistance - target) / fastestMetersPerSecond > RUNNER_CONFIG.giantDurationMs / 1_000) continue;
    const offsets = Array.from(
      { length: RUNNER_CONFIG.giantPickupSearchRadiusMeters * 2 + 1 },
      (_, index) => index - RUNNER_CONFIG.giantPickupSearchRadiusMeters,
    ).sort((left, right) => Math.abs(left) - Math.abs(right) || left - right);
    const distanceMeters = offsets.map((offset) => target + offset).find((candidate) =>
      candidate >= Math.max(SAFE_PICKUP_START_METERS, target - RUNNER_CONFIG.giantPickupSearchRadiusMeters) &&
      candidate <= Math.min(maxDistanceMeters, target + RUNNER_CONFIG.giantPickupSearchRadiusMeters, wave.waveStartMeters - 1) &&
      isPickupDistanceSafe(candidate, 52, hazards, horizon) &&
      [...existingPickups, ...giantPickups].every((pickup) =>
        Math.abs(pickup.distanceMeters - candidate) >= 30),
    );
    if (distanceMeters === undefined) continue;
    giantPickups.push({ id: `giant-${giantIndex++}`, kind: 'giant', distanceMeters,
      heightUnits: 52, optionalJump: false });
  }
  return Object.freeze([...existingPickups, ...giantPickups]
    .sort((left, right) => left.distanceMeters - right.distanceMeters || left.id.localeCompare(right.id)));
}

export const PICKUP_SCHEDULE = generatePickupSchedule(15_000);

export function getPickupBodySize(characterId: CharacterId): number {
  const passive = getCharacterPassive(characterId);
  const radius = passive.id === 'mary-pickup-magnet'
    ? PICKUP_BASE_RADIUS_PX * passive.pickupRadiusMultiplier
    : PICKUP_BASE_RADIUS_PX;
  return Math.round(radius * 2);
}

type ActivePickup = {
  definition: PickupDefinition;
  box: Phaser.GameObjects.Rectangle;
  art: Phaser.GameObjects.Graphics;
  collected: boolean;
};

type GateArt = { distanceMeters: number; art: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text };

export class CollectibleSpawner {
  private nextPickupIndex = 0;
  private activePickupSchedule: readonly PickupDefinition[] = PICKUP_SCHEDULE;
  private scheduledStoryStageId: StoryStageId | null = null;
  private active: ActivePickup[] = [];
  private gates: GateArt[] = [];
  private createdGates = new Set<number>();
  private activeStoryBiome: RunnerBiomeDefinition | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly onPickup: (pickup: PickupDefinition) => void,
    private readonly characterId: CharacterId,
  ) {}

  update(snapshot: RunnerSnapshot): void {
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
    while (this.nextPickupIndex < this.activePickupSchedule.length &&
      this.activePickupSchedule[this.nextPickupIndex].distanceMeters <= snapshot.distanceMeters + visibleLead) {
      this.spawnPickup(this.activePickupSchedule[this.nextPickupIndex]);
      this.nextPickupIndex += 1;
    }
    for (const pickup of [...this.active]) {
      if (pickup.collected) continue;
      const x = this.screenX(pickup.definition.distanceMeters, snapshot.distanceMeters);
      pickup.box.setPosition(x, RUNNER_GROUND_Y - pickup.definition.heightUnits);
      pickup.art.setPosition(x, RUNNER_GROUND_Y - pickup.definition.heightUnits);
      if (x < -20 || snapshot.collectedPickupIds.includes(pickup.definition.id)) this.removePickup(pickup);
    }

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
  }

  destroy(): void {
    for (const pickup of [...this.active]) this.removePickup(pickup);
    for (const gate of this.gates) { gate.art.destroy(); gate.label.destroy(); }
    this.gates = [];
  }

  private screenX(atMeters: number, currentMeters: number): number {
    return RUNNER_PLAYER_X + (atMeters - currentMeters) / METERS_PER_WORLD_UNIT;
  }

  private spawnPickup(definition: PickupDefinition): void {
    const pickupSize = getPickupBodySize(this.characterId);
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
    const active: ActivePickup = { definition, box, art, collected: false };
    this.active.push(active);
    this.scene.physics.add.overlap(this.player, box, () => {
      if (!this.active.includes(active) || active.collected) return;
      active.collected = true;
      // Do not notify React or destroy Arcade bodies while the physics world
      // is iterating overlap pairs. Defer both until the next scene tick.
      this.scene.time.delayedCall(0, () => {
        if (!this.active.includes(active)) return;
        this.onPickup(definition);
        this.removePickup(active);
      });
    });
  }

  private removePickup(pickup: ActivePickup): void {
    this.active = this.active.filter((item) => item !== pickup);
    pickup.box.destroy();
    pickup.art.destroy();
  }
}
