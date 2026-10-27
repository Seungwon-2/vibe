import type Phaser from 'phaser';
import { getHazardGeometry } from './CollisionSystem';
import { getHazardDistance, getPatternForDistance, getPatternStartDistance, isGateClearance,
  METERS_PER_WORLD_UNIT } from './hazardPatterns';
import { isPitClearance, getPitDefinitions } from './PitSpawner';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type { HazardDefinition } from './hazardTypes';
import { RUNNER_PLAYER_X } from './RunnerPlayer';
import type { RunnerSnapshot } from './runnerTypes';
import { getBiomeForDistance } from '../visuals/runnerBiomes';
import { drawRunnerHazard } from '../visuals/runnerHazards';

type ActiveHazard = {
  box: Phaser.GameObjects.Rectangle;
  art: Phaser.GameObjects.Graphics;
  warning: Phaser.GameObjects.Text | null;
  atMeters: number;
  definition: HazardDefinition;
};

export class ObstacleSpawner {
  private nextPatternIndex = 0;
  private pending: { atMeters: number; definition: HazardDefinition }[] = [];
  private active: ActiveHazard[] = [];
  private warnedKinds = new Set<HazardDefinition['kind']>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly onOverlap: () => void,
    private readonly tutorialEnabled: boolean,
  ) {}

  update(snapshot: RunnerSnapshot): void {
    if (snapshot.phase !== 'running') return;
    const visibleLeadMeters = (960 - RUNNER_PLAYER_X) * METERS_PER_WORLD_UNIT;
    while (getPatternStartDistance(this.nextPatternIndex) <= snapshot.distanceMeters + visibleLeadMeters) {
      const base = getPatternStartDistance(this.nextPatternIndex);
      const pattern = getPatternForDistance(base);
      const candidate = pattern.obstacles.map((definition) => ({
        atMeters: getHazardDistance(this.nextPatternIndex, definition), definition,
      }));
      const lastHazardMeters = Math.max(base, ...candidate.map(({ atMeters }) => atMeters));
      const nearbyPits = getPitDefinitions(lastHazardMeters + RUNNER_CONFIG.pitHazardClearanceMeters +
        RUNNER_CONFIG.pitWidthMeters / 2);
      const conflictsWithPit = candidate.some(({ atMeters, definition }) => nearbyPits.some((pit) =>
        isPitClearance(atMeters, pit, RUNNER_CONFIG.pitHazardClearanceMeters +
          definition.width / 2 * RUNNER_CONFIG.metersPerWorldUnit),
      ));
      const conflictsWithGate = candidate.some(({ atMeters, definition }) =>
        RUNNER_GATE_DISTANCES_M.some((gate) => isGateClearance(
          atMeters, gate, definition.width / 2 * RUNNER_CONFIG.metersPerWorldUnit,
        )),
      );
      // Skip an entire authored pattern so action groups cannot be split.
      if (!conflictsWithPit && !conflictsWithGate) this.pending.push(...candidate);
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
      hazard.warning?.setPosition(centerX, geometry.y - 34);
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
    const biome = getBiomeForDistance(atMeters);
    drawRunnerHazard(art, definition, biome);
    const showWarning = this.tutorialEnabled && !this.warnedKinds.has(definition.kind);
    const warning = showWarning ? this.scene.add.text(0, 0,
      definition.kind === 'ground' ? '↑ JUMP' : '↓ SLIDE',
      { color: `#${biome.palette.hazardContrast.toString(16).padStart(6, '0')}`,
        fontSize: '15px', fontFamily: 'monospace',
        backgroundColor: '#fffffff0', padding: { x: 5, y: 2 } },
    ).setOrigin(0.5, 1) : null;
    if (showWarning) this.warnedKinds.add(definition.kind);
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
    hazard.warning?.destroy();
  }
}
