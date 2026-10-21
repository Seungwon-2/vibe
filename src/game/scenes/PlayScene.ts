import Phaser from 'phaser';
import { defaultCharacter } from '../characters/defaultCharacter';
import { PlayerActor } from '../characters/PlayerActor';
import { resolveEnemyContact, resolveHazardContact } from '../systems/CollisionRules';
import { PlayerController } from '../systems/PlayerController';
import { RunState } from '../systems/RunState';
import type { DamageResult } from '../systems/RunState';

const PICKUP_EFFECT_MS = 3_000;
const GAME_OVER_ANIMATION_MS = 1_100;

export class PlayScene extends Phaser.Scene {
  private readonly runState = new RunState('ruins', 'ruins-1');
  private playerActor: PlayerActor | null = null;
  private playerController: PlayerController | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private keyA: Phaser.Input.Keyboard.Key | null = null;
  private keyD: Phaser.Input.Keyboard.Key | null = null;
  private keyW: Phaser.Input.Keyboard.Key | null = null;
  private keyShift: Phaser.Input.Keyboard.Key | null = null;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;
  private platforms: Phaser.GameObjects.Rectangle[] = [];
  private enemies: Phaser.GameObjects.Rectangle[] = [];
  private pickups: Phaser.GameObjects.GameObject[] = [];
  private checkpointSpawn = { x: 130, y: 450 };
  private startSpawn = { x: 130, y: 450 };
  private hud: Phaser.GameObjects.Text | null = null;
  private gameOverScheduled = false;
  private stageCleared = false;
  private speedZone = new Phaser.Geom.Rectangle(650, 260, 170, 250);

