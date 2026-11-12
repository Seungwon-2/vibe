import type Phaser from 'phaser';
import { getCharacter } from '../characters/characterCatalog';
import { getCharacterPassive } from '../characters/characterAbilities';
import type { CharacterAnimationName, CharacterId } from '../characters/characterTypes';
import { getQualitySpriteY, getSlidePose, getTerminalSpriteY, RUNNER_GROUND_Y, RUNNER_PLAYER_X,
  STANDING_BODY_HEIGHT, STANDING_BODY_WIDTH } from './runnerPose';
import { RUNNER_CONFIG } from './runnerConfig';
import type { RunnerPlayerCheckpoint } from './runnerSessionTypes';

export { RUNNER_PLAYER_X, RUNNER_GROUND_Y } from './runnerPose';
type RunnerAction = 'run' | 'jump' | 'doubleJump' | 'slide' | 'hurt' | 'victory' | 'gameOver';
type AirPhase = 'ascending' | 'descending';
type RunnerAnimation = RunnerAction | 'jump-fall' | 'double-jump-fall';

export class RunnerPlayer {
  private jumpsUsed = 0;
  private grounded = true;
  private slidingHeld = false;
  private hurt = false;
  private finished = false;
  private passiveRescuing = false;
  private pitFalling = false;
  private passiveEffectActive = false;
  private giantActive = false;
  private animation: RunnerAnimation | null = null;
  private airPhase: AirPhase = 'ascending';
  private poseKey = '';
  private readonly passive;
  private readonly character;

