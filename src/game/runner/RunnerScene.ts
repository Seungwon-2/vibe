import Phaser from 'phaser';
import { getCharacter } from '../characters/characterCatalog';
import type { CharacterId } from '../characters/characterTypes';
import { advanceRunner, createRunnerSnapshot, pauseRunner, resumeRunner, startRunner } from './RunnerSimulation';
import { RunnerPlayer, RUNNER_GROUND_Y, RUNNER_PLAYER_X } from './RunnerPlayer';
import type { RunnerInputBridge } from './RunnerInput';
import type { RunnerResult, RunnerSnapshot } from './runnerTypes';
import { RUNNER_CONFIG } from './runnerConfig';

export class RunnerScene extends Phaser.Scene {
  private inputBridge!: RunnerInputBridge;
  private player!: RunnerPlayer;
  private snapshot!: RunnerSnapshot;
  private countdownRemainingMs = RUNNER_CONFIG.countdownMs;
  private onSnapshot!: (snapshot: RunnerSnapshot) => void;
  private onFinished!: (result: RunnerResult) => void;
  private heldKeyboardActions = new Set<string>();

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
    this.onSnapshot = this.registry.get('onSnapshot') as (snapshot: RunnerSnapshot) => void;
    this.onFinished = this.registry.get('onFinished') as (result: RunnerResult) => void;
    this.snapshot = createRunnerSnapshot(characterId);

    for (const name of ['run', 'jump', 'doubleJump', 'slide', 'hurt'] as const) {
      const frames = character.animations[name];
      if (frames.length === 0) continue;
      this.anims.create({
        key: `${characterId}:${name}`,
        frames: frames.map((frame) => ({ key: character.textureKey, frame })),
        frameRate: name === 'run' ? 12 / 0.768 : 12,
        repeat: name === 'run' || name === 'slide' ? -1 : 0,
      });
    }

    const floor = this.add.rectangle(0, RUNNER_GROUND_Y, 960, 70, 0x243451).setOrigin(0, 0);
    this.physics.add.existing(floor, true);
    const sprite = this.physics.add.sprite(
      RUNNER_PLAYER_X, RUNNER_GROUND_Y, character.textureKey, character.animations.run[0],
    );
    this.physics.add.collider(sprite, floor);
    this.player = new RunnerPlayer(sprite, characterId);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
    this.onSnapshot(this.snapshot);
    if (this.registry.get('paused')) this.setPaused(true);
  }

  update(_time: number, deltaMs: number): void {
    if (!this.player || this.snapshot.phase === 'finished') return;
    if (this.snapshot.phase === 'countdown') {
      this.countdownRemainingMs -= deltaMs;
      if (this.countdownRemainingMs <= 0) this.publish(startRunner(this.snapshot));
      return;
    }
    const input = this.inputBridge.consumeFrame();
    this.player.setSliding(input.slideHeld);
    if (input.jumpPressed) this.player.jump();
    this.player.update(deltaMs);
    const { state, result } = advanceRunner(this.snapshot, deltaMs);
    this.publish(state);
    if (result) {
      this.inputBridge.clear();
      this.onFinished(result);
    }
  }

  setPaused(paused: boolean): void {
    this.registry.set('paused', paused);
    if (!this.snapshot || this.snapshot.phase === 'finished') return;
    this.inputBridge.clear();
    this.heldKeyboardActions.clear();
    if (paused) {
      this.publish(pauseRunner(this.snapshot));
      this.scene.pause();
    } else {
      this.publish(resumeRunner(this.snapshot));
      this.scene.resume();
    }
  }

  getSnapshot(): RunnerSnapshot {
    return this.snapshot;
  }

  protected publish(snapshot: RunnerSnapshot): void {
    this.snapshot = snapshot;
    this.onSnapshot(snapshot);
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
    this.inputBridge.release(event.code === 'ArrowDown' ? 'slide' : 'jump');
  };

  private readonly handleBlur = (): void => {
    this.heldKeyboardActions.clear();
    this.inputBridge.clear();
    this.player?.setSliding(false);
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
    this.player?.destroy();
  }
}
