import type Phaser from 'phaser';
import { getCharacterPassive } from '../characters/characterAbilities';
import type { CharacterId } from '../characters/characterTypes';
import { RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type { RunnerPickupKind, RunnerSnapshot } from './runnerTypes';
import { getHazardDistance, getPatternForDistance, METERS_PER_WORLD_UNIT,
  PATTERN_SPACING_METERS, PATTERN_START_METERS } from './hazardPatterns';
import { RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './RunnerPlayer';
import { getBiomeForDistance } from '../visuals/runnerBiomes';

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

// The safe row stays inside the standing body. The upper coin row is optional.
const AUTHORED_PICKUP_SCHEDULE: readonly PickupDefinition[] = Object.freeze(
  Array.from({ length: 24 }, (_, index): PickupDefinition[] => {
    const start = 160 + index * 600;
    return [
      { id: `safe-${index}`, kind: index % 4 === 2 ? 'time' : 'coin',
        distanceMeters: start, heightUnits: 52, optionalJump: false },
      { id: `air-${index}`, kind: 'coin', distanceMeters: start + 320,
        heightUnits: 116, optionalJump: true },
    ];
  }).flat(),
);

function getGroundHazardDistances(maxDistanceMeters: number): number[] {
  const patternCount = Math.ceil((maxDistanceMeters - PATTERN_START_METERS) / PATTERN_SPACING_METERS) + 2;
  const distances: number[] = [];
  for (let patternIndex = 0; patternIndex < patternCount; patternIndex += 1) {
    const patternStart = PATTERN_START_METERS + patternIndex * PATTERN_SPACING_METERS;
    const pattern = getPatternForDistance(patternStart);
    for (const hazard of pattern.obstacles) {
      if (hazard.kind === 'ground') distances.push(getHazardDistance(patternIndex, hazard));
    }
  }
  return distances;
}

function movePickupPastGroundHazards(
  pickup: PickupDefinition,
  groundHazards: readonly number[],
): PickupDefinition {
  if (!pickup.optionalJump) return pickup;
  let distanceMeters = pickup.distanceMeters;
  let conflict: number | undefined;
  do {
    conflict = groundHazards.find((hazardDistance) =>
      Math.abs(distanceMeters - hazardDistance) < PICKUP_HAZARD_CLEARANCE_METERS,
    );
    if (conflict !== undefined) distanceMeters = conflict + PICKUP_HAZARD_CLEARANCE_METERS;
  } while (conflict !== undefined);
  return distanceMeters === pickup.distanceMeters ? pickup : { ...pickup, distanceMeters };
}

const GROUND_HAZARD_DISTANCES = getGroundHazardDistances(
  AUTHORED_PICKUP_SCHEDULE.at(-1)!.distanceMeters + PICKUP_HAZARD_CLEARANCE_METERS,
);

export const PICKUP_SCHEDULE: readonly PickupDefinition[] = Object.freeze(
  AUTHORED_PICKUP_SCHEDULE
    .map((pickup) => movePickupPastGroundHazards(pickup, GROUND_HAZARD_DISTANCES))
    .sort((left, right) => left.distanceMeters - right.distanceMeters),
);

export function getPickupBodySize(characterId: CharacterId): number {
  const passive = getCharacterPassive(characterId);
  return 24 + (passive.id === 'hiyori-pickup-magnet' ? passive.radiusPx * 2 : 0);
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