  constructor(
    private readonly sprite: Phaser.Physics.Arcade.Sprite,
    private readonly characterId: CharacterId,
  ) {
    this.passive = getCharacterPassive(characterId);
    this.character = getCharacter(characterId);
    sprite.setOrigin(0.5, 1);
    sprite.setPosition(RUNNER_PLAYER_X, getQualitySpriteY(characterId));
    this.play('run');
    this.applyPose();
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  get gameObject(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  get isSliding(): boolean {
    return this.slidingHeld && this.grounded;
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  get jumpCount(): number {
    return this.jumpsUsed;
  }

  createCheckpoint(): RunnerPlayerCheckpoint {
    const frame = this.sprite.anims.currentFrame;
    return {
      x: this.sprite.x, y: this.sprite.y,
      velocityX: this.body.velocity.x, velocityY: this.body.velocity.y,
      bodyWidth: this.body.width, bodyHeight: this.body.height,
      bodySourceWidth: this.body.sourceWidth, bodySourceHeight: this.body.sourceHeight,
      bodyOffsetX: this.body.offset.x, bodyOffsetY: this.body.offset.y,
      scaleX: this.sprite.scaleX, scaleY: this.sprite.scaleY,
      alpha: this.sprite.alpha, allowGravity: this.body.allowGravity, bodyEnabled: this.body.enable,
      grounded: this.grounded, jumpsUsed: this.jumpsUsed as 0 | 1 | 2,
      slidingHeld: this.slidingHeld, hurt: this.hurt, passiveRescuing: this.passiveRescuing,
      pitFalling: this.pitFalling, passiveEffectActive: this.passiveEffectActive,
      giantActive: this.giantActive, airPhase: this.airPhase,
      animation: this.animation ?? 'run', animationFrame: frame?.index ?? 0,
      animationElapsedMs: this.sprite.anims.accumulator,
    };
  }

  canRestoreCheckpoint(checkpoint: RunnerPlayerCheckpoint): boolean {
    const finite = [checkpoint.x, checkpoint.y, checkpoint.velocityX, checkpoint.velocityY,
      checkpoint.bodyWidth, checkpoint.bodyHeight, checkpoint.bodySourceWidth, checkpoint.bodySourceHeight,
      checkpoint.bodyOffsetX, checkpoint.bodyOffsetY,
      checkpoint.scaleX, checkpoint.scaleY, checkpoint.alpha, checkpoint.animationFrame,
      checkpoint.animationElapsedMs];
    const validAnimations: RunnerAnimation[] = ['run', 'jump', 'doubleJump', 'slide', 'hurt',
      'victory', 'gameOver', 'jump-fall', 'double-jump-fall'];
    if (!finite.every(Number.isFinite) || ![0, 1, 2].includes(checkpoint.jumpsUsed) ||
      !validAnimations.includes(checkpoint.animation as RunnerAnimation) ||
      !Number.isInteger(checkpoint.animationFrame) || checkpoint.animationFrame < 0 ||
      checkpoint.animationElapsedMs < 0 || checkpoint.bodyWidth <= 0 || checkpoint.bodyHeight <= 0 ||
      checkpoint.bodySourceWidth <= 0 || checkpoint.bodySourceHeight <= 0 ||
      checkpoint.scaleX === 0 || checkpoint.scaleY === 0 ||
      checkpoint.alpha < 0 || checkpoint.alpha > 1 ||
      !['ascending', 'descending'].includes(checkpoint.airPhase) ||
      typeof checkpoint.allowGravity !== 'boolean' || typeof checkpoint.bodyEnabled !== 'boolean' ||
      typeof checkpoint.grounded !== 'boolean' || typeof checkpoint.slidingHeld !== 'boolean' ||
      typeof checkpoint.hurt !== 'boolean' || typeof checkpoint.passiveRescuing !== 'boolean' ||
      typeof checkpoint.pitFalling !== 'boolean' || typeof checkpoint.passiveEffectActive !== 'boolean' ||
      typeof checkpoint.giantActive !== 'boolean') return false;

    const animationKey = `${this.characterId}:${checkpoint.animation}`;
    const animation = this.sprite.anims.animationManager.get(animationKey);
    return Boolean(animation?.frames[checkpoint.animationFrame]);
  }

  restoreCheckpoint(checkpoint: RunnerPlayerCheckpoint): boolean {
    if (!this.canRestoreCheckpoint(checkpoint)) return false;

    this.grounded = checkpoint.grounded;
    this.jumpsUsed = checkpoint.jumpsUsed;
    this.slidingHeld = checkpoint.slidingHeld;
    this.hurt = checkpoint.hurt;
    this.passiveRescuing = checkpoint.passiveRescuing;
    this.pitFalling = checkpoint.pitFalling;
    this.passiveEffectActive = checkpoint.passiveEffectActive;
    this.giantActive = checkpoint.giantActive;
    this.airPhase = checkpoint.airPhase;
    this.animation = checkpoint.animation as RunnerAnimation;
    this.poseKey = 'restored';
    this.sprite.setPosition(checkpoint.x, checkpoint.y).setScale(checkpoint.scaleX, checkpoint.scaleY)
      .setAlpha(checkpoint.alpha);
    this.body.setSize(checkpoint.bodySourceWidth, checkpoint.bodySourceHeight, false);
    this.body.setOffset(checkpoint.bodyOffsetX, checkpoint.bodyOffsetY);
    this.body.setAllowGravity(checkpoint.allowGravity);
    this.body.enable = checkpoint.bodyEnabled;
    this.body.setVelocity(checkpoint.velocityX, checkpoint.velocityY);
    this.body.updateFromGameObject();
    this.body.prev.copy(this.body.position);
    this.body.prevFrame.copy(this.body.position);
    const animationKey = `${this.characterId}:${checkpoint.animation}`;
    const animation = this.sprite.anims.animationManager.get(animationKey)!;
    const frame = animation.frames[checkpoint.animationFrame];
    this.sprite.anims.play(animationKey, true);
    this.sprite.anims.setCurrentFrame(frame);
    this.sprite.anims.accumulator = checkpoint.animationElapsedMs;
    if (this.passiveEffectActive) this.sprite.setTint(this.passive.id === 'toa-ghost-glide' ? 0xc49aff : 0xff8bc4);
    else this.sprite.clearTint();
    return true;
  }

  jump(): boolean {
    if (this.finished || this.passiveRescuing || this.pitFalling || this.hurt || this.isSliding || this.jumpsUsed >= 2) return false;
    if (!this.grounded && this.jumpsUsed === 0) this.jumpsUsed = 1;
    const second = this.jumpsUsed === 1;
    const passive = this.passive;
    const impulse = second && passive.id === 'rang-double-jump'
      ? RUNNER_CONFIG.jumpImpulseY * passive.doubleJumpVelocityMultiplier
      : RUNNER_CONFIG.jumpImpulseY;
    this.body.setVelocityY(impulse);
    this.jumpsUsed += 1;
    this.grounded = false;
    this.airPhase = 'ascending';
    this.play(second ? 'doubleJump' : 'jump');
    return true;
  }

  setSliding(held: boolean): boolean {
    if (this.finished || this.passiveRescuing || this.pitFalling) return false;
    const wasSliding = this.isSliding;
    if (this.hurt) {
      this.slidingHeld = held && this.grounded;
      return false;
    }
    if (held && !this.grounded) return false;
    this.slidingHeld = held;
    if (this.isSliding) this.play('slide');
    else if (this.animation === 'slide') this.play('run');
    this.applyPose();
    return !wasSliding && this.isSliding;
  }

  setHurt(hurt: boolean): void {
    if (this.finished) return;
    this.hurt = hurt;
    if (hurt) {
      this.play('hurt');
      this.applyPose();
    }
  }

  setPassiveEffect(remainingMs: number): void {
    const active = (this.passive.id === 'hiyori-guard' || this.passive.id === 'toa-ghost-glide') && remainingMs > 0;
    if (active === this.passiveEffectActive) return;
    this.passiveEffectActive = active;
    if (active) this.sprite.setTint(this.passive.id === 'toa-ghost-glide' ? 0xc49aff : 0xff8bc4);
    else this.sprite.clearTint();
  }

  setGiant(active: boolean): void {
    if (active === this.giantActive) return;
    this.giantActive = active;
    this.poseKey = '';
    this.applyPose();
  }

  beginPitRescue(): void {
    if (this.finished || this.passiveRescuing) return;
    this.passiveRescuing = true;
    this.slidingHeld = false;
    this.hurt = false;
    this.grounded = false;
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.body.enable = false;
    this.play('jump-fall');
    this.applyPose();
  }

  endPitRescue(): void {
    if (this.finished || !this.passiveRescuing) return;
    this.passiveRescuing = false;
    this.grounded = true;
    this.jumpsUsed = 0;
    this.airPhase = 'ascending';
    this.body.enable = true;
    this.body.setAllowGravity(true);
    this.body.setVelocity(0, 0);
    this.play('run');
    this.applyPose();
    this.snapToGround();
  }

  beginPitFall(): void {
    if (this.finished || this.pitFalling) return;
    this.pitFalling = true;
    this.passiveRescuing = false;
    this.slidingHeld = false;
    this.hurt = false;
    this.grounded = false;
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.body.enable = false;
    this.play('jump-fall');
  }

  finish(outcome: 'victory' | 'gameOver'): void {
    if (this.finished) return;
    this.finished = true;
    this.passiveRescuing = false;
    this.pitFalling = false;
    this.slidingHeld = false;
    this.hurt = false;
    this.setPassiveEffect(0);
    this.setGiant(false);
    this.grounded = true;
    this.sprite.setAlpha(1);
    this.play(outcome);
    this.applyPose();
    this.sprite.y = getTerminalSpriteY(this.characterId);
    this.body.setVelocity(0, 0);
    this.body.updateFromGameObject();
    this.body.prev.copy(this.body.position);
    this.body.prevFrame.copy(this.body.position);
    this.body.setAllowGravity(false);
    this.body.enable = false;
  }

  setProtected(remainingMs: number): void {
    this.sprite.setAlpha(remainingMs > 0 && Math.floor(remainingMs / 100) % 2 === 0 ? 0.4 : 1);
  }

  update(deltaMs: number): void {
    void deltaMs;
    if (this.finished || this.passiveRescuing || this.pitFalling) return;
    // Use Arcade's floor-contact flags for normal landings. The former 0.5px
    // bottom fallback could mark an airborne frame as grounded and switch to run.
    const floorContactFlag = this.body.blocked.down || this.body.touching.down;
    // Arcade contact flags can remain set from the previous floor step during
    // a jump. Trust them only while the collision body is physically at floor
    // height; otherwise a stale flag can snap an airborne player straight into
    // the running pose, which is easy to mistake for a pickup animation bug.
    const floorContact = floorContactFlag && this.body.bottom >= RUNNER_GROUND_Y - 2;
    const recoveredPastFloor = this.body.bottom >= RUNNER_GROUND_Y + 8;
    const onFloor = floorContact || recoveredPastFloor;
    if (onFloor && this.body.velocity.y >= 0) {
      this.grounded = true;
      this.jumpsUsed = 0;
      this.airPhase = 'ascending';
      this.snapToGround();
    } else if (this.body.velocity.y !== 0) {
      this.grounded = false;
    }
    if (!this.grounded && this.body.velocity.y >= 0) this.airPhase = 'descending';
    this.play(this.hurt ? 'hurt' : this.isSliding ? 'slide' :
      !this.grounded ? this.jumpsUsed === 2
        ? this.airPhase === 'descending' ? 'double-jump-fall' : 'doubleJump'
        : this.airPhase === 'descending' ? 'jump-fall' : 'jump' : 'run');
    this.applyPose();
  }

  destroy(): void {
    this.sprite.destroy();
  }

  private applyPose(): void {
    const characterScale = this.character.qualityScale;
    const giantScale = this.giantActive ? 1.35 : 1;
    const visualScale = characterScale * giantScale;
    if (this.isSliding) {
      const pose = getSlidePose(this.characterId);
      const poseKey = `slide:${pose.key}:giant:${this.giantActive}`;
      if (this.poseKey === poseKey) return;
      this.poseKey = poseKey;
      const scaleX = characterScale * pose.scaleX * giantScale;
      const scaleY = characterScale * pose.scaleY * giantScale;
      this.sprite.setScale(scaleX, scaleY);
      this.sprite.y = getQualitySpriteY(this.characterId, pose.scaleY * giantScale);
      this.body.updateFromGameObject();
      const sourceBodyWidth = pose.bodyWidth / scaleX;
      const sourceBodyHeight = (pose.sourceBodyHeight * pose.scaleY) / scaleY;
      this.body.setSize(sourceBodyWidth, sourceBodyHeight, false);
      this.body.setOffset((this.character.qualityFrameSize - sourceBodyWidth) / 2,
        this.character.qualityPivotY - sourceBodyHeight);
    } else {
      const poseKey = `standing:giant:${this.giantActive}`;
      if (this.poseKey === poseKey) return;
      this.poseKey = poseKey;
      this.sprite.setScale(visualScale);
      if (this.grounded) this.sprite.y = getQualitySpriteY(this.characterId, giantScale);
      this.body.updateFromGameObject();
      const sourceBodyWidth = STANDING_BODY_WIDTH / visualScale;
      const sourceBodyHeight = STANDING_BODY_HEIGHT / visualScale;
      this.body.setSize(sourceBodyWidth, sourceBodyHeight, false);
      this.body.setOffset((this.character.qualityFrameSize - sourceBodyWidth) / 2,
        this.character.qualityPivotY - sourceBodyHeight);
    }
    this.body.updateFromGameObject();
    this.body.prev.copy(this.body.position);
    this.body.prevFrame.copy(this.body.position);
  }

  private snapToGround(): void {
    this.sprite.y = this.isSliding
      ? getQualitySpriteY(this.characterId, getSlidePose(this.characterId).scaleY * (this.giantActive ? 1.35 : 1))
      : getQualitySpriteY(this.characterId, this.giantActive ? 1.35 : 1);
    this.body.setVelocityY(0);
    this.body.updateFromGameObject();
    this.body.prev.copy(this.body.position);
    this.body.prevFrame.copy(this.body.position);
  }

  private play(name: RunnerAnimation): void {
    if (this.animation === name) return;
    const key = `${this.characterId}:${name}`;
    const catalogName: CharacterAnimationName = name === 'jump-fall' ? 'jump'
      : name === 'double-jump-fall' ? 'doubleJump' : name;
    if (this.character.qualityAnimations[catalogName].length === 0) {
      throw new Error(`Missing ${this.characterId}:${catalogName} animation`);
    }
    this.sprite.anims.play(key, true);
    this.animation = name;
  }
}
