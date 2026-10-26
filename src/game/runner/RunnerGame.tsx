import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import type { CharacterId } from '../characters/characterTypes';
import { createRunnerGameConfig } from './createRunnerGameConfig';
import type { RunnerInputBridge } from './RunnerInput';
import type { RunnerResult, RunnerSnapshot } from './runnerTypes';
import { RunnerScene } from './RunnerScene';

export type RunnerGameProps = {
  characterId: CharacterId;
  inputBridge: RunnerInputBridge;
  paused: boolean;
  onSnapshot(snapshot: RunnerSnapshot): void;
  onFinished(result: RunnerResult): void;
};

export function RunnerGame({
  characterId, inputBridge, paused, onSnapshot, onFinished,
}: RunnerGameProps): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const initialPaused = useRef(paused);
  const callbacksRef = useRef({ onSnapshot, onFinished });
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    callbacksRef.current = { onSnapshot, onFinished };
  }, [onSnapshot, onFinished]);

  useEffect(() => {
    if (!hostRef.current) return;
    let game: Phaser.Game | null = null;
    try {
      game = new Phaser.Game(createRunnerGameConfig(hostRef.current, characterId, inputBridge, {
        onSnapshot: (snapshot) => callbacksRef.current.onSnapshot(snapshot),
        onFinished: (result) => callbacksRef.current.onFinished(result),
        onError: (failure) => setError(failure.message),
      }));
      game.registry.set('paused', initialPaused.current);
      gameRef.current = game;
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : '게임 화면을 시작할 수 없습니다.';
      queueMicrotask(() => setError(message));
    }
    return () => {
      inputBridge.clear();
      gameRef.current = null;
      game?.destroy(true);
    };
  }, [characterId, inputBridge, attempt]);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    game.registry.set('paused', paused);
    if (!game.isBooted) return;
    const scene = game.scene.getScene('RunnerScene');
    if (scene instanceof RunnerScene) scene.setPaused(paused);
  }, [paused, attempt]);

  return (
    <div className="runner-game">
      <div ref={hostRef} className="runner-game__canvas" aria-label="러닝 게임 화면" />
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => { setError(null); setAttempt((value) => value + 1); }}>
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
