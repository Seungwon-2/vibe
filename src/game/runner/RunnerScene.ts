import Phaser from 'phaser';
import { getCharacter } from '../characters/characterCatalog';
import type { CharacterId } from '../characters/characterTypes';
import { advanceRunner, beginRunnerSlide, collectPickup, createRunnerSnapshot, pauseRunner, resumeRunner, startRunner } from './RunnerSimulation';
import { RunnerPlayer, RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './RunnerPlayer';
import type { RunnerInputBridge } from './RunnerInput';
import type { RunnerGateId, RunnerMode, RunnerResult, RunnerSnapshot, StoryStageId } from './runnerTypes';
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
import { RunnerTrailEffect } from './RunnerTrailEffect';
import { getRunnerAnimationPlayback } from './runnerAnimationConfig';

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
  private trailEffect!: RunnerTrailEffect;
  private pits!: PitSpawner;
  private finishEmitted = false;
  private finishPending = false;
  private storyFinishTimer: Phaser.Time.TimerEvent | null = null;
  private pitFallCinematicActive = false;
  private pendingPitFinish: { state: RunnerSnapshot; result: RunnerResult } | null = null;
  private pitFallTween: Phaser.Tweens.Tween | null = null;
  private pitFinishTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'RunnerScene' });
  }

  preload(): void {
    const character = getCharacter(this.registry.get('characterId') as CharacterId);
    const qualityFrames = new Map(character.qualityAnimations.run.map((frame) => [frame.textureKey, frame.url]));
    for (const frames of Object.values(character.qualityAnimations)) {
      for (const frame of frames) qualityFrames.set(frame.textureKey, frame.url);
    }
    for (const [textureKey, url] of qualityFrames) this.load.image(textureKey, url);
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
    this.snapshot = createRunnerSnapshot(characterId, new Date(), {
      mode: this.registry.get('runnerMode') as RunnerMode,
      storyStageId: this.registry.get('storyStageId') as StoryStageId | null,
    });
    this.backdrop = new RunnerBackdrop(this, 0,
      this.snapshot.mode === 'story' ? this.snapshot.storyStageId ?? null : null);
    this.passiveEffectArt = this.add.graphics().setDepth(3);

    const animationFrames = {
      run: character.qualityAnimations.run,
      jump: character.qualityAnimations.jump.slice(0, 4),
      'jump-fall': character.qualityAnimations.jump.slice(4),
      // A second jump reaches its apex after about 0.47s. All six frames at
      // 12 fps fit the ascent, including the spin recovery in frames 4–5.
      doubleJump: character.qualityAnimations.doubleJump,
      'double-jump-fall': character.qualityAnimations.doubleJump.slice(4),
      // The first curated slide is a tall entry pose; start at the low pose
      // so the visible art clears the overhead hazard at its native scale.
      slide: character.available
        ? character.qualityAnimations.slide.slice(2, 4)
        : character.qualityAnimations.slide.slice(1, 4),
      hurt: getHurtAnimationFrames(character.qualityAnimations.hurt),
      victory: character.qualityAnimations.victory,
      gameOver: character.qualityAnimations.gameOver,
    } as const;
    for (const [name, frames] of Object.entries(animationFrames)) {
      if (frames.length === 0) throw new Error(`Missing ${characterId}:${name} frames`);
      if (this.anims.exists(`${characterId}:${name}`)) continue;
      const playback = getRunnerAnimationPlayback(name, character);
      this.anims.create({
        key: `${characterId}:${name}`,
        frames: frames.map((frame) => ({ key: frame.textureKey })),
        frameRate: playback.frameRate,
        repeat: playback.repeat,
      });
    }

    // The backdrop paints the ground; this transparent rectangle only supports physics.
    const floor = this.add.rectangle(0, RUNNER_GROUND_Y, 960, 70, 0xffffff, 0).setOrigin(0, 0);
    this.physics.add.existing(floor, true);
    const sprite = this.physics.add.sprite(
      RUNNER_PLAYER_X, RUNNER_GROUND_Y, character.qualityAnimations.run[0].textureKey,
    );
    this.physics.add.collider(sprite, floor, undefined, this.shouldCollideWithFloor);
    this.player = new RunnerPlayer(sprite, characterId);
    this.trailEffect = new RunnerTrailEffect(this, this.registry.get('trailCosmeticId') as string | null);
    this.spawner = new ObstacleSpawner(this, this.player.gameObject, this.handleHazardOverlap,
      this.registry.get('runnerTutorialEnabled') === true, () => this.player.isSliding);
    this.collectibles = new CollectibleSpawner(this, this.player.gameObject, this.handlePickup, characterId);
    this.pits = new PitSpawner(this, this.player.gameObject, this.handlePitFall,
      this.registry.get('runnerTutorialEnabled') === true);
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
    if (this.player.setSliding(input.slideHeld)) {
      this.snapshot = beginRunnerSlide(this.snapshot);
      this.eventEmitter.playerAction('slide');
    }
    if (input.jumpPressed && this.player.jump()) {
      this.eventEmitter.playerAction(this.player.jumpCount === 1 ? 'jump' : 'double-jump');
    }
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
    this.player.setGiant(state.giantRemainingMs > 0);
    this.trailEffect.update(this.time.now, deltaMs, this.player.gameObject.x, this.player.gameObject.y - 12,
      state.phase === 'running', !this.player.isGrounded || (state.stageSpeedBoostRemainingMs ?? 0) > 0 || state.giantRemainingMs > 0);
    this.drawPassiveEffect(state.passiveEffectRemainingMs, state.slideGuardRemainingMs);
    this.spawner.update(state);
    this.collectibles.update(state);
    this.pits.update(state);
    if (result) {
      this.inputBridge.clear();
      if (result.mode === 'story' && result.finishReason === 'stage-complete') {
        this.beginStoryFinish(result);
      } else if (result.mode === 'story' && result.finishReason === 'lives-exhausted') {
        this.beginStoryDefeat(result);
      } else {
        this.emitFinished(result);
      }
    }
  }

  setPaused(paused: boolean): void {
    this.registry.set('paused', paused);
    if (!this.snapshot || this.snapshot.phase === 'finished') return;
    this.inputBridge.clear();
    this.heldKeyboardActions.clear();
    if (paused) {
      this.trailEffect?.clear();
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

  private drawPassiveEffect(remainingMs: number, slideGuardRemainingMs: number): void {
    this.passiveEffectArt.clear();
    const hiyoriActive = this.snapshot.characterId === 'hanayo-hiyori' && remainingMs > 0;
    const toaActive = this.snapshot.characterId === 'goth-student' &&
      ((this.player.isSliding && slideGuardRemainingMs > 0) || remainingMs > 0);
    const x = RUNNER_PLAYER_X;
    const y = this.player.gameObject.y - 38;
    if (!hiyoriActive && !toaActive) return;
    if (toaActive) {
      this.passiveEffectArt.fillStyle(0x9b68e8, 0.24).fillEllipse(x - 30, y + 9, 56, 24)
        .fillEllipse(x - 55, y + 14, 40, 16);
      this.passiveEffectArt.lineStyle(3, 0xd8b7ff, 0.8).lineBetween(x - 66, y + 15, x - 4, y + 15);
      return;
    }
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
    const awardedMs = next.mode === 'story' && pickup.kind === 'time'
      ? RUNNER_CONFIG.storySpeedBoostMs
      : next.remainingMs - this.snapshot.remainingMs;
    this.publish(next, true);
    this.player.setGiant(next.giantRemainingMs > 0);
    this.eventEmitter.pickup(pickup.id, pickup.kind, awardedMs);
  };

  private readonly shouldCollideWithFloor = (): boolean => {
    if (!this.player || !this.pits) return true;
    const body = this.player.body;
    const footX = (body.left + body.right) / 2;
    return !this.pits.isPlayerFootInPitOpening(footX);
  };

  private readonly handleHazardOverlap = (): void => {
    const { state, hit, blockedByPassive, passiveId, result } = tryResolveHazardHit(this.snapshot, this.player.isSliding);
    if (!hit) return;
    this.publish(state, true);
    if (blockedByPassive) {
      this.player.setPassiveEffect(state.passiveEffectRemainingMs);
      this.player.setProtected(state.protectionRemainingMs);
      if (passiveId === 'toa-ghost-glide') this.eventEmitter.toaGlideTriggered();
      else this.eventEmitter.passiveTriggered(state.passiveChargesRemaining, 'obstacle');
      return;
    }
    this.eventEmitter.hazardHit();
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
      this.player.setProtected(state.protectionRemainingMs);
      this.player.setGiant(state.giantRemainingMs > 0);
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
    this.trailEffect.clear();
    this.eventEmitter.pitFallStarted();
    this.pendingPitFinish = { state, result };
    this.heldKeyboardActions.clear();
    this.inputBridge.clear();
    this.player.beginPitFall();
    this.player.setGiant(false);
    this.passiveEffectArt.clear();
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

  private beginStoryFinish(result: RunnerResult): void {
    if (this.finishEmitted || this.finishPending) return;
    this.finishPending = true;
    this.inputBridge.clear();
    this.heldKeyboardActions.clear();
    this.trailEffect.clear();
    this.player.finish('victory');
    this.storyFinishTimer = this.time.delayedCall(RUNNER_CONFIG.storyVictoryHoldMs, () => {
      this.storyFinishTimer = null;
      this.finishPending = false;
      this.emitFinished(result);
    });
  }

  private beginStoryDefeat(result: RunnerResult): void {
    if (this.finishEmitted || this.finishPending) return;
    this.finishPending = true;
    this.inputBridge.clear();
    this.heldKeyboardActions.clear();
    this.trailEffect.clear();
    this.player.finish('gameOver');
    this.storyFinishTimer = this.time.delayedCall(RUNNER_CONFIG.storyDefeatHoldMs, () => {
      this.storyFinishTimer = null;
      this.finishPending = false;
      this.emitFinished(result);
    });
  }

  private emitFinished(result: RunnerResult): void {
    if (this.finishEmitted) return;
    this.finishEmitted = true;
    this.inputBridge.clear();
    this.trailEffect.clear();
    const decision = result.mode === 'story' ? { isNewBest: false } : browserPersonalBestStore.record(result);
    const outcome: RunnerFinishOutcome = decision.isNewBest ? 'personal-best' : 'completed';
    const animation = result.mode === 'story'
      ? result.completedStage ? 'victory' : 'gameOver'
      : result.finishReason === 'pit' || !decision.isNewBest ? 'gameOver' : 'victory';
    this.player.finish(animation);
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
    this.storyFinishTimer?.remove(false);
    this.storyFinishTimer = null;
    this.finishPending = false;
    this.pendingPitFinish = null;
    this.pitFallCinematicActive = false;
    if (this.player) this.tweens.killTweensOf(this.player.gameObject);
    this.player?.destroy();
    this.spawner?.destroy();
    this.collectibles?.destroy();
    this.pits?.destroy();
    this.backdrop?.destroy();
    this.passiveEffectArt?.destroy();
    this.trailEffect?.destroy();
  }
}
