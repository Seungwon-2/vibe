import type Phaser from 'phaser';
import { getHazardGeometry } from './CollisionSystem';
import { getHazardDistance, getPatternForDistance, METERS_PER_WORLD_UNIT,
  PATTERN_SPACING_METERS, PATTERN_START_METERS } from './hazardPatterns';
import type { HazardDefinition } from './hazardTypes';
import { RUNNER_PLAYER_X } from './RunnerPlayer';
import type { RunnerSnapshot } from './runnerTypes';
import { getBiomeForDistance } from '../visuals/runnerBiomes';

type ActiveHazard = {
  box: Phaser.GameObjects.Rectangle;
  art: Phaser.GameObjects.Graphics;
  warning: Phaser.GameObjects.Text;
  atMeters: number;
  definition: HazardDefinition;
};

export class ObstacleSpawner {
  private nextPatternIndex = 0;
  private pending: { atMeters: number; definition: HazardDefinition }[] = [];
  private active: ActiveHazard[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly onOverlap: () => void,
  ) {}

  update(snapshot: RunnerSnapshot): void {
    if (snapshot.phase !== 'running') return;
    const visibleLeadMeters = (960 - RUNNER_PLAYER_X) * METERS_PER_WORLD_UNIT;
    while (PATTERN_START_METERS + this.nextPatternIndex * PATTERN_SPACING_METERS <=
      snapshot.distanceMeters + visibleLeadMeters) {
      const base = PATTERN_START_METERS + this.nextPatternIndex * PATTERN_SPACING_METERS;
      const pattern = getPatternForDistance(base);
      this.pending.push(...pattern.obstacles.map((definition) => ({
        atMeters: getHazardDistance(this.nextPatternIndex, definition), definition,
      })));
      this.nextPatternIndex += 1;
    }

    this.pending = this.pending.filter((entry) => {
      if (entry.atMeters > snapshot.distanceMeters + visibleLeadMeters) return true;
      this.spawn(entry.atMeters, entry.definition);
      return false;
    });

    for (const hazard of [...this.active]) {
      const centerX = RUNNER_PLAYER_X +
        (hazard.atMeters - snapshot.distanceMeters) / METERS_PER_WORLD_UNIT;
      const geometry = getHazardGeometry(hazard.definition, centerX - hazard.definition.width / 2);
      hazard.box.setPosition(centerX, geometry.y + geometry.height / 2);
      hazard.art.setPosition(geometry.x, geometry.y);
      hazard.warning.setPosition(centerX, geometry.y - 34);
      if (geometry.x + geometry.width < 0) this.remove(hazard);
    }
  }

  destroy(): void {
    for (const hazard of [...this.active]) this.remove(hazard);
    this.pending = [];
  }

  private spawn(atMeters: number, definition: HazardDefinition): void {
    const geometry = getHazardGeometry(definition, 960);
    const box = this.scene.add.rectangle(0, 0, geometry.width, geometry.height, 0xffffff, 0);
    this.scene.physics.add.existing(box);
    const body = box.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(geometry.width, geometry.height);
    const art = this.scene.add.graphics();
    const palette = getBiomeForDistance(atMeters).palette;
    const color = definition.kind === 'ground' ? 0xffa64d : 0x47d5f2;
    art.fillStyle(0x10152d).fillRect(0, 0, geometry.width, geometry.height);
    art.fillStyle(palette.hazardContrast).fillRect(0, 0, geometry.width, 4)
      .fillRect(0, geometry.height - 4, geometry.width, 4)
      .fillRect(0, 0, 4, geometry.height).fillRect(geometry.width - 4, 0, 4, geometry.height);
    if (definition.kind === 'ground') {
      art.fillStyle(color).fillRect(7, 25, 12, 11).fillRect(10, 17, 6, 8)
        .fillRect(27, 25, 12, 11).fillRect(30, 17, 6, 8);
    } else {
      art.fillStyle(color).fillRect(6, 10, geometry.width - 12, 5);
      art.fillRect(6, 23, geometry.width - 12, 5);
    }
    const warning = this.scene.add.text(0, 0,
      definition.kind === 'ground' ? '↑ JUMP' : '↓ SLIDE',
      { color: definition.warningColor, fontSize: '15px', fontFamily: 'monospace',
        backgroundColor: '#10152dcc', padding: { x: 5, y: 2 } },
    ).setOrigin(0.5, 1);
    const hazard: ActiveHazard = { box, art, warning, atMeters, definition };
    this.active.push(hazard);
    this.scene.physics.add.overlap(this.player, box, () => {
      if (!this.active.includes(hazard)) return;
      this.onOverlap();
      this.remove(hazard);
    });
  }

  private remove(hazard: ActiveHazard): void {
    this.active = this.active.filter((item) => item !== hazard);
    hazard.box.destroy();
    hazard.art.destroy();
    hazard.warning.destroy();
  }
}
