import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { createGameConfig } from './config/createGameConfig';

type PhaserGameProps = {
  onReady?: (game: Phaser.Game) => void;
  onDestroy?: () => void;
};

export function PhaserGame({ onReady, onDestroy }: PhaserGameProps): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;

    let game: Phaser.Game;
    try {
      game = new Phaser.Game(createGameConfig(parent));
      if (errorRef.current) errorRef.current.hidden = true;
      onReady?.(game);
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
      game.destroy(true);
      onDestroy?.();
    };
  }, [onDestroy, onReady]);

  return (
    <div className="phaser-frame" aria-label="플랫포머 게임 화면">
      <div className="phaser-host" ref={hostRef} />
      <p className="game-error" role="alert" hidden ref={errorRef} />
    </div>
  );
}
