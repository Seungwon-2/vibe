import type Phaser from 'phaser';
import { RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type { RunnerPickupKind, RunnerSnapshot } from './runnerTypes';
import { METERS_PER_WORLD_UNIT } from './hazardPatterns';
import { RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './RunnerPlayer';

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
      const art = this.scene.add.graphics();
      art.lineStyle(5, 0xf5cf72).strokeRect(-18, -122, 36, 122);
      art.fillStyle(0xffdb8a, 0.2).fillRect(-15, -119, 30, 116);
      const label = this.scene.add.text(0, 0, '+20s',
        { color: '#ffe6a7', fontSize: '15px', fontFamily: 'monospace' }).setOrigin(0.5);
      this.gates.push({ distanceMeters, art, label });
    }
    for (const gate of [...this.gates]) {
      const x = this.screenX(gate.distanceMeters, snapshot.distanceMeters);
      gate.art.setPosition(x, RUNNER_GROUND_Y);
      gate.label.setPosition(x, RUNNER_GROUND_Y - 138);
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
    const box = this.scene.add.rectangle(0, 0, 24, 24, 0xffffff, 0);
    this.scene.physics.add.existing(box);
    const body = box.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    const art = this.scene.add.graphics();
    if (definition.kind === 'coin') {
      art.fillStyle(0xf4c95b).fillCircle(0, 0, 12);
      art.lineStyle(3, 0xffeeac).strokeCircle(0, 0, 10);
      art.fillStyle(0x9b6b23).fillRect(-2, -6, 4, 12);
    } else {
      art.fillStyle(0x55deec).fillRect(-12, -12, 24, 24);
      art.lineStyle(3, 0xc8f8f8).strokeRect(-11, -11, 22, 22);
      art.fillStyle(0xffffff).fillRect(-2, -7, 4, 14).fillRect(-7, -2, 14, 4);
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
