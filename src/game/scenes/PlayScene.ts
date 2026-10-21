import Phaser from 'phaser';
import { defaultCharacter } from '../characters/defaultCharacter';
import { PlayerActor } from '../characters/PlayerActor';
import { getStage } from '../content/worldCatalog';
import type { CommandKey, StageDefinition } from '../content/stageTypes';
import type { GameEvent } from '../events';
import { resolveEnemyContact, resolveHazardContact } from '../systems/CollisionRules';
import { BossEncounter } from '../systems/BossEncounter';
import type { BossPhase } from '../systems/BossEncounter';
import { PlayerController } from '../systems/PlayerController';
import { RunState } from '../systems/RunState';
import type { DamageResult } from '../systems/RunState';
import type { PlayerSave } from '../../services/GameGateway';

const PICKUP_EFFECT_MS = 3_000;
const GAME_OVER_ANIMATION_MS = 1_100;
const WORLD_COLORS = { ruins: { sky: 0x162044, ground: 0x26365f, platform: 0x4d669a }, mine: { sky: 0x101c38, ground: 0x24395a, platform: 0x397b89 } };

export class PlayScene extends Phaser.Scene {
  private runState!: RunState;
  private stage!: StageDefinition;
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
  private hazards: Phaser.GameObjects.Rectangle[] = [];
  private checkpoints: Phaser.GameObjects.Rectangle[] = [];
  private checkpointSpawn = { x: 90, y: 450 };
  private startSpawn = { x: 90, y: 450 };
  private hud: Phaser.GameObjects.Text | null = null;
  private bossActor: Phaser.GameObjects.Rectangle | null = null;
  private bossEncounter: BossEncounter | null = null;
  private bossText: Phaser.GameObjects.Text | null = null;
  private gameOverScheduled = false;
  private stageCleared = false;
  private timeRemainingMs: number | null = null;
  private stateUpdateElapsed = 0;
  private speedZone: Phaser.Geom.Rectangle | null = null;
  private bossAttackCooldownMs = 0;
  private bossTelegraphMs = 0;
  private bossProjectiles: Phaser.GameObjects.Rectangle[] = [];
  private stompGraceMs = 0;
  private lastBossPhase: BossPhase | null = null;

  constructor() {
    super('PlayScene');
  }

  init(data: { stageId?: string; lives?: number; save?: PlayerSave | null }): void {
    this.stage = getStage(data.stageId ?? 'ruins-1');
    this.runState = new RunState(this.stage.worldId, this.stage.id, this.stage.ordinal, data.lives ?? 5);
    if (data.save && data.save.stageId === this.stage.id) {
      this.runState.restoreProgress({
        lives: data.save.lives,
        checkpointId: data.save.checkpointId,
        stageScore: data.save.stageScore,
        coins: data.save.coins,
        collectedCoinIds: data.save.collectedCoinIds ?? [],
        enemyStomps: data.save.enemyStomps ?? 0,
        extraLifeOverflow: data.save.extraLifeOverflow ?? 0,
        elapsedMs: data.save.elapsedMs ?? 0,
        unlockedStageOrdinal: data.save.unlockedStageOrdinal,
      });
    }
    this.platforms = [];
    this.enemies = [];
    this.pickups = [];
    this.hazards = [];
    this.checkpoints = [];
    this.bossActor = null;
    this.bossEncounter = null;
    this.gameOverScheduled = false;
    this.stageCleared = false;
    this.stateUpdateElapsed = 0;
    this.bossAttackCooldownMs = 2_600;
    this.bossTelegraphMs = 0;
    this.bossProjectiles = [];
    this.stompGraceMs = 0;
    this.lastBossPhase = null;
    this.timeRemainingMs = this.stage.timeLimitSeconds ? this.stage.timeLimitSeconds * 1_000 : null;
    this.startSpawn = { ...this.stage.spawn };
    if (data.save && data.save.stageId === this.stage.id) {
      const checkpoint = this.stage.checkpoints.find((item) => item.id === data.save?.checkpointId);
      if (checkpoint) this.startSpawn = { x: checkpoint.x + 36, y: checkpoint.y - 72 };
    }
    this.checkpointSpawn = { ...this.startSpawn };
  }

