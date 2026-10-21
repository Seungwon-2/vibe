export type RunStateSnapshot = {
  lives: number;
  worldId: string;
  stageId: string;
  checkpointId: string;
  stageScore: number;
  coins: number;
  enemyStomps: number;
  extraLifeOverflow: number;
  elapsedMs: number;
  unlockedStageOrdinal: number;
};

export type DamageResult = {
  accepted: boolean;
  lives: number;
  checkpointId: string;
  shouldRespawn: boolean;
  gameOver: boolean;
};

export type CheckpointSaveEvent = {
  type: 'checkpoint-save';
  checkpointId: string;
  snapshot: RunStateSnapshot;
};

const STARTING_LIVES = 5;
const MAX_LIVES = 9;
const INVULNERABILITY_MS = 1_500;

export class RunState {
  private invulnerabilityRemainingMs = 0;
  private stageCleared = false;
  private stageOrdinal: number;

  private current: RunStateSnapshot;

  constructor(worldId: string, stageId: string, stageOrdinal = 1, startingLives = STARTING_LIVES) {
    if (!worldId.trim() || !stageId.trim()) throw new Error('World and stage ids must not be empty.');
    this.stageOrdinal = stageOrdinal;
    this.current = {
      lives: Math.min(MAX_LIVES, Math.max(1, startingLives)),
      worldId,
      stageId,
      checkpointId: 'start',
      stageScore: 0,
      coins: 0,
      enemyStomps: 0,
      extraLifeOverflow: 0,
      elapsedMs: 0,
      unlockedStageOrdinal: stageOrdinal,
    };
  }

  snapshot(): RunStateSnapshot {
    return { ...this.current };
  }

  tick(deltaMs: number): void {
    const elapsed = Math.max(0, deltaMs);
    this.current.elapsedMs += elapsed;
    this.invulnerabilityRemainingMs = Math.max(0, this.invulnerabilityRemainingMs - elapsed);
  }

  activateCheckpoint(checkpointId: string): CheckpointSaveEvent | null {
    if (!checkpointId.trim()) throw new Error('Checkpoint id must not be empty.');
    if (this.current.checkpointId === checkpointId) return null;
    this.current.checkpointId = checkpointId;
    return { type: 'checkpoint-save', checkpointId, snapshot: this.snapshot() };
  }

  loseLife(): DamageResult {
    if (this.current.lives === 0) {
      return {
        accepted: false,
        lives: 0,
        checkpointId: this.current.checkpointId,
        shouldRespawn: false,
        gameOver: true,
      };
    }
    if (this.invulnerabilityRemainingMs > 0) {
      return {
        accepted: false,
        lives: this.current.lives,
        checkpointId: this.current.checkpointId,
        shouldRespawn: false,
        gameOver: false,
      };
    }

    this.current.lives = Math.max(0, this.current.lives - 1);
    if (this.current.lives === 0) {
      return {
        accepted: true,
        lives: 0,
        checkpointId: this.current.checkpointId,
        shouldRespawn: false,
        gameOver: true,
      };
    }

    this.invulnerabilityRemainingMs = INVULNERABILITY_MS;
    return {
      accepted: true,
      lives: this.current.lives,
      checkpointId: this.current.checkpointId,
      shouldRespawn: true,
      gameOver: false,
    };
  }

  collectCoin(): void {
    this.current.coins += 1;
    this.recalculateScore();
  }

  recordEnemyStomp(): void {
    this.current.enemyStomps += 1;
    this.recalculateScore();
  }

  collectExtraLife(): { lives: number; overflowAwarded: boolean } {
    if (this.current.lives < MAX_LIVES) {
      this.current.lives += 1;
      return { lives: this.current.lives, overflowAwarded: false };
    }
    this.current.extraLifeOverflow += 1;
    this.recalculateScore();
    return { lives: this.current.lives, overflowAwarded: true };
  }

  markStageCleared(nextStageOrdinal = this.stageOrdinal + 1): void {
    if (this.stageCleared) return;
    this.stageCleared = true;
    this.current.unlockedStageOrdinal = Math.max(this.current.unlockedStageOrdinal, nextStageOrdinal);
    this.recalculateScore();
  }

  startNextStage(stageId: string, stageOrdinal: number): void {
    this.current.stageId = stageId;
    this.stageOrdinal = stageOrdinal;
    this.current.checkpointId = 'start';
    this.current.stageScore = 0;
    this.current.coins = 0;
    this.current.enemyStomps = 0;
    this.current.extraLifeOverflow = 0;
    this.current.elapsedMs = 0;
    this.current.unlockedStageOrdinal = Math.max(this.current.unlockedStageOrdinal, stageOrdinal);
    this.invulnerabilityRemainingMs = 0;
    this.stageCleared = false;
  }

  startNewWorld(worldId: string, stageId: string, stageOrdinal = 1): void {
    this.current.lives = STARTING_LIVES;
    this.current.worldId = worldId;
    this.current.unlockedStageOrdinal = stageOrdinal;
    this.startNextStage(stageId, stageOrdinal);
  }

  restartCurrentStage(): void {
    this.current.lives = STARTING_LIVES;
    this.current.checkpointId = 'start';
    this.current.stageScore = 0;
    this.current.coins = 0;
    this.current.enemyStomps = 0;
    this.current.extraLifeOverflow = 0;
    this.current.elapsedMs = 0;
    this.invulnerabilityRemainingMs = 0;
    this.stageCleared = false;
  }

  isInvulnerable(): boolean {
    return this.invulnerabilityRemainingMs > 0;
  }

  isStageCleared(): boolean {
    return this.stageCleared;
  }

  private recalculateScore(): void {
    this.current.stageScore = calculateStageScore(this.current, this.stageCleared);
  }
}

export function calculateStageScore(state: RunStateSnapshot, stageCleared = false): number {
  return state.coins * 100 + state.enemyStomps * 200 +
    (stageCleared ? 500 : 0) + state.extraLifeOverflow * 1_000;
}
