import type Phaser from 'phaser';
import { getCharacterPassive } from '../characters/characterAbilities';
import type { CharacterId } from '../characters/characterTypes';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type { RunnerPickupKind, RunnerSnapshot } from './runnerTypes';
import { getHazardDistance, getPatternForDistance, getPatternStartDistance, METERS_PER_WORLD_UNIT } from './hazardPatterns';
import { RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './RunnerPlayer';
import { getBiomeForDistance } from '../visuals/runnerBiomes';
import { getPitDefinitions, isPitClearance } from './PitSpawner';

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

  art.fillStyle(p.pickupTime).fillRoundedRect(-11, -11, 22, 22, 6);
  art.lineStyle(2, p.hazardContrast, 0.96).strokeRoundedRect(-11, -11, 22, 22, 6);
  art.fillStyle(p.groundFace).fillCircle(0, 0, 7);
  art.lineStyle(2, p.hazardContrast, 0.96).strokeCircle(0, 0, 7)
    .lineBetween(0, -4, 0, 0).lineBetween(0, 0, 3, 2);
  art.fillStyle(p.accent).fillCircle(7, -7, 2);
}

// Keep authored pickup positions out of the player's collision window around
// ground hazards, including when future hazard patterns are added or changed.
export const PICKUP_HAZARD_CLEARANCE_METERS = 40;

// The standing-height row is frequent and predictable; elevated coins remain
// optional and can be skipped when the authored course has no safe placement.
const SAFE_PICKUP_START_METERS = 160;
const SAFE_PICKUP_SPACING_METERS = RUNNER_CONFIG.safePickupSpacingMeters;

function getGroundHazardDistances(maxDistanceMeters: number): number[] {
  const distances: number[] = [];
  for (let patternIndex = 0; ; patternIndex += 1) {
    const patternStart = getPatternStartDistance(patternIndex);
    if (patternStart > maxDistanceMeters) break;
    const pattern = getPatternForDistance(patternStart);
    for (const hazard of pattern.obstacles) {
      if (hazard.kind === 'ground') distances.push(getHazardDistance(patternIndex, hazard));
    }
  }
  return distances;
}

function isPickupDistanceSafe(distanceMeters: number, groundHazards: readonly number[], maxDistanceMeters: number): boolean {
  if (groundHazards.some((hazard) => Math.abs(distanceMeters - hazard) < PICKUP_HAZARD_CLEARANCE_METERS)) {
    return false;
  }
  if (getPitDefinitions(maxDistanceMeters).some((pit) =>
    isPitClearance(distanceMeters, pit, PICKUP_HAZARD_CLEARANCE_METERS))) return false;
  return RUNNER_GATE_DISTANCES_M.every((gate) =>
    Math.abs(distanceMeters - gate) >= PICKUP_HAZARD_CLEARANCE_METERS);
}

function nearestSafeDistance(
  targetMeters: number,
  minimumMeters: number,
  maximumMeters: number,
  groundHazards: readonly number[],
  maxDistanceMeters: number,
): number | undefined {
  const candidates = Array.from(
    { length: Math.max(0, Math.floor(maximumMeters) - Math.ceil(minimumMeters) + 1) },
    (_, index) => Math.ceil(minimumMeters) + index,
  ).sort((left, right) => Math.abs(left - targetMeters) - Math.abs(right - targetMeters) || left - right);
  return candidates.find((distance) => isPickupDistanceSafe(distance, groundHazards, maxDistanceMeters));
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
export function generatePickupSchedule(maxDistanceMeters: number): readonly PickupDefinition[] {
  if (!Number.isFinite(maxDistanceMeters) || maxDistanceMeters < SAFE_PICKUP_START_METERS) return [];
  const groundHazards = getGroundHazardDistances(maxDistanceMeters + PICKUP_HAZARD_CLEARANCE_METERS);
  const pits = getPitDefinitions(maxDistanceMeters + PICKUP_HAZARD_CLEARANCE_METERS);
  // isPickupDistanceSafe accepts a horizon for pit enumeration; include the
  // clearance beyond the requested end so a pit just outside the range counts.
  const horizon = Math.max(maxDistanceMeters, pits.at(-1)?.distanceMeters ?? 0) +
    PICKUP_HAZARD_CLEARANCE_METERS;
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
    const distanceMeters = nearestSafeDistance(target, localMinimum, preferredMaximum, groundHazards, horizon) ??
      (preferredMaximum < localMaximum
        ? nearestSafeDistance(target, Math.max(localMinimum, preferredMaximum + 1), localMaximum, groundHazards, horizon)
        : undefined);
    if (distanceMeters === undefined) continue;
    const kind = timeSlots.has(index) ? 'time' : 'coin';
    safePickups.push({ id: kind === 'time' ? `time-${index}` : `safe-${index}`, kind,
      distanceMeters, heightUnits: 52, optionalJump: false });
  }

  const optionalPickups: PickupDefinition[] = [];
  for (let distanceMeters = 480; distanceMeters <= maxDistanceMeters;
    distanceMeters += RUNNER_CONFIG.optionalJumpCoinSpacingMeters) {
    if (!isPickupDistanceSafe(distanceMeters, groundHazards, horizon)) continue;
    optionalPickups.push({ id: `air-${Math.round((distanceMeters - 480) / RUNNER_CONFIG.optionalJumpCoinSpacingMeters)}`,
      kind: 'coin', distanceMeters, heightUnits: 116, optionalJump: true });
  }
  return Object.freeze([...safePickups, ...optionalPickups]
    .sort((left, right) => left.distanceMeters - right.distanceMeters || left.id.localeCompare(right.id)));
}