  create(): void {
    this.cameras.main.setBackgroundColor(WORLD_COLORS[this.stage.theme].sky);
    const loadError = this.registry.get('assetLoadError') as string | undefined;
    if (loadError || !this.textures.exists(defaultCharacter.textureKey)) {
      this.add.text(this.scale.width / 2, this.scale.height / 2, loadError ?? '캐릭터 리소스를 찾을 수 없습니다.', {
        color: '#ffffff', fontFamily: 'sans-serif', fontSize: '24px', align: 'center',
        wordWrap: { width: this.scale.width - 80 },
      }).setOrigin(0.5);
      return;
    }

    this.physics.world.setBounds(0, 0, this.stage.width, this.stage.height);
    if (this.stage.fallRule === 'restart-at-base') this.physics.world.gravity.y = 650;
    this.createWorld();
    this.createInput();
    this.createHud();
    this.createCollisions();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.emitState();
  }

  update(_time: number, deltaMs: number): void {
    this.runState.tick(deltaMs);
    this.stompGraceMs = Math.max(0, this.stompGraceMs - deltaMs);
    if (this.timeRemainingMs !== null && !this.stageCleared && !this.gameOverScheduled) {
      this.timeRemainingMs = Math.max(0, this.timeRemainingMs - deltaMs);
      if (this.timeRemainingMs === 0) {
        this.gameOverScheduled = true;
        this.playerController?.setGameOver();
        this.emit({ type: 'timeout', state: this.runState.snapshot() });
      }
    }
    this.bossEncounter?.tick(deltaMs);
    this.updateBoss(deltaMs);
    this.updateBossAttack(deltaMs);
    if (!this.playerActor || !this.playerController || this.gameOverScheduled || this.stageCleared) {
      this.updateStatePeriodically(deltaMs);
      return;
    }

    const keyboard = this.input.keyboard;
    const jumpPressed = Boolean(keyboard && (
      Phaser.Input.Keyboard.JustDown(this.spaceKey!) || Phaser.Input.Keyboard.JustDown(this.keyW!) ||
      Phaser.Input.Keyboard.JustDown(this.cursors!.up)
    ));
    const inCommandChallenge = this.bossEncounter?.snapshot().phase === 'command';
    this.playerController.update({
      left: !inCommandChallenge && Boolean(this.cursors?.left.isDown || this.keyA?.isDown),
      right: !inCommandChallenge && Boolean(this.cursors?.right.isDown || this.keyD?.isDown),
      jumpPressed: !inCommandChallenge && jumpPressed,
      run: !inCommandChallenge && Boolean(this.keyShift?.isDown),
    }, deltaMs);
    this.playerController.setStageSpeedMultiplier(this.speedZone &&
      Phaser.Geom.Rectangle.Contains(this.speedZone, this.playerActor.sprite.x, this.playerActor.sprite.y) ? 0.72 : 1);
    this.playerActor.sprite.setAlpha(
      this.playerController.isInvulnerable() && Math.floor(this.time.now / 100) % 2 === 0 ? 0.45 : 1,
    );

    if (this.stage.fallRule === 'restart-at-base' && this.playerActor.sprite.y > this.stage.height + 50) {
      this.playerController.respawnAt(this.startSpawn.x, this.startSpawn.y);
    } else if (this.playerActor.sprite.y > this.stage.height + 50) {
      this.handleDamage(resolveHazardContact(this.runState));
    }
    if (this.isAtExit()) this.clearStage();
    this.updateHudText();
    this.updateStatePeriodically(deltaMs);
  }

