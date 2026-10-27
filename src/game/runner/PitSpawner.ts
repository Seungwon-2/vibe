import type Phaser from 'phaser';
import { getBiomeForDistance } from '../visuals/runnerBiomes';
import { drawRunnerPit } from '../visuals/runnerCourseObjects';
import { RUNNER_CONFIG } from './runnerConfig';
import type { RunnerSnapshot } from './runnerTypes';
import { RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './RunnerPlayer';
import type { PitDefinition } from './pitTypes';

export type { PitDefinition } from './pitTypes';

type ActivePit = {
  definition: PitDefinition;
  zone: Phaser.GameObjects.Rectangle | null;
  art: Phaser.GameObjects.Graphics;
  warning: Phaser.GameObjects.Text | null;
  resolved: boolean;
  retainArtUntilDestroy: boolean;
};

export type PitFallContactResult = 'fatal' | 'rescued' | 'ignored';

const ZONE_HEIGHT = 4;
const WARNING_DEPTH = 12;

export function getPitDefinitions(maxDistanceMeters: number): readonly PitDefinition[] {
  if (!Number.isFinite(maxDistanceMeters) || maxDistanceMeters < RUNNER_CONFIG.firstPitDistanceMeters) {
    return [];
  }
  const pits: PitDefinition[] = [];
  for (let distanceMeters = RUNNER_CONFIG.firstPitDistanceMeters;
    distanceMeters <= maxDistanceMeters;
    distanceMeters += RUNNER_CONFIG.pitSpacingMeters) {
    pits.push({
      id: `pit-${distanceMeters}`,
      distanceMeters,
      widthMeters: RUNNER_CONFIG.pitWidthMeters,
      tutorialWarning: distanceMeters === RUNNER_CONFIG.firstPitDistanceMeters,
    });
  }
  return pits;
}

export function isPitClearance(
  distanceMeters: number,
  pit: PitDefinition,
  clearanceMeters: number = RUNNER_CONFIG.pitHazardClearanceMeters,
): boolean {
  return Math.abs(distanceMeters - pit.distanceMeters) <=
    pit.widthMeters / 2 + Math.max(0, clearanceMeters);
}

export class PitSpawner {
  private nextPitIndex = 0;
  private active: ActivePit[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly isGrounded: () => boolean,
    private readonly onPitFall: (pit: PitDefinition) => PitFallContactResult,
  ) {}

  update(snapshot: RunnerSnapshot): void {
    if (snapshot.phase !== 'running') return;
    const visibleLeadMeters = (960 - RUNNER_PLAYER_X) * RUNNER_CONFIG.metersPerWorldUnit;
    const visiblePits = getPitDefinitions(snapshot.distanceMeters + visibleLeadMeters);
    while (this.nextPitIndex < visiblePits.length) {
      const pit = visiblePits[this.nextPitIndex];
      this.nextPitIndex += 1;
      if (pit.distanceMeters + pit.widthMeters / 2 < snapshot.distanceMeters) continue;
      this.spawn(pit);
    }

    for (const pit of [...this.active]) {
      if (pit.resolved && pit.retainArtUntilDestroy) continue;
      if (pit.resolved) {
        this.remove(pit);
        continue;
      }
      if (!pit.zone) continue;
      const x = this.screenX(pit.definition.distanceMeters, snapshot.distanceMeters);
      pit.zone.setPosition(x, RUNNER_GROUND_Y - 1);
      pit.art.setPosition(x, RUNNER_GROUND_Y);
      if (pit.warning) {
        const remainingMeters = pit.definition.distanceMeters - snapshot.distanceMeters;
        const visible = remainingMeters <= RUNNER_CONFIG.tutorialPitWarningLeadMeters &&
          remainingMeters >= -pit.definition.widthMeters / 2;
        pit.warning.setVisible(visible);
        pit.warning.setPosition(Math.min(900, Math.max(52, x)), RUNNER_GROUND_Y - 48);
      }
      if (x + pit.definition.widthMeters / RUNNER_CONFIG.metersPerWorldUnit / 2 < -24) {
        this.remove(pit);
      }
    }
  }

  destroy(): void {
    for (const pit of [...this.active]) this.remove(pit);
  }

  private screenX(atMeters: number, currentMeters: number): number {
    return RUNNER_PLAYER_X + (atMeters - currentMeters) / RUNNER_CONFIG.metersPerWorldUnit;
  }

  private spawn(definition: PitDefinition): void {
    const width = definition.widthMeters / RUNNER_CONFIG.metersPerWorldUnit;
    const zone = this.scene.add.rectangle(0, RUNNER_GROUND_Y - 1, width, ZONE_HEIGHT, 0xffffff, 0)
      .setOrigin(0.5);
    this.scene.physics.add.existing(zone);
    const body = zone.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    const biome = getBiomeForDistance(definition.distanceMeters);
    const art = this.scene.add.graphics().setDepth(-1);
    drawRunnerPit(art, width, biome);

    const warning = definition.tutorialWarning
      ? this.scene.add.text(0, RUNNER_GROUND_Y - 48, '낭떠러지! 점프하세요', {
        color: `#${biome.palette.hazardContrast.toString(16).padStart(6, '0')}`,
        backgroundColor: '#fff8e8', fontSize: '14px', fontFamily: 'sans-serif',
        padding: { x: 8, y: 5 },
      }).setOrigin(0.5).setDepth(WARNING_DEPTH).setVisible(false)
      : null;

    const active: ActivePit = {
      definition, zone, art, warning, resolved: false, retainArtUntilDestroy: false,
    };
    this.active.push(active);
    this.scene.physics.add.overlap(this.player, zone, () => {
      if (active.resolved || !this.active.includes(active)) return;
      active.resolved = true;
      const groundedAtContact = this.isGrounded();
      this.scene.time.delayedCall(0, () => {
        if (!this.active.includes(active)) return;
        if (groundedAtContact) {
          this.removeSensor(active);
          const result = this.onPitFall(definition);
          if (result === 'fatal') {
            active.retainArtUntilDestroy = true;
            return;
          }
        }
        this.remove(active);
      });
    });
  }

  private removeSensor(pit: ActivePit): void {
    pit.zone?.destroy();
    pit.zone = null;
    pit.warning?.destroy();
    pit.warning = null;
  }

  private remove(pit: ActivePit): void {
    this.active = this.active.filter((item) => item !== pit);
    this.removeSensor(pit);
    pit.art.destroy();
  }
}
