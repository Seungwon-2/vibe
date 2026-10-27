import Phaser from 'phaser';
import { getCharacter } from '../characters/characterCatalog';
import type { CharacterId } from '../characters/characterTypes';
import { advanceRunner, collectPickup, createRunnerSnapshot, pauseRunner, resumeRunner, startRunner } from './RunnerSimulation';
import { RunnerPlayer, RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './RunnerPlayer';
import type { RunnerInputBridge } from './RunnerInput';
import type { RunnerGateId, RunnerResult, RunnerSnapshot } from './runnerTypes';
import { RUNNER_CONFIG } from './runnerConfig';
import { ObstacleSpawner } from './ObstacleSpawner';
import { tryResolveHazardHit, tryResolvePitFall } from './CollisionSystem';
import { CollectibleSpawner, type PickupDefinition } from './CollectibleSpawner';
import { RunnerEventEmitter } from './runnerEvents';
import type { RunnerEvent } from './runnerEvents';
import { browserPersonalBestStore } from '../../services/PersonalBestStore';
import type { RunnerFinishOutcome } from './runnerTypes';
import { RunnerBackdrop } from '../visuals/RunnerBackdrop';
import { getHurtAnimationFrames } from './hurtAnimation';
import { PitSpawner } from './PitSpawner';
import type { PitFallContactResult, PitDefinition } from './PitSpawner';

export class RunnerScene extends Phaser.Scene {
  private inputBridge!: RunnerInputBridge;
  private player!: RunnerPlayer;
  private snapshot!: RunnerSnapshot;
  private countdownRemainingMs = RUNNER_CONFIG.countdownMs;
  private countdownValue: 0 | 1 | 2 | 3 = 3;
  private eventEmitter!: RunnerEventEmitter;
  private heldKeyboardActions = new Set<string>();
  private spawner!: ObstacleSpawner;
  private collectibles!: CollectibleSpawner;
  private backdrop!: RunnerBackdrop;
  private passiveEffectArt!: Phaser.GameObjects.Graphics;
  private pits!: PitSpawner;
  private finishEmitted = false;
  private pitFallCinematicActive = false;
  private pendingPitFinish: { state: RunnerSnapshot; result: RunnerResult } | null = null;
  private pitFallTween: Phaser.Tweens.Tween | null = null;
  private pitFinishTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'RunnerScene' });
  }

  preload(): void {
    const character = getCharacter(this.registry.get('characterId') as CharacterId);
    this.load.atlas(character.textureKey, character.atlasUrl, character.atlasManifest);
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);
  }

  create(): void {
    const characterId = this.registry.get('characterId') as CharacterId;
    const character = getCharacter(characterId);
    this.inputBridge = this.registry.get('inputBridge') as RunnerInputBridge;
    this.eventEmitter = new RunnerEventEmitter({
      onSnapshot: this.registry.get('onSnapshot') as (snapshot: RunnerSnapshot) => void,
      onFinished: this.registry.get('onFinished') as (result: RunnerResult, outcome: RunnerFinishOutcome) => void,
      onEvent: this.registry.get('onEvent') as ((event: RunnerEvent) => void) | undefined,
    });
    this.snapshot = createRunnerSnapshot(characterId);
    this.backdrop = new RunnerBackdrop(this);
    this.passiveEffectArt = this.add.graphics().setDepth(3);

    const animationFrames = {
      run: character.animations.run,
      jump: character.animations.jump.slice(0, 4),
      'jump-fall': character.animations.jump.slice(4),
      // A second jump reaches its apex after about 0.47s. All six frames at
      // 12 fps fit the ascent, including the spin recovery in frames 4–5.
      doubleJump: character.animations.doubleJump,
      'double-jump-fall': character.animations.doubleJump.slice(4),
      // The first curated slide is a tall entry pose; start at the low pose
      // so the visible art clears the overhead hazard at its native scale.
      slide: character.available
        ? character.animations.slide.slice(2, 4)
        : character.animations.slide.slice(1, 4),
      hurt: getHurtAnimationFrames(character.animations.hurt),
      victory: character.animations.victory,
      gameOver: character.animations.gameOver,
    } as const;
    for (const [name, frames] of Object.entries(animationFrames)) {
      if (frames.length === 0) throw new Error(`Missing ${characterId}:${name} frames`);
      if (this.anims.exists(`${characterId}:${name}`)) continue;
      const isFall = name === 'jump-fall' || name === 'double-jump-fall';
      const frameRate = name === 'run' ? 20 : name === 'slide' ? 18
        : isFall ? 6 : name === 'jump' ? 8 : 12;
      this.anims.create({
        key: `${characterId}:${name}`,
        frames: frames.map((frame) => ({ key: character.textureKey, frame })),
        frameRate,
        repeat: name === 'run' || isFall ? -1 : 0,
      });
    }

    // The backdrop paints the ground; this transparent rectangle only supports physics.
    const floor = this.add.rectangle(0, RUNNER_GROUND_Y, 960, 70, 0xffffff, 0).setOrigin(0, 0);
    this.physics.add.existing(floor, true);
    const sprite = this.physics.add.sprite(
      RUNNER_PLAYER_X, RUNNER_GROUND_Y, character.textureKey, character.animations.run[0],
    );
    this.physics.add.collider(sprite, floor);
    this.player = new RunnerPlayer(sprite, characterId);
    this.spawner = new ObstacleSpawner(this, this.player.gameObject, this.handleHazardOverlap,
      this.registry.get('runnerTutorialEnabled') === true);
    this.collectibles = new CollectibleSpawner(this, this.player.gameObject, this.handlePickup, characterId);
    this.pits = new PitSpawner(this, this.player.gameObject, () => this.player.isGrounded,
      this.handlePitFall);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
    this.publish(this.snapshot, true);
    this.eventEmitter.countdown(3);
    if (this.registry.get('paused')) this.setPaused(true);
  }

  update(_time: number, deltaMs: number): void {
    if (!this.player || this.snapshot.phase === 'finished' || this.pitFallCinematicActive) return;
    if (this.snapshot.phase === 'countdown') {
      this.countdownRemainingMs -= deltaMs;
      const nextValue = Math.max(0, Math.ceil(this.countdownRemainingMs / 1_000)) as 0 | 1 | 2 | 3;
      while (this.countdownValue > nextValue) {
        this.countdownValue = (this.countdownValue - 1) as 0 | 1 | 2 | 3;
        this.eventEmitter.countdown(this.countdownValue);
      }
      if (this.countdownRemainingMs <= 0) {
        this.inputBridge.clear();
        this.publish(startRunner(this.snapshot), true);
      }
      return;
    }
    const input = this.inputBridge.consumeFrame();
    this.player.setSliding(input.slideHeld);
    if (input.jumpPressed) this.player.jump();
    this.player.update(deltaMs);
    const gateAwards: { id: RunnerGateId; awardedMs: number }[] = [];
    const { state, result } = advanceRunner(this.snapshot, deltaMs,
      (id, awardedMs) => gateAwards.push({ id, awardedMs }));
    this.backdrop.update(state, deltaMs);
    this.publish(state, gateAwards.length > 0 || result !== null);
    for (const gate of gateAwards) this.eventEmitter.gate(gate.id, gate.awardedMs);
    this.player.setHurt(state.staggerRemainingMs > 0);
    this.player.setProtected(state.protectionRemainingMs);
    this.player.setPassiveEffect(state.passiveEffectRemainingMs);
    this.drawPassiveEffect(state.passiveEffectRemainingMs);
    this.spawner.update(state);
    this.collectibles.update(state);
    this.pits.update(state);
    if (result) {
      this.inputBridge.clear();
      this.emitFinished(result);
    }
  }

  setPaused(paused: boolean): void {
    this.registry.set('paused', paused);
    if (!this.snapshot || this.snapshot.phase === 'finished') return;
    this.inputBridge.clear();
    this.heldKeyboardActions.clear();
    if (paused) {
      this.publish(pauseRunner(this.snapshot), true);
      this.scene.pause();
    } else {
      this.publish(resumeRunner(this.snapshot), true);
      this.scene.resume();
    }
  }

  getSnapshot(): RunnerSnapshot {
    return this.snapshot;
  }

  protected publish(snapshot: RunnerSnapshot, force = false): void {
    this.snapshot = snapshot;
    this.eventEmitter.snapshot(snapshot, this.time.now, force);
  }

  private drawPassiveEffect(remainingMs: number): void {
    this.passiveEffectArt.clear();
    if (this.snapshot.characterId !== 'hanayo-hiyori' || remainingMs <= 0) return;
    const x = RUNNER_PLAYER_X;
    const y = this.player.gameObject.y - 38;
    this.passiveEffectArt.fillStyle(0xff7fbd, 0.2).fillCircle(x, y, 48);
    this.passiveEffectArt.fillStyle(0xff68ad, 0.94)
      .fillTriangle(x - 28, y + 14, x - 20, y - 14, x - 11, y + 14)
      .fillTriangle(x - 10, y + 18, x, y - 22, x + 9, y + 18)
      .fillTriangle(x + 10, y + 14, x + 20, y - 13, x + 28, y + 14);
    this.passiveEffectArt.fillStyle(0xffe2f0, 0.9)
      .fillCircle(x - 20, y + 5, 3).fillCircle(x, y - 2, 3).fillCircle(x + 20, y + 5, 3);
  }

  private readonly handlePickup = (pickup: PickupDefinition): void => {
    const next = collectPickup(this.snapshot, pickup);
    if (next === this.snapshot) return;
    const awardedMs = next.remainingMs - this.snapshot.remainingMs;
    this.publish(next, true);
    this.eventEmitter.pickup(pickup.id, pickup.kind, awardedMs);
  };

  private readonly handleHazardOverlap = (): void => {
    const { state, hit, blockedByPassive, result } = tryResolveHazardHit(this.snapshot);
    if (!hit) return;
    this.publish(state, true);
    if (blockedByPassive) {
      this.player.setPassiveEffect(state.passiveEffectRemainingMs);
      this.eventEmitter.passiveTriggered(state.passiveChargesRemaining, 'obstacle');
      return;
    }
    this.player.setHurt(true);
    this.player.setProtected(state.protectionRemainingMs);
    if (result) this.emitFinished(result);
  };

  private readonly handlePitFall = (_pit: PitDefinition): PitFallContactResult => {
    if (this.finishEmitted || this.pitFallCinematicActive || this.snapshot.phase !== 'running') return 'ignored';
    const { state, blockedByPassive, result } = tryResolvePitFall(this.snapshot);
    if (blockedByPassive) {
      this.publish(state, true);
      this.heldKeyboardActions.clear();
      this.inputBridge.clear();
      this.player.setPassiveEffect(state.passiveEffectRemainingMs);
      this.player.beginPitRescue();
      this.eventEmitter.passiveTriggered(state.passiveChargesRemaining, 'pit');
      const safeY = this.player.gameObject.y;
      this.tweens.add({
        targets: this.player.gameObject,
        y: safeY + 36,
        duration: 180,
        ease: 'Cubic.In',
        onComplete: () => {
          this.tweens.add({
            targets: this.player.gameObject,
            y: safeY,
            duration: 320,
            ease: 'Back.Out',
            onComplete: () => this.player.endPitRescue(),
          });
        },
      });
      return 'rescued';
    }
    if (!result) return 'ignored';
    this.pitFallCinematicActive = true;
    this.pendingPitFinish = { state, result };
    this.heldKeyboardActions.clear();
    this.inputBridge.clear();
    this.player.beginPitFall();
    this.pitFallTween = this.tweens.add({
      targets: this.player.gameObject,
      y: 620,
      duration: 700,
      ease: 'Cubic.In',
      onComplete: () => {
        this.pitFallTween = null;
        if (!this.pitFallCinematicActive || !this.pendingPitFinish) return;
        this.cameras.main.shake(250, 0.012);
        this.pitFinishTimer = this.time.delayedCall(250, this.finalizePitFall);
      },
    });
    return 'fatal';
  };

  private readonly finalizePitFall = (): void => {
    const pending = this.pendingPitFinish;
    if (!this.pitFallCinematicActive || !pending || this.finishEmitted) return;
    this.pitFinishTimer = null;
    this.pendingPitFinish = null;
    this.pitFallCinematicActive = false;
    this.publish(pending.state, true);
    this.emitFinished(pending.result);
  };

  private emitFinished(result: RunnerResult): void {
    if (this.finishEmitted) return;
    this.finishEmitted = true;
    this.inputBridge.clear();
    const decision = browserPersonalBestStore.record(result);
    const outcome: RunnerFinishOutcome = decision.isNewBest ? 'personal-best' : 'completed';
    this.player.finish(result.finishReason === 'pit' || !decision.isNewBest ? 'gameOver' : 'victory');
    this.eventEmitter.finish(result, outcome);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) return;
    event.preventDefault();
    if (this.snapshot.phase !== 'running') return;
    if (this.heldKeyboardActions.has(event.code)) return;
    this.heldKeyboardActions.add(event.code);
    this.inputBridge.press(event.code === 'ArrowDown' ? 'slide' : 'jump');
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (!['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) return;
    event.preventDefault();
    this.heldKeyboardActions.delete(event.code);
    if (event.code === 'ArrowDown') this.inputBridge.release('slide');
    else if (!this.heldKeyboardActions.has('Space') && !this.heldKeyboardActions.has('ArrowUp')) {
      this.inputBridge.release('jump');
    }
  };

  private readonly handleBlur = (): void => {
    this.heldKeyboardActions.clear();
    this.inputBridge.clear();
    this.player?.setSliding(false);
    this.setPaused(true);
  };

  private handleLoadError(file: { key: string }): void {
    const callback = this.registry.get('onError') as (error: Error) => void;
    callback(new Error(`캐릭터 이미지 로딩 실패: ${file.key}`));
  }

  private cleanup(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);
    this.heldKeyboardActions.clear();
    this.inputBridge?.clear();
    this.pitFallTween?.stop();
    this.pitFallTween = null;
    this.pitFinishTimer?.remove(false);
    this.pitFinishTimer = null;
    this.pendingPitFinish = null;
    this.pitFallCinematicActive = false;
    if (this.player) this.tweens.killTweensOf(this.player.gameObject);
    this.player?.destroy();
    this.spawner?.destroy();
    this.collectibles?.destroy();
    this.pits?.destroy();
    this.backdrop?.destroy();
    this.passiveEffectArt?.destroy();
  }
}
