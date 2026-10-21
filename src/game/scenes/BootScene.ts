import Phaser from 'phaser';
import atlas from '../characters/characterAtlas.json';
import { defaultCharacter } from '../characters/defaultCharacter';
import atlasImageUrl from '../../../assets/character/runtime/player-default.png';
import atlasManifest from '../../../assets/character/runtime/player-default.json';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      this.registry.set('assetLoadError', `리소스 로드 실패: ${file.key}`);
    });
    this.load.atlas(defaultCharacter.textureKey, atlasImageUrl, atlasManifest);
  }

  create(): void {
    this.registry.set('characterFrameCount', atlas.frames.length);
    this.scene.start('PlayScene');
  }
}
