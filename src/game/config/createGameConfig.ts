import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PlayScene } from '../scenes/PlayScene';
import type { PlayerSave } from '../../services/GameGateway';

export function createGameConfig(parent: HTMLElement, stageId: string, initialLives = 5, initialSave?: PlayerSave | null): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: '#162044',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    callbacks: {
      preBoot: (game) => {
        game.registry.set('initialStageId', stageId);
        game.registry.set('initialLives', initialLives);
        game.registry.set('initialSave', initialSave ?? null);
      },
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 900 },
        debug: false,
      },
    },
    scene: [BootScene, PlayScene],
  };
}
