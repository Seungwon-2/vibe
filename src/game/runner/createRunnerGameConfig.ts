import Phaser from 'phaser';
import type { CharacterId } from '../characters/characterTypes';
import type { RunnerFinishOutcome, RunnerResult, RunnerSnapshot } from './runnerTypes';
import type { RunnerInputBridge } from './RunnerInput';
import { RunnerScene } from './RunnerScene';
import type { RunnerEvent } from './runnerEvents';

export type RunnerGameCallbacks = {
  onSnapshot(snapshot: RunnerSnapshot): void;
  onFinished(result: RunnerResult, outcome: RunnerFinishOutcome): void;
  onEvent?(event: RunnerEvent): void;
  onError(error: Error): void;
};

export function createRunnerGameConfig(
  parent: HTMLElement,
  characterId: CharacterId,
  inputBridge: RunnerInputBridge,
  callbacks: RunnerGameCallbacks,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: '#10152d',
    pixelArt: false,
    antialias: true,
    roundPixels: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 900 }, debug: false } },
    scene: [RunnerScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set('characterId', characterId);
        game.registry.set('inputBridge', inputBridge);
        game.registry.set('onSnapshot', callbacks.onSnapshot);
        game.registry.set('onFinished', callbacks.onFinished);
        game.registry.set('onEvent', callbacks.onEvent);
        game.registry.set('onError', callbacks.onError);
      },
    },
  };
}
