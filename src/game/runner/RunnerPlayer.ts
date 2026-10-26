import type Phaser from 'phaser';
import { getCharacter } from '../characters/characterCatalog';
import { getCharacterPassive } from '../characters/characterAbilities';
import type { CharacterAnimationName, CharacterId } from '../characters/characterTypes';

export const RUNNER_PLAYER_X = 170;
export const RUNNER_GROUND_Y = 470;
const JUMP_IMPULSE = -420;
const BODY_WIDTH = 40;
const STANDING_HEIGHT = 76;
const SLIDING_HEIGHT = 40;

export class RunnerPlayer {
  private jumpsUsed = 0;
  private grounded = true;
  private slidingHeld = false;
  private slideGraceMs = 0;
  private hurt = false;
  private finished = false;
  private animation: CharacterAnimationName | null = null;
  private bodyHeight = 0;
  private readonly passive;
  private readonly character;

  constructor(
    private readonly sprite: Phaser.Physics.Arcade.Sprite,
    private readonly characterId: CharacterId,
  ) {
    this.passive = getCharacterPassive(characterId);
    this.character = getCharacter(characterId);
    sprite.setOrigin(0.5, 1);
    sprite.setPosition(RUNNER_PLAYER_X, RUNNER_GROUND_Y);
    this.setBodyHeight(STANDING_HEIGHT);
    this.play('run');
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  get gameObject(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  get isSliding(): boolean {
    return this.slidingHeld && this.grounded || this.slideGraceMs > 0 && this.grounded;
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  jump(): boolean {
    if (this.finished || this.hurt || this.isSliding || this.jumpsUsed >= 2) return false;
    if (!this.grounded && this.jumpsUsed === 0) this.jumpsUsed = 1;
    const second = this.jumpsUsed === 1;
    const multiplier = second && this.passive.id === 'double-jump-impulse'
      ? this.passive.multiplier : 1;
    this.body.setVelocityY(JUMP_IMPULSE * multiplier);
    this.jumpsUsed += 1;
    this.grounded = false;
    this.slideGraceMs = 0;
    this.play(second ? 'doubleJump' : 'jump');
    return true;
  }

  setSliding(held: boolean): void {
    if (this.finished || this.hurt) return;
    if (held && !this.grounded) return;
    if (!held && this.slidingHeld && this.passive.id === 'slide-release-grace') {
      this.slideGraceMs = this.passive.graceMs;
    }
    this.slidingHeld = held;
    this.setBodyHeight(this.isSliding ? SLIDING_HEIGHT : STANDING_HEIGHT);
  }

  setHurt(hurt: boolean): void {
    if (this.finished) return;
    this.hurt = hurt;
  }

  finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.slidingHeld = false;
    this.slideGraceMs = 0;
    this.hurt = false;
    this.sprite.setAlpha(1);
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.body.enable = false;
    this.play('gameOver');
  }

  setProtected(remainingMs: number): void {
    this.sprite.setAlpha(remainingMs > 0 && Math.floor(remainingMs / 100) % 2 === 0 ? 0.4 : 1);
  }

  update(deltaMs: number): void {
    if (this.finished) return;
    const onFloor = this.body.blocked.down || this.body.touching.down ||
      this.body.bottom >= RUNNER_GROUND_Y - 0.5;
    if (onFloor && this.body.velocity.y >= 0) {
      this.grounded = true;
      this.jumpsUsed = 0;
      this.snapToGround();
    } else if (this.body.velocity.y !== 0) {
      this.grounded = false;
    }
    if (!this.slidingHeld) this.slideGraceMs = Math.max(0, this.slideGraceMs - deltaMs);
    this.setBodyHeight(this.isSliding ? SLIDING_HEIGHT : STANDING_HEIGHT);
    this.play(this.hurt ? 'hurt' : this.isSliding ? 'slide' :
      !this.grounded ? this.jumpsUsed === 2 ? 'doubleJump' : 'jump' : 'run');
  }

  destroy(): void {
    this.sprite.destroy();
  }

  private setBodyHeight(height: number): void {
    if (this.bodyHeight === height) return;
    this.bodyHeight = height;
    this.body.setSize(BODY_WIDTH, height, false);
    this.body.setOffset(28, 96 - height);
    this.body.updateFromGameObject();
    this.body.prev.copy(this.body.position);
    this.body.prevFrame.copy(this.body.position);
  }

  private snapToGround(): void {
    this.sprite.y = RUNNER_GROUND_Y;
    this.body.setVelocityY(0);
    this.body.updateFromGameObject();
    this.body.prev.copy(this.body.position);
    this.body.prevFrame.copy(this.body.position);
  }

  private play(name: CharacterAnimationName): void {
    if (this.animation === name) return;
    const key = `${this.characterId}:${name}`;
    const frames = this.character.animations[name];
    if (frames.length === 0) return;
    this.sprite.anims.play(key, true);
    this.animation = name;
  }
}
