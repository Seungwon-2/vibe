import Phaser from 'phaser';
import { defaultCharacter } from '../characters/defaultCharacter';
import { PlayerActor } from '../characters/PlayerActor';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
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

    const ground = this.add.rectangle(width / 2, height - 18, width, 36, 0x26365f);
    this.physics.add.existing(ground, true);
    const player = new PlayerActor(this, defaultCharacter.id, 130, height - 90);
    this.physics.add.collider(player.sprite, ground);
    this.physics.world.setBounds(0, 0, width, height);
    player.sprite.setDepth(2);
  }
}
