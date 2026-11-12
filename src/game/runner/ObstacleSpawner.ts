import type Phaser from 'phaser';
import { getHazardCollisionGeometry, getHazardGeometry, getHazardVisualGeometry,
  isHazardDodgedBySlide } from './CollisionSystem';
import { getHazardDistance, getPatternForDistance, getPatternStartDistance, isGateClearance,
  METERS_PER_WORLD_UNIT } from './hazardPatterns';
import { isPitClearance, getPitDefinitions } from './PitSpawner';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type { HazardDefinition } from './hazardTypes';
import type { RunnerEngineCheckpoint, RunnerWorldEntityCheckpoint } from './runnerSessionTypes';
import { RUNNER_PLAYER_X } from './RunnerPlayer';
import type { RunnerSnapshot } from './runnerTypes';
import { getStoryStage } from './storyConfig';
import { getStoryHazardSchedule } from './storyCourses';
import { getBiomeById, getBiomeForDistance } from '../visuals/runnerBiomes';
import { drawRunnerHazard } from '../visuals/runnerHazards';
import { boundsCenter, getCollisionBounds, sweptAabbIntersects, type CollisionBounds } from './sweptCollision';

type ActiveHazard = {
  box: Phaser.GameObjects.Rectangle;
  art: Phaser.GameObjects.Graphics;
  warning: Phaser.GameObjects.Text | null;
  atMeters: number;
  definition: HazardDefinition;
  passed: boolean;
};

function getTutorialLabel(kind: HazardDefinition['kind']): string {
  if (kind === 'double-jump') return 'DOUBLE JUMP';
  return kind === 'ground' ? 'JUMP' : 'SLIDE';
}

