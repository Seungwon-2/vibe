import type Phaser from 'phaser';
import { getCharacterDefinition } from './characterRegistry';
import type { CharacterAnimationName, CharacterDefinition } from './characterTypes';

const animationFrameRates: Record<CharacterAnimationName, number> = {
  idle: 2,
  idleLook: 2,
  walk: 9,
  run: 12,
  jump: 1,
  hurt: 6,
  start: 4,
  victory: 5,
  gameOver: 3,
};

export class PlayerActor {
  readonly definition: CharacterDefinition;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private currentAnimation: CharacterAnimationName | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    characterId: string,
    x: number,
    y: number,
  ) {
    this.definition = getCharacterDefinition(characterId);
    this.sprite = scene.physics.add.sprite(
      x,
      y,
      this.definition.textureKey,
      this.definition.animations.idle[0],
    );
    this.sprite.setCollideWorldBounds(true);
    this.createAnimations();
    this.play('idle');
  }

  play(animationName: CharacterAnimationName): void {
    if (this.currentAnimation === animationName) return;
    this.currentAnimation = animationName;
    this.sprite.play(`${this.definition.id}:${animationName}`);
  }

  destroy(): void {
    this.sprite.destroy();
  }

  private createAnimations(): void {
    for (const [animationName, frames] of Object.entries(this.definition.animations) as [
      CharacterAnimationName,
      string[],
    ][]) {
      const key = `${this.definition.id}:${animationName}`;
      if (this.scene.anims.exists(key)) continue;

      this.scene.anims.create({
        key,
        frames: frames.map((frame) => ({ key: this.definition.textureKey, frame })),
        frameRate: animationFrameRates[animationName],
        repeat: animationName === 'idle' || animationName === 'idleLook' ||
          animationName === 'walk' || animationName === 'run' ? -1 : 0,
      });
    }
  }
}
