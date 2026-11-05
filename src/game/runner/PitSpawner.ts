import type Phaser from 'phaser';
import { getBiomeById, getBiomeForDistance, type RunnerBiomeDefinition } from '../visuals/runnerBiomes';
import { drawRunnerPit } from '../visuals/runnerCourseObjects';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type { RunnerSnapshot } from './runnerTypes';
import { RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './RunnerPlayer';
import type { PitDefinition } from './pitTypes';
import { getPatternStartDistance } from './hazardPatterns';
import { getStoryStage } from './storyConfig';
import { getStoryPitDefinitions } from './storyPitSchedule';
import { boundsCenter, getCollisionBounds, type CollisionBounds } from './sweptCollision';

export type { PitDefinition } from './pitTypes';

type ActivePit = {
  definition: PitDefinition;
  opening: Phaser.GameObjects.Rectangle | null;
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
  for (let index = 0; ; index += 1) {
    let distanceMeters = RUNNER_CONFIG.endlessWidePitFirstDistanceMeters +
      index * RUNNER_CONFIG.endlessWidePitSpacingMeters;
    if (distanceMeters > maxDistanceMeters) break;
    const minimumSpacing = RUNNER_CONFIG.widePitWidthMeters / 2 + RUNNER_CONFIG.pitHazardClearanceMeters +
      RUNNER_CONFIG.doubleJumpBarrierWidthPx / 2 * RUNNER_CONFIG.metersPerWorldUnit;
    const conflictsWithNarrowPit = (candidate: number) => pits.some((pit) => Math.abs(
      pit.distanceMeters - candidate,
    ) <= pit.widthMeters / 2 + RUNNER_CONFIG.widePitWidthMeters / 2 +
      RUNNER_CONFIG.pitHazardClearanceMeters);
    const conflictsWithHazard = (candidate: number) => {
      for (let patternIndex = 0; ; patternIndex += 1) {
        const start = getPatternStartDistance(patternIndex);
        if (start > candidate + minimumSpacing) return false;
        if (Math.abs(start - candidate) <= minimumSpacing) return true;
      }
    };
    while (distanceMeters <= maxDistanceMeters && (
      RUNNER_GATE_DISTANCES_M.some((gate) => Math.abs(gate - distanceMeters) <=
        RUNNER_CONFIG.gateClearanceMeters + RUNNER_CONFIG.widePitWidthMeters / 2) ||
      conflictsWithNarrowPit(distanceMeters) || conflictsWithHazard(distanceMeters))) {
      distanceMeters += 25;
    }
    if (distanceMeters <= maxDistanceMeters) {
      pits.push({ id: `wide-pit-${distanceMeters}`, distanceMeters,
        widthMeters: RUNNER_CONFIG.widePitWidthMeters, tutorialWarning: index === 0 });
    }
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
  private activeStoryBiome: RunnerBiomeDefinition | null = null;
  private previousDistanceMeters: number | null = null;
  private previousPlayerBounds: CollisionBounds | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly onPitFall: (pit: PitDefinition) => PitFallContactResult,
    private readonly tutorialEnabled = false,
  ) {}

  isPlayerFootInPitOpening(footX: number): boolean {
    return this.active.some((pit) => {
      if (!pit.opening) return false;
      const halfWidth = pit.definition.widthMeters / RUNNER_CONFIG.metersPerWorldUnit / 2;
      return footX >= pit.opening.x - halfWidth && footX <= pit.opening.x + halfWidth;
    });
  }

  update(snapshot: RunnerSnapshot): void {
    if (snapshot.phase !== 'running') return;
    const visibleLeadMeters = (960 - RUNNER_PLAYER_X) * RUNNER_CONFIG.metersPerWorldUnit;
    this.activeStoryBiome = snapshot.mode === 'story' && snapshot.storyStageId
      ? getBiomeById(getStoryStage(snapshot.storyStageId).biomeId) : null;
    const visiblePits = snapshot.mode === 'story' && snapshot.storyStageId
      ? getStoryPitDefinitions(snapshot.storyStageId, snapshot.distanceMeters + visibleLeadMeters)
      : getPitDefinitions(snapshot.distanceMeters + visibleLeadMeters);
    while (this.nextPitIndex < visiblePits.length) {
      const pit = visiblePits[this.nextPitIndex];
      this.nextPitIndex += 1;
      if (pit.distanceMeters + pit.widthMeters / 2 < snapshot.distanceMeters) continue;
      this.spawn(pit);
    }

    const playerBounds = getCollisionBounds(this.player, 20, 38);
    const previousPlayerBounds = this.previousPlayerBounds ?? playerBounds;
    const currentFootX = boundsCenter(playerBounds).x;
    const previousFootX = boundsCenter(previousPlayerBounds).x;
    const previousDistanceMeters = this.previousDistanceMeters ?? snapshot.distanceMeters;
    for (const pit of [...this.active]) {
      if (pit.resolved && pit.retainArtUntilDestroy) continue;
      if (pit.resolved) {
        this.remove(pit);
        continue;
      }
      if (!pit.opening) continue;
      const x = this.screenX(pit.definition.distanceMeters, snapshot.distanceMeters);
      pit.opening.setPosition(x, RUNNER_GROUND_Y - 1);
      pit.art.setPosition(x, RUNNER_GROUND_Y);
      if (pit.warning) {
        const remainingMeters = pit.definition.distanceMeters - snapshot.distanceMeters;
        const visible = remainingMeters <= RUNNER_CONFIG.tutorialPitWarningLeadMeters &&
          remainingMeters >= -pit.definition.widthMeters / 2;
        pit.warning.setVisible(visible);
        pit.warning.setPosition(Math.min(900, Math.max(52, x)), RUNNER_GROUND_Y - 48);
      }
      const previousOpeningX = this.screenX(pit.definition.distanceMeters, previousDistanceMeters);
      const relativeStart = previousOpeningX - previousFootX;
      const relativeEnd = x - currentFootX;
      const crossedOpening = Math.min(relativeStart, relativeEnd) <=
        pit.definition.widthMeters / RUNNER_CONFIG.metersPerWorldUnit / 2 &&
        Math.max(relativeStart, relativeEnd) >=
        -pit.definition.widthMeters / RUNNER_CONFIG.metersPerWorldUnit / 2;
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      const reachedPitFloor = body.bottom >= RUNNER_GROUND_Y - 2 && body.velocity.y >= 0;
      if (this.hasDroppedInto(pit) || (crossedOpening && reachedPitFloor)) this.resolveContact(pit);
      else if (x + pit.definition.widthMeters / RUNNER_CONFIG.metersPerWorldUnit / 2 < -24) {
        this.remove(pit);
      }
    }
    this.previousDistanceMeters = snapshot.distanceMeters;
    this.previousPlayerBounds = playerBounds;
  }

  destroy(): void {
    for (const pit of [...this.active]) this.remove(pit);
  }

  private screenX(atMeters: number, currentMeters: number): number {
    return RUNNER_PLAYER_X + (atMeters - currentMeters) / RUNNER_CONFIG.metersPerWorldUnit;
  }

  private spawn(definition: PitDefinition): void {
    const width = definition.widthMeters / RUNNER_CONFIG.metersPerWorldUnit;
    const opening = this.scene.add.rectangle(0, RUNNER_GROUND_Y - 1, width, ZONE_HEIGHT, 0xffffff, 0)
      .setOrigin(0.5);

    const biome = this.activeStoryBiome ?? getBiomeForDistance(definition.distanceMeters);
    const art = this.scene.add.graphics().setDepth(-1);
    drawRunnerPit(art, width, biome);

    const warning = this.tutorialEnabled && definition.tutorialWarning
      ? this.scene.add.text(0, RUNNER_GROUND_Y - 48,
        definition.widthMeters >= RUNNER_CONFIG.storyWidePitWidthMeters ? 'DOUBLE JUMP' : 'JUMP THE GAP', {
        color: `#${biome.palette.hazardContrast.toString(16).padStart(6, '0')}`,
        backgroundColor: '#fff8e8', fontSize: '14px', fontFamily: 'sans-serif',
        padding: { x: 8, y: 5 },
      }).setOrigin(0.5).setDepth(WARNING_DEPTH).setVisible(false)
      : null;

    const active: ActivePit = {
      definition, opening, art, warning, resolved: false, retainArtUntilDestroy: false,
    };
    this.active.push(active);
  }

  private hasDroppedInto(pit: ActivePit): boolean {
    if (!pit.opening || pit.resolved) return false;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const footX = (body.left + body.right) / 2;
    return this.isPlayerFootInPitOpening(footX) &&
      body.bottom >= RUNNER_GROUND_Y - 2 && body.velocity.y >= 0;
  }

  private resolveContact(pit: ActivePit): void {
    if (pit.resolved || !this.active.includes(pit)) return;
    pit.resolved = true;
    this.removeOpening(pit);
    const result = this.onPitFall(pit.definition);
    if (result === 'fatal') {
      pit.retainArtUntilDestroy = true;
      return;
    }
    this.remove(pit);
  }

  private removeOpening(pit: ActivePit): void {
    pit.opening?.destroy();
    pit.opening = null;
    pit.warning?.destroy();
    pit.warning = null;
  }

  private remove(pit: ActivePit): void {
    this.active = this.active.filter((item) => item !== pit);
    this.removeOpening(pit);
    pit.art.destroy();
  }
}