export const PICKUP_SCHEDULE = generatePickupSchedule(15_000);

export function getPickupBodySize(characterId: CharacterId): number {
  const passive = getCharacterPassive(characterId);
  return 24 + (characterId === 'tokino-mary' && 'radiusPx' in passive ? passive.radiusPx * 2 : 0);
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
  private active: ActivePickup[] = [];
  private gates: GateArt[] = [];
  private createdGates = new Set<number>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly onPickup: (pickup: PickupDefinition) => void,
    private readonly characterId: CharacterId,
  ) {}

  update(snapshot: RunnerSnapshot): void {
    if (snapshot.phase !== 'running') return;
    const visibleLead = (960 - RUNNER_PLAYER_X) * METERS_PER_WORLD_UNIT;
    while (this.nextPickupIndex < PICKUP_SCHEDULE.length &&
      PICKUP_SCHEDULE[this.nextPickupIndex].distanceMeters <= snapshot.distanceMeters + visibleLead) {
      this.spawnPickup(PICKUP_SCHEDULE[this.nextPickupIndex]);
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
      if (distanceMeters > snapshot.distanceMeters + visibleLead ||
        this.createdGates.has(distanceMeters) ||
        snapshot.distanceMeters > distanceMeters + 100) continue;
      this.createdGates.add(distanceMeters);
      const { palette, landmark } = getBiomeForDistance(distanceMeters);
      const art = this.scene.add.graphics().setDepth(-5);
      // Landmark is a non-colliding arch aligned with the existing +20s gate.
      art.fillStyle(palette.gate, 0.22).fillRoundedRect(-28, -168, 56, 168, 14);
      art.lineStyle(5, palette.gate, 0.96).strokeRoundedRect(-28, -168, 56, 168, 14);
      art.lineStyle(2, palette.hazardContrast, 0.56).lineBetween(-17, -148, -17, -4)
        .lineBetween(17, -148, 17, -4);
      art.fillStyle(palette.groundFace).fillCircle(0, -108, 19);
      art.lineStyle(2, palette.hazardContrast, 0.92).strokeCircle(0, -108, 19);
      switch (getBiomeForDistance(distanceMeters).id) {
        case 'dawn-city':
          art.fillStyle(palette.accent).fillCircle(0, -108, 8);
          art.lineStyle(2, palette.hazardContrast).lineBetween(-11, -98, 11, -98);
          for (const x of [-12, 12]) art.lineBetween(x, -116, x, -120);
          break;
        case 'moonlit-forest':
          art.fillStyle(palette.accent).fillEllipse(0, -108, 13, 8);
          art.lineStyle(2, palette.hazardContrast).lineBetween(-5, -103, 5, -113);
          break;
        case 'crystal-mine':
          art.fillStyle(palette.accent).fillTriangle(-9, -100, 0, -117, 9, -100);
          art.fillStyle(palette.hazardContrast).fillTriangle(-4, -101, 1, -111, 5, -101);
          break;
        case 'cloud-skyway':
          art.fillStyle(palette.accent).fillTriangle(0, -119, 3, -110, 0, -107)
            .fillTriangle(10, -108, 1, -105, 0, -108)
            .fillTriangle(0, -97, -3, -106, 0, -108)
            .fillTriangle(-10, -108, -1, -111, 0, -108);
          break;
      }
      const label = this.scene.add.text(0, 0, '+20s',
        { color: `#${palette.hazardContrast.toString(16).padStart(6, '0')}`,
          fontSize: '15px', fontFamily: 'monospace',
          backgroundColor: '#fffffff0', padding: { x: 5, y: 3 } }).setOrigin(0.5)
        .setDepth(5);
      label.setText(`${landmark}  +20s`);
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
    const art = this.scene.add.graphics();
    const biome = getBiomeForDistance(definition.distanceMeters);
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
