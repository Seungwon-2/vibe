import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { createGameConfig } from './config/createGameConfig';
import type { GameEvent } from './events';
import type { PlayerSave } from '../services/GameGateway';

type PhaserGameProps = {
  stageId: string;
  initialLives: number;
  initialSave?: PlayerSave | null;
  paused: boolean;
  onEvent: (event: GameEvent) => void;
  onDestroy?: () => void;
};

export function PhaserGame({ stageId, initialLives, initialSave, paused, onEvent, onDestroy }: PhaserGameProps): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;

    let game: Phaser.Game;
    try {
      game = new Phaser.Game(createGameConfig(parent, stageId, initialLives, initialSave));
      gameRef.current = game;
      if (errorRef.current) errorRef.current.hidden = true;
      game.events.on('platformer-event', onEvent);
    } catch (cause) {
      if (errorRef.current) {
        errorRef.current.textContent = `게임을 시작할 수 없습니다: ${
          cause instanceof Error ? cause.message : '게임 엔진을 시작하지 못했습니다.'
        }`;
        errorRef.current.hidden = false;
      }
      return;
    }

    return () => {
      game.events.off('platformer-event', onEvent);
      game.destroy(true);
      gameRef.current = null;
      onDestroy?.();
    };
  }, [initialLives, initialSave, onDestroy, onEvent, stageId]);

  useEffect(() => {
    const game = gameRef.current;
    if (game?.scene.isActive('PlayScene')) {
      if (paused) game.scene.pause('PlayScene');
      else game.scene.resume('PlayScene');
    }
  }, [paused]);

  return (
    <div className="phaser-frame" aria-label="플랫포머 게임 화면">
      <div className="phaser-host" ref={hostRef} />
      <p className="game-error" role="alert" hidden ref={errorRef} />
    </div>
  );
}