  private createWorld(): void {
    const palette = WORLD_COLORS[this.stage.theme];
    const worldGraphics = this.add.graphics().setDepth(-3);
    worldGraphics.fillStyle(this.stage.theme === 'ruins' ? 0x24345e : 0x183348, 0.45);
    for (let i = 0; i < 16; i += 1) {
      const x = ((i * 173 + 67) % this.stage.width);
      const y = ((i * 101 + 29) % this.stage.height);
      worldGraphics.fillCircle(x, y, 2 + (i % 3));
    }
    for (const platformData of this.stage.platforms) {
      const platform = this.add.rectangle(platformData.x, platformData.y, platformData.width, platformData.height, palette.ground)
        .setStrokeStyle(2, palette.platform);
      this.addStaticBody(platform);
      this.platforms.push(platform);
    }
    for (const hazardData of this.stage.hazards) {
      const hazard = this.add.rectangle(hazardData.x, hazardData.y, hazardData.width, hazardData.height,
        hazardData.kind === 'spikes' ? 0xdb557b : 0x080c1c).setStrokeStyle(2, 0xffa2b7);
      this.addStaticBody(hazard);
      this.hazards.push(hazard);
    }

    for (const coin of this.stage.coins) this.createCoin(coin.id, coin.x, coin.y);
    for (const pickup of this.stage.pickups) this.createPickup(pickup.id, pickup.x, pickup.y, pickup.kind, pickup.multiplier);
    for (const enemy of this.stage.enemies) this.createEnemy(enemy.id, enemy.x, enemy.y, enemy.patrolDistance);
    for (const checkpoint of this.stage.checkpoints) this.createCheckpoint(checkpoint.id, checkpoint.x, checkpoint.y);
    this.createExit();
    this.createSpeedZoneVisual();

    this.playerActor = new PlayerActor(this, defaultCharacter.id, this.startSpawn.x, this.startSpawn.y);
    this.playerController = new PlayerController(this.playerActor);
    if (this.stage.boss) this.createBoss();
    this.physics.add.collider(this.playerActor.sprite, this.platforms);
    this.cameras.main.setBounds(0, 0, this.stage.width, this.stage.height);
    this.cameras.main.startFollow(this.playerActor.sprite, false, 0.08, 0.08);
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
    keyboard.on(Phaser.Input.Keyboard.Events.DOWN, (event: KeyboardEvent) => {
      const commandKey = this.toCommandKey(event.key);
      if (!commandKey || !this.bossEncounter) return;
      const result = this.bossEncounter.input(commandKey);
      if (result === 'success') this.playerActor?.play('victory');
      this.emitState();
    });
  }

  private toCommandKey(key: string): CommandKey | null {
    const normalized = key.toUpperCase();
    if (normalized === 'ARROWUP' || normalized === 'ARROWDOWN' || normalized === 'ARROWLEFT' || normalized === 'ARROWRIGHT') return normalized;
    if (normalized === 'W' || normalized === 'A' || normalized === 'S' || normalized === 'D') return normalized;
    return null;
  }

