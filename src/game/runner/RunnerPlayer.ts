import type Phaser from 'phaser';
import { getCharacter } from '../characters/characterCatalog';
import { getCharacterPassive } from '../characters/characterAbilities';
import type { CharacterAnimationName, CharacterId } from '../characters/characterTypes';
import { getSlidePose, getTerminalSpriteY, RUNNER_GROUND_Y, RUNNER_PLAYER_X,
  STANDING_BODY_HEIGHT, STANDING_BODY_OFFSET_Y, STANDING_BODY_WIDTH,
  STANDING_SPRITE_Y } from './runnerPose';

export { RUNNER_PLAYER_X, RUNNER_GROUND_Y } from './runnerPose';
const JUMP_IMPULSE = -420;
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
    sprite.setPosition(RUNNER_PLAYER_X, STANDING_SPRITE_Y);
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

  jump(): boolean {
    if (this.finished || this.passiveRescuing || this.pitFalling || this.hurt || this.isSliding || this.jumpsUsed >= 2) return false;
    if (!this.grounded && this.jumpsUsed === 0) this.jumpsUsed = 1;
    const second = this.jumpsUsed === 1;
    const passive = this.passive;
    const impulse = second && passive.id === 'rang-double-jump'
      ? JUMP_IMPULSE * passive.doubleJumpVelocityMultiplier
      : JUMP_IMPULSE;
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
    const visualScale = this.giantActive ? 1.25 : 1;
    if (this.animation === 'slide') {
      const pose = getSlidePose(this.characterId);
      const poseKey = `slide:${pose.key}:giant:${this.giantActive}`;
      if (this.poseKey === poseKey) return;
      this.poseKey = poseKey;
      this.sprite.setScale(pose.scaleX * visualScale, pose.scaleY * visualScale);
      this.sprite.y = pose.spriteY;
      this.body.updateFromGameObject();
      this.body.setSize(pose.sourceBodyWidth / visualScale, pose.sourceBodyHeight / visualScale, false);
      this.body.setOffset(pose.offsetX / visualScale, pose.offsetY / visualScale);
    } else {
      const poseKey = `standing:giant:${this.giantActive}`;
      if (this.poseKey === poseKey) return;
      this.poseKey = poseKey;
      this.sprite.setScale(visualScale);
      if (this.grounded) this.sprite.y = STANDING_SPRITE_Y;
      this.body.updateFromGameObject();
      this.body.setSize(STANDING_BODY_WIDTH / visualScale, STANDING_BODY_HEIGHT / visualScale, false);
      this.body.setOffset(28 / visualScale, STANDING_BODY_OFFSET_Y / visualScale);
    }
    this.body.updateFromGameObject();
    this.body.prev.copy(this.body.position);
    this.body.prevFrame.copy(this.body.position);
  }

  private snapToGround(): void {
    this.sprite.y = this.animation === 'slide'
      ? getSlidePose(this.characterId).spriteY
      : STANDING_SPRITE_Y;
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
    if (this.character.animations[catalogName].length === 0) {
      throw new Error(`Missing ${this.characterId}:${catalogName} animation`);
    }
    this.sprite.anims.play(key, true);
    this.animation = name;
  }
}
