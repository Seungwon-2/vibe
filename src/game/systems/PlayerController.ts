import type { CharacterAnimationName, CharacterStats } from '../characters/characterTypes';

export type PlayerInput = {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  run: boolean;
};

export type PlayerState = 'idle' | 'moving' | 'jumping' | 'hurt' | 'respawning' | 'gameOver';

type PlayerBody = {
  blocked: { down: boolean };
  touching: { down: boolean };
};

export type ControlledSprite = {
  body: PlayerBody | null;
  setVelocityX(velocity: number): unknown;
  setVelocityY(velocity: number): unknown;
  setPosition(x: number, y: number): unknown;
  setFlipX(flip: boolean): unknown;
};

export type ControlledActor = {
  sprite: ControlledSprite;
  definition: { stats: CharacterStats };
  play(animationName: CharacterAnimationName): void;
};

const RESPAWN_INVULNERABILITY_MS = 1_500;

export class PlayerController {
  state: PlayerState = 'idle';
  private pickupMultiplier = 1;
  private pickupRemainingMs = 0;
  private stageMultiplier = 1;
  private invulnerabilityRemainingMs = 0;

  constructor(private readonly actor: ControlledActor) {}

  update(input: PlayerInput, deltaMs: number): void {
    const elapsed = Math.max(0, deltaMs);
    this.pickupRemainingMs = Math.max(0, this.pickupRemainingMs - elapsed);
    if (this.pickupRemainingMs === 0) this.pickupMultiplier = 1;
    this.invulnerabilityRemainingMs = Math.max(0, this.invulnerabilityRemainingMs - elapsed);

    if (this.state === 'gameOver') return;
    if (this.state === 'respawning' && this.invulnerabilityRemainingMs > 0) return;

    const sprite = this.actor.sprite;
    const body = sprite.body;
    const grounded = Boolean(body?.blocked.down || body?.touching.down);
    const horizontal = Number(input.right) - Number(input.left);
    const baseSpeed = input.run
      ? this.actor.definition.stats.runSpeed
      : this.actor.definition.stats.walkSpeed;
    sprite.setVelocityX(horizontal * baseSpeed * this.pickupMultiplier * this.stageMultiplier);
    if (horizontal !== 0) sprite.setFlipX(horizontal < 0);

    if (grounded && input.jumpPressed) {
      sprite.setVelocityY(this.actor.definition.stats.jumpVelocity);
      this.setState('jumping');
      return;
    }

    if (!grounded) {
      this.setState('jumping');
    } else if (horizontal !== 0) {
      this.setState(input.run ? 'moving' : 'moving');
      this.actor.play(input.run ? 'run' : 'walk');
    } else {
      this.setState('idle');
    }
  }

  respawnAt(x: number, y: number): void {
    this.actor.sprite.setPosition(x, y);
    this.actor.sprite.setVelocityX(0);
    this.actor.sprite.setVelocityY(0);
    this.invulnerabilityRemainingMs = RESPAWN_INVULNERABILITY_MS;
    this.setState('respawning');
    this.actor.play('hurt');
  }

  applySpeedModifier(multiplier: number, durationMs: number): void {
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      throw new Error('Speed multiplier must be a positive finite number.');
    }
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error('Speed effect duration must be a positive finite number.');
    }
    this.pickupMultiplier = multiplier;
    this.pickupRemainingMs = durationMs;
  }

  setStageSpeedMultiplier(multiplier: number): void {
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      throw new Error('Stage speed multiplier must be a positive finite number.');
    }
    this.stageMultiplier = multiplier;
  }

  isInvulnerable(): boolean {
    return this.invulnerabilityRemainingMs > 0;
  }

  getSpeedEffectRemainingMs(): number {
    return this.pickupRemainingMs;
  }

  getCurrentSpeedMultiplier(): number {
    return this.pickupMultiplier * this.stageMultiplier;
  }

  setGameOver(): void {
    this.actor.sprite.setVelocityX(0);
    this.actor.sprite.setVelocityY(0);
    this.setState('gameOver');
    this.actor.play('gameOver');
  }

  private setState(nextState: PlayerState): void {
    if (this.state === nextState) return;
    this.state = nextState;
    if (nextState === 'idle') this.actor.play('idle');
    if (nextState === 'jumping') this.actor.play('jump');
  }
}