  constructor() {
    super('PlayScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.startSpawn = { x: 130, y: height - 90 };
    this.checkpointSpawn = { ...this.startSpawn };
    this.speedZone = new Phaser.Geom.Rectangle(650, height - 260, 170, 240);
    this.cameras.main.setBackgroundColor('#162044');

    const loadError = this.registry.get('assetLoadError') as string | undefined;
    if (loadError || !this.textures.exists(defaultCharacter.textureKey)) {
      this.add.text(width / 2, height / 2, loadError ?? '캐릭터 리소스를 찾을 수 없습니다.', {
        color: '#ffffff',
        fontFamily: 'sans-serif',
        fontSize: '24px',
        align: 'center',
        wordWrap: { width: width - 80 },
      }).setOrigin(0.5);
      return;
    }

    this.createWorld(width, height);
    this.createInput();
    this.createHud();
    this.createCollisions();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.updateHud();
  }

  update(_time: number, deltaMs: number): void {
    this.runState.tick(deltaMs);
    if (!this.playerActor || !this.playerController || this.gameOverScheduled) return;

    const keyboard = this.input.keyboard;
    const jumpPressed = Boolean(keyboard && (
      Phaser.Input.Keyboard.JustDown(this.spaceKey!) ||
      Phaser.Input.Keyboard.JustDown(this.keyW!) ||
      Phaser.Input.Keyboard.JustDown(this.cursors!.up)
    ));
    this.playerController.update({
      left: Boolean(this.cursors?.left.isDown || this.keyA?.isDown),
      right: Boolean(this.cursors?.right.isDown || this.keyD?.isDown),
      jumpPressed,
      run: Boolean(this.keyShift?.isDown),
    }, deltaMs);

    this.playerController.setStageSpeedMultiplier(
      Phaser.Geom.Rectangle.Contains(this.speedZone, this.playerActor.sprite.x, this.playerActor.sprite.y)
        ? 0.72
        : 1,
    );
    this.playerActor.sprite.setAlpha(
      this.playerController.isInvulnerable() && Math.floor(this.time.now / 100) % 2 === 0 ? 0.45 : 1,
    );

    if (this.playerActor.sprite.y > this.scale.height + 60) this.handleDamage(resolveHazardContact(this.runState));
    if (this.playerActor.sprite.x >= this.scale.width - 60) this.clearStage();
    this.updateHud();
  }

  private createWorld(width: number, height: number): void {
    for (const segment of [{ x: 230, width: 460 }, { x: 750, width: 420 }]) {
      const ground = this.add.rectangle(segment.x, height - 18, segment.width, 36, 0x26365f);
      this.addStaticBody(ground);
      this.platforms.push(ground);
    }
    this.createPit(width / 2, height);

    const ledges = [
      { x: 300, y: height - 130, width: 170 },
      { x: 545, y: height - 205, width: 150 },
      { x: 790, y: height - 135, width: 150 },
    ];
    for (const ledge of ledges) {
      const platform = this.add.rectangle(ledge.x, ledge.y, ledge.width, 20, 0x4d669a);
      this.addStaticBody(platform);
      this.platforms.push(platform);
    }

    this.playerActor = new PlayerActor(this, defaultCharacter.id, this.startSpawn.x, this.startSpawn.y);
    this.playerController = new PlayerController(this.playerActor);
    this.physics.world.setBounds(0, 0, width, height);
    this.physics.add.collider(this.playerActor.sprite, this.platforms);

    this.createEnemy(390, height - 64);
    this.createEnemy(735, height - 64);
    this.createHazard(400, height - 42, 72, 22, 0xdb557b);
    this.createCoin(270, height - 172);
    this.createCoin(310, height - 172);
    this.createCoin(350, height - 172);
    this.createSpeedPickup(220, height - 80, 1.25, 'FAST');
    this.createSpeedPickup(610, height - 80, 0.7, 'SLOW');
    this.createExtraLifePickup(825, height - 178);
    this.createCheckpoint(585, height - 78);
    this.createSpeedZoneVisual(height);
    this.createFinishGate(width - 40, height - 78);
  }

  private createInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyShift = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private createHud(): void {
    this.hud = this.add.text(18, 14, '', {
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontSize: '18px',
      stroke: '#10152d',
      strokeThickness: 4,
    }).setDepth(10);
  }

  private createCollisions(): void {
    if (!this.playerActor) return;
    for (const enemy of this.enemies) {
      this.physics.add.overlap(this.playerActor.sprite, enemy, () => this.handleEnemyContact(enemy));
    }
    for (const pickup of this.pickups) {
      this.physics.add.overlap(this.playerActor.sprite, pickup, () => this.collectPickup(pickup));
    }
  }

  private createEnemy(x: number, y: number): void {
    const enemy = this.add.rectangle(x, y, 42, 38, 0xd94f75).setStrokeStyle(3, 0xffa2b7);
    this.addStaticBody(enemy);
    this.enemies.push(enemy);
  }

  private createHazard(x: number, y: number, width: number, height: number, color: number): void {
    const hazard = this.add.rectangle(x, y, width, height, color).setStrokeStyle(2, 0xffa2b7);
    this.addStaticBody(hazard);
    this.add.text(x, y - height, '▲ ▲ ▲', { color: '#ffd2df', fontSize: '14px' }).setOrigin(0.5, 1);
    if (this.playerActor) {
      this.physics.add.overlap(this.playerActor.sprite, hazard, () => {
        this.handleDamage(resolveHazardContact(this.runState));
      });
    }
  }

  private createPit(x: number, height: number): void {
    this.add.rectangle(x, height - 6, 80, 28, 0x080c1c).setDepth(-1);
    const sensor = this.add.rectangle(x, height - 12, 80, 26, 0x000000, 0);
    this.addStaticBody(sensor);
    if (this.playerActor) {
      this.physics.add.overlap(this.playerActor.sprite, sensor, () => {
        this.handleDamage(resolveHazardContact(this.runState));
      });
    }
  }

  private createCoin(x: number, y: number): void {
    const coin = this.add.circle(x, y, 11, 0xffd45c).setStrokeStyle(3, 0xfff1b5);
    this.addStaticBody(coin);
    this.pickups.push(coin);
  }

  private createSpeedPickup(x: number, y: number, multiplier: number, label: string): void {
    const color = multiplier > 1 ? 0x67d9ff : 0xb99bff;
    const pickup = this.add.rectangle(x, y, 44, 32, color).setStrokeStyle(2, 0xffffff);
    this.addStaticBody(pickup);
    const labelText = this.add.text(x, y, label, { color: '#10152d', fontSize: '10px', fontStyle: 'bold' }).setOrigin(0.5);
    this.pickups.push(pickup);
    pickup.setData('kind', 'speed');
    pickup.setData('multiplier', multiplier);
    pickup.setData('label', labelText);
  }

  private createExtraLifePickup(x: number, y: number): void {
    const pickup = this.add.rectangle(x, y, 24, 24, 0xff7f9f).setStrokeStyle(2, 0xffdce5);
    this.addStaticBody(pickup);
    const labelText = this.add.text(x, y, '+1', { color: '#ffffff', fontSize: '10px', fontStyle: 'bold' }).setOrigin(0.5);
    this.pickups.push(pickup);
    pickup.setData('kind', 'extraLife');
    pickup.setData('label', labelText);
  }

  private createCheckpoint(x: number, y: number): void {
    const marker = this.add.rectangle(x, y, 16, 78, 0x6ee0b2).setStrokeStyle(3, 0xd1ffed);
    this.addStaticBody(marker);
    this.add.text(x, y - 52, 'CHECK', { color: '#d1ffed', fontSize: '12px' }).setOrigin(0.5);
    this.physics.add.overlap(this.playerActor!.sprite, marker, () => {
      const checkpoint = this.runState.activateCheckpoint('ruins-checkpoint-1');
      if (!checkpoint) return;
      this.checkpointSpawn = { x: x + 36, y: this.scale.height - 90 };
      checkpoint.snapshot.checkpointId = 'ruins-checkpoint-1';
      this.events.emit('checkpoint-save', checkpoint);
    });
  }

  private createSpeedZoneVisual(height: number): void {
    const visual = this.add.rectangle(735, height - 18, 170, 36, 0x68b8e8, 0.28)
      .setStrokeStyle(2, 0x90d5ff);
    this.add.text(735, height - 42, '바람 구간 · 속도 감소', {
      color: '#d7f3ff',
      fontSize: '12px',
    }).setOrigin(0.5);
    visual.setDepth(0);
  }

  private createFinishGate(x: number, y: number): void {
    const gate = this.add.rectangle(x, y, 28, 86, 0xf9cf72).setStrokeStyle(3, 0xfff1b9);
    this.addStaticBody(gate);
    this.add.text(x, y - 58, 'GOAL', { color: '#fff1b9', fontSize: '13px' }).setOrigin(0.5);
    this.physics.add.overlap(this.playerActor!.sprite, gate, () => this.clearStage());
  }

  private addStaticBody<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.physics.add.existing(object, true);
    return object;
  }