  private createHud(): void {
    this.hud = this.add.text(16, 16, '', {
      color: '#ffffff', fontFamily: 'sans-serif', fontSize: '16px',
      backgroundColor: '#10152dbb', padding: { x: 10, y: 8 },
    }).setScrollFactor(0).setDepth(20);
    this.bossText = this.add.text(this.scale.width / 2, 54, '', {
      color: '#fff2c5', fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold',
      stroke: '#10152d', strokeThickness: 5, align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21);
  }

  private createCollisions(): void {
    if (!this.playerActor) return;
    for (const enemy of this.enemies) this.physics.add.overlap(this.playerActor.sprite, enemy, () => this.handleEnemyContact(enemy));
    for (const pickup of this.pickups) this.physics.add.overlap(this.playerActor.sprite, pickup, () => this.collectPickup(pickup));
    for (const hazard of this.hazards) this.physics.add.overlap(this.playerActor.sprite, hazard, () => this.handleDamage(resolveHazardContact(this.runState)));
    for (const checkpoint of this.checkpoints) this.physics.add.overlap(this.playerActor.sprite, checkpoint, () => this.activateCheckpoint(checkpoint));
    if (this.bossActor) this.physics.add.overlap(this.playerActor.sprite, this.bossActor, () => this.handleBossContact());
    for (const projectile of this.bossProjectiles) this.physics.add.overlap(this.playerActor.sprite, projectile, () => this.handleBossProjectile(projectile));
  }

  private createEnemy(id: string, x: number, y: number, patrolDistance: number): void {
    const enemy = this.add.rectangle(x, y, 42, 38, 0xd94f75).setStrokeStyle(3, 0xffa2b7).setData('enemyId', id);
    this.physics.add.existing(enemy);
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityX(70);
    enemy.setData('patrolMin', x - patrolDistance);
    enemy.setData('patrolMax', x + patrolDistance);
    this.enemies.push(enemy);
  }

  private createCoin(id: string, x: number, y: number): void {
    const coin = this.add.circle(x, y, 11, 0xffd45c).setStrokeStyle(3, 0xfff1b5).setData('kind', 'coin').setData('id', id);
    this.addStaticBody(coin);
    if (this.runState.snapshot().collectedCoinIds.includes(id)) {
      coin.setActive(false).setVisible(false);
      (coin.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    }
    this.pickups.push(coin);
  }

  private createPickup(id: string, x: number, y: number, kind: 'speed' | 'extraLife', multiplier?: number): void {
    const pickup = this.add.rectangle(x, y, 30, 28, kind === 'speed' ? (multiplier && multiplier > 1 ? 0x67d9ff : 0xb99bff) : 0xff7f9f)
      .setStrokeStyle(2, 0xffffff).setData('kind', kind).setData('id', id);
    if (multiplier) pickup.setData('multiplier', multiplier);
    this.addStaticBody(pickup);
    this.pickups.push(pickup);
  }

  private createCheckpoint(id: string, x: number, y: number): void {
    const marker = this.add.rectangle(x, y, 16, 78, 0x6ee0b2).setStrokeStyle(3, 0xd1ffed).setData('checkpointId', id);
    this.addStaticBody(marker);
    this.checkpoints.push(marker);
    this.add.text(x, y - 52, 'CHECK', { color: '#d1ffed', fontSize: '12px' }).setOrigin(0.5);
  }

  private activateCheckpoint(marker: Phaser.GameObjects.Rectangle): void {
    const id = marker.getData('checkpointId') as string;
    const event = this.runState.activateCheckpoint(id);
    if (!event) return;
    this.checkpointSpawn = { x: marker.x + 36, y: marker.y - 72 };
    this.emit({ type: 'checkpoint', state: event.snapshot });
  }

  private createExit(): void {
    const gate = this.add.rectangle(this.stage.exit.x, this.stage.exit.y, 28, 86, 0xf9cf72).setStrokeStyle(3, 0xfff1b9);
    this.addStaticBody(gate);
    this.add.text(this.stage.exit.x, this.stage.exit.y - 58, 'GOAL', { color: '#fff1b9', fontSize: '13px' }).setOrigin(0.5);
  }

  private createSpeedZoneVisual(): void {
    if (this.stage.id !== 'ruins-1' && this.stage.id !== 'mine-2') return;
    this.speedZone = new Phaser.Geom.Rectangle(650, this.stage.height - 260, 170, 240);
    const visual = this.add.rectangle(735, this.stage.height - 18, 170, 36, 0x68b8e8, 0.28).setStrokeStyle(2, 0x90d5ff);
    this.add.text(735, this.stage.height - 42, '바람 구간 · 속도 감소', { color: '#d7f3ff', fontSize: '12px' }).setOrigin(0.5);
    visual.setDepth(0);
  }

  private createBoss(): void {
    if (!this.stage.boss) return;
    this.bossEncounter = new BossEncounter(this.stage.boss);
    this.lastBossPhase = 'stompable';
    const centerX = this.stage.width / 2;
    const boss = this.add.rectangle(centerX, this.stage.height - 83, 92, 82, this.stage.theme === 'ruins' ? 0xb985e8 : 0x69e4d4)
      .setStrokeStyle(5, 0xffffff).setData('originX', centerX);
    this.physics.add.existing(boss);
    const body = boss.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityX(100);
    this.bossActor = boss;
    this.add.text(centerX, this.stage.height - 150, this.stage.boss.name, { color: '#ffffff', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);
    this.createBossAssists();
  }

  private createBossAssists(): void {
    const y = this.stage.height - 180;
    for (const x of [this.stage.width * 0.26, this.stage.width * 0.74]) {
      const platform = this.add.rectangle(x, y, 160, 18, WORLD_COLORS[this.stage.theme].platform).setStrokeStyle(3, 0xc7faff);
      this.addStaticBody(platform);
      this.platforms.push(platform);
    }
  }

  private updateBoss(deltaMs: number): void {
    if (!this.bossActor || !this.bossEncounter || !this.stage.boss) return;
    const state = this.bossEncounter.snapshot();
    if (state.phase === 'countering' && this.lastBossPhase !== 'countering') this.launchBossAttack();
    this.lastBossPhase = state.phase;
    const body = this.bossActor.body as Phaser.Physics.Arcade.Body;
    if (state.phase === 'defeated') {
      body.setVelocityX(0);
      this.bossActor.setAngle(90).setAlpha(0.7);
      this.clearStage();
      return;
    }
    if (state.phase === 'rage-delay' || state.phase === 'command' || state.phase === 'countering') {
      body.setVelocityX(100 * this.stage.boss.speedMultiplier * Math.sign(body.velocity.x || 1));
    } else if (state.phase === 'groggy') {
      body.setVelocityX(0);
    } else if (state.phase === 'stompable') {
      body.setVelocityX(100 * Math.sign(body.velocity.x || 1));
    }
    if (this.bossActor.x < 110 || this.bossActor.x > this.stage.width - 110) body.setVelocityX(-body.velocity.x);
    if (state.phase === 'groggy') this.bossActor.setFillStyle(0xffe7a1);
    else if (state.phase === 'command') this.bossActor.setFillStyle(0xff7788);
    else this.bossActor.setFillStyle(this.stage.theme === 'ruins' ? 0xb985e8 : 0x69e4d4);

    if (this.bossText) {
      const command = state.currentCommand;
      if (state.phase === 'command' && command) {
        const rendered = command.map((key, index) => index < state.commandIndex ? `✓${this.commandLabel(key)}` : this.commandLabel(key)).join('   ');
        this.bossText.setText(`${this.stage.boss.name} 커맨드 (${Math.ceil(state.remainingMs / 1_000)}초)\n${rendered}`).setVisible(true);
      } else if (state.phase === 'groggy') {
        this.bossText.setText(`그로기! 밟아라! ${Math.ceil(state.remainingMs / 1_000)}초`).setVisible(true);
      } else if (state.phase === 'rage-delay') {
        this.bossText.setText(`광폭화 · 커맨드까지 ${Math.ceil(state.remainingMs / 1_000)}초`).setVisible(true);
      } else if (state.phase === 'countering') {
        this.bossText.setText('반격! 거리를 벌려라!').setVisible(true);
      } else this.bossText.setVisible(false);
    }
    this.bossAttackCooldownMs -= deltaMs;
  }

  private updateBossAttack(deltaMs: number): void {
    if (!this.bossActor || !this.bossEncounter || !this.stage.boss || this.bossEncounter.snapshot().phase === 'defeated') return;
    const phase = this.bossEncounter.snapshot().phase;
    const enraged = phase !== 'stompable';
    const attackInterval = 2_600 / (enraged ? this.stage.boss.speedMultiplier : 1);
    if (this.bossTelegraphMs > 0) {
      this.bossTelegraphMs = Math.max(0, this.bossTelegraphMs - deltaMs);
      if (this.bossText && this.bossEncounter.snapshot().phase !== 'command' && this.bossEncounter.snapshot().phase !== 'groggy') {
        this.bossText.setText(this.stage.boss.attackPattern === 'wind-sweep' ? '바람 베기 예고!' : '수정 파동 예고!').setVisible(true);
      }
      if (this.bossTelegraphMs === 0) this.launchBossAttack();
      return;
    }
    if (this.bossAttackCooldownMs <= 0 && phase !== 'command' && phase !== 'groggy' && phase !== 'countering') {
      this.bossTelegraphMs = 650;
      this.bossAttackCooldownMs = attackInterval;
    }
  }

  private launchBossAttack(): void {
    if (!this.bossActor || !this.playerActor || !this.stage.boss) return;
    const isWind = this.stage.boss.attackPattern === 'wind-sweep';
    const direction = Math.sign(this.playerActor.sprite.x - this.bossActor.x) || 1;
    const projectile = this.add.rectangle(this.bossActor.x, this.bossActor.y - 10, isWind ? 90 : 48, isWind ? 34 : 64,
      isWind ? 0xa1e9ff : 0x81f0ce).setStrokeStyle(3, 0xffffff).setDepth(3);
    this.physics.add.existing(projectile);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(isWind ? direction * 340 : 0, isWind ? 0 : 310);
    if (!isWind) projectile.setPosition(this.playerActor.sprite.x, Math.max(50, this.playerActor.sprite.y - 260));
    this.bossProjectiles.push(projectile);
    this.physics.add.overlap(this.playerActor.sprite, projectile, () => this.handleBossProjectile(projectile));
    this.time.delayedCall(2_400, () => {
      this.bossProjectiles = this.bossProjectiles.filter((item) => item !== projectile);
      projectile.destroy();
    });
  }

  private handleBossProjectile(projectile: Phaser.GameObjects.Rectangle): void {
    if (!projectile.active) return;
    projectile.destroy();
    this.bossProjectiles = this.bossProjectiles.filter((item) => item !== projectile);
    this.handleDamage(resolveHazardContact(this.runState));
  }

  private commandLabel(key: CommandKey): string {
    const labels: Record<CommandKey, string> = {
      ARROWUP: '↑', ARROWDOWN: '↓', ARROWLEFT: '←', ARROWRIGHT: '→', W: 'W', A: 'A', S: 'S', D: 'D',
    };
    return labels[key];
  }

  private handleBossContact(): void {
    const boss = this.bossActor;
    const encounter = this.bossEncounter;
    if (!boss || !encounter || !this.playerActor || !this.playerController) return;
    const body = this.playerActor.sprite.body as Phaser.Physics.Arcade.Body;
    const isDescending = body.velocity.y > 0;
    const playerBottom = this.playerActor.sprite.y + body.height / 2;
    const bossTop = boss.y - boss.height / 2;
    const state = encounter.snapshot();
    if (isDescending && playerBottom <= bossTop + 14 && (state.phase === 'stompable' || state.phase === 'groggy')) {
      const defeated = encounter.stomp();
      this.stompGraceMs = 350;
      this.playerActor.sprite.setVelocityY(-340);
      this.playerActor.play('jump');
      this.emitState();
      if (defeated) this.clearStage();
      return;
    }
    if (this.stompGraceMs > 0) return;
    if (state.phase !== 'defeated') this.handleDamage(resolveHazardContact(this.runState));
  }

  private isAtExit(): boolean {
    if (!this.playerActor) return false;
    return Phaser.Math.Distance.Between(this.playerActor.sprite.x, this.playerActor.sprite.y, this.stage.exit.x, this.stage.exit.y) < 52;
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
      (enemy.body as Phaser.Physics.Arcade.Body).enable = false;
      this.playerActor.sprite.setVelocityY(-300);
      this.playerActor.play('jump');
      this.emitState();
      return;
    }
    this.handleDamage(result.damage);
  }

  private collectPickup(pickup: Phaser.GameObjects.GameObject): void {
    if (!pickup.active) return;
    const kind = pickup.getData('kind') as string | undefined;
    if (kind === 'speed') this.playerController?.applySpeedModifier(pickup.getData('multiplier') as number, PICKUP_EFFECT_MS);
    else if (kind === 'extraLife') this.runState.collectExtraLife();
    else this.runState.collectCoin(pickup.getData('id') as string | undefined);
    pickup.setActive(false);
    if (pickup instanceof Phaser.GameObjects.Shape) pickup.setVisible(false);
    const body = pickup.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) body.enable = false;
    this.emitState();
  }

  private handleDamage(damage: DamageResult): void {
    if (!damage.accepted || !this.playerActor || !this.playerController) return;
    if (damage.gameOver) {
      this.gameOverScheduled = true;
      this.playerController.setGameOver();
      this.time.delayedCall(GAME_OVER_ANIMATION_MS, () => this.emit({ type: 'game-over', state: this.runState.snapshot() }));
    } else if (damage.shouldRespawn) {
      this.playerController.respawnAt(this.checkpointSpawn.x, this.checkpointSpawn.y);
    }
    this.emitState();
  }

  private clearStage(): void {
    if (this.stageCleared || !this.playerActor || (this.stage.boss && this.bossEncounter?.snapshot().phase !== 'defeated')) return;
    this.stageCleared = true;
    this.runState.markStageCleared(this.stage.ordinal + 1);
    this.playerController?.setStageSpeedMultiplier(1);
    this.playerActor.sprite.setVelocityX(0);
    this.playerActor.play('victory');
    this.emit({ type: 'stage-clear', state: this.runState.snapshot() });
  }

  private updateHudText(): void {
    if (!this.hud) return;
    const state = this.runState.snapshot();
    const effectMs = this.playerController?.getSpeedEffectRemainingMs() ?? 0;
    const timer = this.timeRemainingMs === null ? '' : `  시간 ${Math.ceil(this.timeRemainingMs / 1_000)}초`;
    const effect = effectMs > 0 ? `  속도 효과 ${(effectMs / 1_000).toFixed(1)}초` : '';
    this.hud.setText(`라이프 ${state.lives}   점수 ${state.stageScore}   코인 ${state.coins}${timer}${effect}`);
  }

  private updateStatePeriodically(deltaMs: number): void {
    this.stateUpdateElapsed += deltaMs;
    if (this.stateUpdateElapsed >= 150) {
      this.stateUpdateElapsed = 0;
      this.emitState();
    }
  }

  private emitState(): void {
    const event: GameEvent = {
      type: 'state', state: this.runState.snapshot(), timeRemainingMs: this.timeRemainingMs,
      effectRemainingMs: this.playerController?.getSpeedEffectRemainingMs() ?? 0,
      boss: this.bossEncounter?.snapshot() ?? null,
    };
    this.emit(event);
  }

  private emit(event: GameEvent): void {
    this.game.events.emit('platformer-event', event);
  }

  private addStaticBody<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.physics.add.existing(object, true);
    return object;
  }

  private cleanup(): void {
    this.playerActor?.destroy();
    this.playerActor = null;
    this.playerController = null;
  }
}