export class ObstacleSpawner {
  private nextPatternIndex = 0;
  private pending: { atMeters: number; definition: HazardDefinition }[] = [];
  private active: ActiveHazard[] = [];
  private warnedKinds = new Set<HazardDefinition['kind']>();
  private activeStoryStageId: RunnerSnapshot['storyStageId'] = null;
  private skipPatternAfterDoubleJump = false;
  private previousDistanceMeters: number | null = null;
  private previousPlayerBounds: CollisionBounds | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    private readonly onOverlap: (definition: HazardDefinition) => void,
    private readonly tutorialEnabled: boolean,
    private readonly isGroundedSliding: () => boolean = () => false,
  ) {}

  update(snapshot: RunnerSnapshot): void {
    if (snapshot.phase !== 'running') return;
    this.activeStoryStageId = snapshot.mode === 'story' ? snapshot.storyStageId ?? null : null;
    const visibleLeadMeters = (960 - RUNNER_PLAYER_X) * METERS_PER_WORLD_UNIT;
    if (snapshot.mode === 'story' && snapshot.storyStageId) {
      const course = getStoryHazardSchedule(snapshot.storyStageId);
      while (this.nextPatternIndex < course.length &&
        course[this.nextPatternIndex].distanceMeters <= snapshot.distanceMeters + visibleLeadMeters) {
        const placement = course[this.nextPatternIndex++];
        this.pending.push({ atMeters: placement.distanceMeters, definition: placement.definition });
      }
    } else {
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
        const skipForDoubleJumpRecovery = this.skipPatternAfterDoubleJump;
        if (!conflictsWithPit && !conflictsWithGate && !skipForDoubleJumpRecovery) {
          this.pending.push(...candidate);
        }
        this.skipPatternAfterDoubleJump = !skipForDoubleJumpRecovery && !conflictsWithPit && !conflictsWithGate &&
          pattern.obstacles.some((definition) => definition.kind === 'double-jump');
        this.nextPatternIndex += 1;
      }
    }

    this.pending = this.pending.filter((entry) => {
      if (entry.atMeters > snapshot.distanceMeters + visibleLeadMeters) return true;
      this.spawn(entry.atMeters, entry.definition);
      return false;
    });

    const playerBounds = getCollisionBounds(this.player, 20, 38);
    const previousPlayerBounds = this.previousPlayerBounds ?? playerBounds;
    const previousPlayerCenter = boundsCenter(previousPlayerBounds);
    const playerCenter = boundsCenter(playerBounds);
    const previousDistanceMeters = this.previousDistanceMeters ?? snapshot.distanceMeters;
    for (const hazard of [...this.active]) {
      const centerX = RUNNER_PLAYER_X +
        (hazard.atMeters - snapshot.distanceMeters) / METERS_PER_WORLD_UNIT;
      const geometry = getHazardGeometry(hazard.definition, centerX - hazard.definition.width / 2);
      const collision = getHazardCollisionGeometry(hazard.definition, geometry.x);
      const visual = getHazardVisualGeometry(hazard.definition, geometry.x);
      hazard.box.setPosition(centerX, collision.y + collision.height / 2);
      hazard.art.setPosition(visual.x, visual.y);
      hazard.warning?.setPosition(centerX, geometry.y - 34);
      const previousCenterX = RUNNER_PLAYER_X +
        (hazard.atMeters - previousDistanceMeters) / METERS_PER_WORLD_UNIT;
      const hazardCenterY = collision.y + collision.height / 2;
      if (sweptAabbIntersects(
        previousCenterX - previousPlayerCenter.x,
        hazardCenterY - previousPlayerCenter.y,
        centerX - playerCenter.x,
        hazardCenterY - playerCenter.y,
        collision.width / 2 + (playerBounds.right - playerBounds.left) / 2,
        collision.height / 2 + (playerBounds.bottom - playerBounds.top) / 2,
      )) {
        this.resolveHazard(hazard);
      }
      if (geometry.x + geometry.width < 0) this.remove(hazard);
    }
    this.previousDistanceMeters = snapshot.distanceMeters;
    this.previousPlayerBounds = playerBounds;
  }

  createCheckpoint(): Pick<RunnerEngineCheckpoint,
    'obstacleCursor' | 'obstaclePending' | 'obstacleWarnedKinds' | 'obstacleSkipPatternAfterDoubleJump'> &
    { entities: readonly Extract<RunnerWorldEntityCheckpoint, { kind: 'obstacle' }>[] } {
    return {
      obstacleCursor: this.nextPatternIndex,
      obstaclePending: this.pending.map((entry) => ({ ...entry })),
      obstacleWarnedKinds: [...this.warnedKinds],
      obstacleSkipPatternAfterDoubleJump: this.skipPatternAfterDoubleJump,
      entities: this.active.map((hazard) => ({ kind: 'obstacle',
        id: `${hazard.definition.id}@${hazard.atMeters}`, distanceMeters: hazard.atMeters,
        definition: hazard.definition, passed: hazard.passed })),
    };
  }

  canRestoreCheckpoint(
    checkpoint: ReturnType<ObstacleSpawner['createCheckpoint']>, snapshot: RunnerSnapshot,
  ): boolean {
    if (!Number.isSafeInteger(checkpoint.obstacleCursor) || checkpoint.obstacleCursor < 0 ||
      typeof checkpoint.obstacleSkipPatternAfterDoubleJump !== 'boolean' ||
      !Array.isArray(checkpoint.obstaclePending) || !Array.isArray(checkpoint.obstacleWarnedKinds) ||
      !Array.isArray(checkpoint.entities)) return false;
    const validKinds = ['ground', 'overhead', 'double-jump'];
    const validDefinition = (definition: HazardDefinition) => Boolean(definition) &&
      typeof definition.id === 'string' && definition.id.length > 0 &&
      validKinds.includes(definition.kind) && Number.isFinite(definition.offsetMeters) &&
      Number.isFinite(definition.width) && definition.width > 0 &&
      Number.isFinite(definition.height) && definition.height > 0 &&
      typeof definition.warningColor === 'string';
    if (checkpoint.obstacleWarnedKinds.some((kind) => !validKinds.includes(kind)) ||
      new Set(checkpoint.obstacleWarnedKinds).size !== checkpoint.obstacleWarnedKinds.length ||
      checkpoint.obstaclePending.some((entry) => !entry || !Number.isFinite(entry.atMeters) ||
        !validDefinition(entry.definition))) return false;
    const ids = new Set<string>();
    for (const entity of checkpoint.entities) {
      if (!entity || entity.kind !== 'obstacle' || typeof entity.id !== 'string' ||
        !Number.isFinite(entity.distanceMeters) || typeof entity.passed !== 'boolean' ||
        !validDefinition(entity.definition) || entity.id !== `${entity.definition.id}@${entity.distanceMeters}` ||
        ids.has(entity.id)) return false;
      ids.add(entity.id);
    }
    return snapshot.phase === 'paused';
  }

  restoreCheckpoint(checkpoint: ReturnType<ObstacleSpawner['createCheckpoint']>, snapshot: RunnerSnapshot): boolean {
    if (!this.canRestoreCheckpoint(checkpoint, snapshot)) return false;
    this.nextPatternIndex = checkpoint.obstacleCursor;
    this.pending = checkpoint.obstaclePending.map((entry) => ({ ...entry }));
    this.warnedKinds = new Set(checkpoint.obstacleWarnedKinds);
    this.skipPatternAfterDoubleJump = checkpoint.obstacleSkipPatternAfterDoubleJump;
    this.activeStoryStageId = snapshot.mode === 'story' ? snapshot.storyStageId ?? null : null;
    for (const entity of checkpoint.entities) {
      const hazard = this.spawn(entity.distanceMeters, entity.definition);
      hazard.passed = entity.passed;
      if (entity.passed) (hazard.box.body as Phaser.Physics.Arcade.Body).enable = false;
    }
    this.previousDistanceMeters = snapshot.distanceMeters;
    this.previousPlayerBounds = getCollisionBounds(this.player, 20, 38);
    return true;
  }

  destroy(): void {
    for (const hazard of [...this.active]) this.remove(hazard);
    this.pending = [];
  }

  private spawn(atMeters: number, definition: HazardDefinition): ActiveHazard {
    const collision = getHazardCollisionGeometry(definition, 960 - definition.width / 2);
    const box = this.scene.add.rectangle(0, 0, collision.width, collision.height, 0xffffff, 0);
    this.scene.physics.add.existing(box);
    const body = box.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(collision.width, collision.height);
    const visual = getHazardVisualGeometry(definition, 960 - definition.width / 2);
    const art = this.scene.add.graphics();
    const biome = this.activeStoryStageId
      ? getBiomeById(getStoryStage(this.activeStoryStageId).biomeId)
      : getBiomeForDistance(atMeters);
    drawRunnerHazard(art, definition, biome, visual.height);
    const showWarning = this.tutorialEnabled && !this.warnedKinds.has(definition.kind);
    const warning = showWarning ? this.scene.add.text(0, 0,
      getTutorialLabel(definition.kind),
      { color: `#${biome.palette.hazardContrast.toString(16).padStart(6, '0')}`,
        fontSize: '15px', fontFamily: 'monospace',
        backgroundColor: '#fffffff0', padding: { x: 5, y: 2 } },
    ).setOrigin(0.5, 1) : null;
    if (showWarning) this.warnedKinds.add(definition.kind);
    const hazard: ActiveHazard = { box, art, warning, atMeters, definition, passed: false };
    this.active.push(hazard);
    this.scene.physics.add.overlap(this.player, box, () => {
      this.resolveHazard(hazard);
    });
    return hazard;
  }

  private resolveHazard(hazard: ActiveHazard): void {
    if (!this.active.includes(hazard) || hazard.passed) return;
    if (isHazardDodgedBySlide(hazard.definition, this.isGroundedSliding())) {
      hazard.passed = true;
      (hazard.box.body as Phaser.Physics.Arcade.Body).enable = false;
      return;
    }
    this.onOverlap(hazard.definition);
    this.remove(hazard);
  }

  private remove(hazard: ActiveHazard): void {
    if (!this.active.includes(hazard)) return;
    this.active = this.active.filter((item) => item !== hazard);
    hazard.box.destroy();
    hazard.art.destroy();
    hazard.warning?.destroy();
  }
}