  private handleEnemyContact(enemy: Phaser.GameObjects.Rectangle): void {
    if (!enemy.active || !this.playerActor || !this.playerController) return;
    const body = this.playerActor.sprite.body as Phaser.Physics.Arcade.Body;
    const enemyTop = enemy.y - enemy.height / 2;
    const result = resolveEnemyContact({
      stompable: true,
      descending: body.velocity.y > 0,
      playerBottom: this.playerActor.sprite.y + body.height / 2,
      enemyTop,
    }, this.runState);

    if (result.kind === 'stomp') {
      enemy.setActive(false).setVisible(false);
      (enemy.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      this.playerActor.sprite.setVelocityY(-300);
      this.playerActor.play('jump');
      this.updateHud();
      return;
    }
    this.handleDamage(result.damage);
  }

  private collectPickup(pickup: Phaser.GameObjects.GameObject): void {
    if (!pickup.active) return;
    const kind = pickup.getData('kind') as string | undefined;
    if (kind === 'speed') {
      this.playerController?.applySpeedModifier(
        pickup.getData('multiplier') as number,
        PICKUP_EFFECT_MS,
      );
    } else if (kind === 'extraLife') {
      this.runState.collectExtraLife();
    } else {
      this.runState.collectCoin();
    }
    pickup.setActive(false);
    if (pickup instanceof Phaser.GameObjects.Shape) pickup.setVisible(false);
    const label = pickup.getData('label') as Phaser.GameObjects.Text | undefined;
    label?.setVisible(false);
    const body = pickup.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) body.enable = false;
    this.updateHud();
  }

  private handleDamage(damage: DamageResult): void {
    if (!damage.accepted || !this.playerActor || !this.playerController) return;
    if (damage.gameOver) {
      this.gameOverScheduled = true;
      this.playerController.setGameOver();
      this.time.delayedCall(GAME_OVER_ANIMATION_MS, () => this.restartStage());
    } else if (damage.shouldRespawn) {
      this.playerController.respawnAt(this.checkpointSpawn.x, this.checkpointSpawn.y);
    }
    this.updateHud();
  }

  private restartStage(): void {
    if (!this.playerActor || !this.playerController) return;
    this.runState.restartCurrentStage();
    this.playerActor.sprite.setAlpha(1);
    this.playerController.respawnAt(this.startSpawn.x, this.startSpawn.y);
    this.playerActor.play('start');
    this.enemies.forEach((enemy) => {
      enemy.setActive(true).setVisible(true);
      (enemy.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    });
    this.pickups.forEach((pickup) => {
      pickup.setActive(true);
      if (pickup instanceof Phaser.GameObjects.Shape) pickup.setVisible(true);
      const label = pickup.getData('label') as Phaser.GameObjects.Text | undefined;
      label?.setVisible(true);
      const body = pickup.body as Phaser.Physics.Arcade.StaticBody | null;
      if (body) body.enable = true;
    });
    this.checkpointSpawn = { ...this.startSpawn };
    this.gameOverScheduled = false;
    this.stageCleared = false;
    this.updateHud();
  }

  private clearStage(): void {
    if (this.stageCleared || !this.playerActor) return;
    this.stageCleared = true;
    this.runState.markStageCleared(2);
    this.playerController?.setStageSpeedMultiplier(1);
    this.playerActor.sprite.setVelocityX(0);
    this.playerActor.play('victory');
    this.events.emit('stage-clear', this.runState.snapshot());
    this.updateHud();
  }

  private updateHud(): void {
    if (!this.hud) return;
    const state = this.runState.snapshot();
    const effectMs = this.playerController?.getSpeedEffectRemainingMs() ?? 0;
    this.hud.setText(
      `라이프 ${state.lives}   점수 ${state.stageScore}   코인 ${state.coins}   속도 효과 ${effectMs > 0 ? `${(effectMs / 1_000).toFixed(1)}초` : '없음'}`,
    );
  }

  private cleanup(): void {
    this.playerActor?.destroy();
    this.playerActor = null;
    this.playerController = null;
  }
}
