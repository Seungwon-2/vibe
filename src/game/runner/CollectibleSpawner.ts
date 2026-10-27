import type Phaser from 'phaser';
import { getCharacterPassive } from '../characters/characterAbilities';
import type { CharacterId } from '../characters/characterTypes';
import { RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type { RunnerPickupKind, RunnerSnapshot } from './runnerTypes';
import { METERS_PER_WORLD_UNIT } from './hazardPatterns';
import { RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './RunnerPlayer';
import { getBiomeForDistance } from '../visuals/runnerBiomes';

export type PickupDefinition = Readonly<{
  id: string;
  kind: RunnerPickupKind;
  distanceMeters: number;
  heightUnits: number;
  optionalJump: boolean;
}>;

// The safe row stays inside the standing body. The upper coin row is optional.
export const PICKUP_SCHEDULE: readonly PickupDefinition[] = Object.freeze(
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

export function getPickupBodySize(characterId: CharacterId): number {
  const passive = getCharacterPassive(characterId);
  return 24 + (passive.id === 'hiyori-pickup-magnet' ? passive.radiusPx * 2 : 0);
}

type ActivePickup = {
  definition: PickupDefinition;
  box: Phaser.GameObjects.Rectangle;
  art: Phaser.GameObjects.Graphics;
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
      art.fillStyle(palette.gate, 0.17).fillRoundedRect(-28, -168, 56, 168, 14);
      art.lineStyle(5, palette.gate, 0.9).strokeRoundedRect(-28, -168, 56, 168, 14);
      art.lineStyle(2, palette.hazardContrast, 0.32).lineBetween(-17, -148, -17, -4)
        .lineBetween(17, -148, 17, -4);
      art.fillStyle(palette.accent, 0.95).fillCircle(0, -171, 8);
      const label = this.scene.add.text(0, 0, '+20s',
        { color: '#263d73', fontSize: '15px', fontFamily: 'monospace',
          backgroundColor: '#fffffff0', padding: { x: 4, y: 2 } }).setOrigin(0.5)
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
    const { palette } = biome;
    if (definition.kind === 'coin') {
      art.fillStyle(0xffffff, 0.64).fillCircle(0, 0, 14);
      art.fillStyle(palette.pickupCoin).fillTriangle(0, -11, 5, 0, 0, 11)
        .fillTriangle(-11, 0, 0, -5, 11, 0);
      art.fillStyle(0xffe7aa).fillCircle(0, 0, 3);
    } else {
      art.fillStyle(palette.pickupTime, 0.88).fillRoundedRect(-12, -12, 24, 24, 5);
      art.lineStyle(2, 0xffffff, 0.9).strokeRoundedRect(-11, -11, 22, 22, 5);
      const symbol = biome.id === 'cloud-skyway' ? 0xffffff : 0x12364f;
      art.fillStyle(symbol).fillRect(-2, -8, 4, 16).fillRect(-8, -2, 16, 4);
    }
    const active: ActivePickup = { definition, box, art };
    this.active.push(active);
    this.scene.physics.add.overlap(this.player, box, () => {
      if (!this.active.includes(active)) return;
      this.onPickup(definition);
      this.removePickup(active);
    });
  }

  private removePickup(pickup: ActivePickup): void {
    this.active = this.active.filter((item) => item !== pickup);
    pickup.box.destroy();
    pickup.art.destroy();
  }
}
