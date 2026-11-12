import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import type { CharacterId } from '../characters/characterTypes';
import { createRunnerGameConfig } from './createRunnerGameConfig';
import type { RunnerInputBridge } from './RunnerInput';
import type { RunnerFinishOutcome, RunnerMode, RunnerResult, RunnerSnapshot, StoryStageId } from './runnerTypes';
import { RunnerScene } from './RunnerScene';
import type { RunnerEvent } from './runnerEvents';
import type { RunnerActiveSession } from './runnerSessionTypes';

export type RunnerGameProps = {
  characterId: CharacterId;
  mode?: RunnerMode;
  storyStageId?: StoryStageId | null;
  trailCosmeticId?: string | null;
  inputBridge: RunnerInputBridge;
  paused: boolean;
  tutorialEnabled: boolean;
  initialSession?: RunnerActiveSession | null;
  onCheckpoint?(session: RunnerActiveSession): void;
  onTerminalCheckpoint?(result: RunnerResult, outcome: RunnerFinishOutcome): void;
  onSnapshot(snapshot: RunnerSnapshot): void;
  onFinished(result: RunnerResult, outcome: RunnerFinishOutcome): void;
  onEvent?(event: RunnerEvent): void;
};

export function RunnerGame({
  characterId, mode = 'endless', storyStageId = null, trailCosmeticId = null, inputBridge, paused, tutorialEnabled,
  initialSession = null, onCheckpoint, onTerminalCheckpoint, onSnapshot, onFinished, onEvent,
}: RunnerGameProps): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const initialPaused = useRef(paused);
  const callbacksRef = useRef({ onSnapshot, onFinished, onEvent, onCheckpoint, onTerminalCheckpoint });
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    callbacksRef.current = { onSnapshot, onFinished, onEvent, onCheckpoint, onTerminalCheckpoint };
  }, [onSnapshot, onFinished, onEvent, onCheckpoint, onTerminalCheckpoint]);

  useEffect(() => {
    if (!hostRef.current) return;
    let game: Phaser.Game | null = null;
    try {
      game = new Phaser.Game(createRunnerGameConfig(hostRef.current, characterId, mode, storyStageId, trailCosmeticId, inputBridge, {
        onSnapshot: (snapshot) => callbacksRef.current.onSnapshot(snapshot),
        onFinished: (result, outcome) => callbacksRef.current.onFinished(result, outcome),
        onEvent: (event) => callbacksRef.current.onEvent?.(event),
        onCheckpoint: (session) => callbacksRef.current.onCheckpoint?.(session),
        onTerminalCheckpoint: (result, outcome) => callbacksRef.current.onTerminalCheckpoint?.(result, outcome),
        onError: (failure) => {
          callbacksRef.current.onEvent?.({ type: 'fatal-error', message: failure.message });
          setError(failure.message);
        },
      }, tutorialEnabled, initialSession));
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
  }, [characterId, mode, storyStageId, trailCosmeticId, inputBridge, tutorialEnabled, initialSession, attempt]);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    game.registry.set('paused', paused);
    if (!game.isBooted) return;
    const scene = game.scene.keys.RunnerScene;
    if (scene instanceof RunnerScene) {
      scene.setPaused(paused);
      if (paused) {
        const session = scene.createSessionCheckpoint();
        if (session) callbacksRef.current.onCheckpoint?.(session);
      }
    }
  }, [paused, attempt]);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    const checkpoint = (leavePaused: boolean): void => {
      inputBridge.clear();
      if (!game.isBooted) return;
      const scene = game.scene.keys.RunnerScene;
      if (!(scene instanceof RunnerScene)) return;
      if (!scene.canCreateSessionCheckpoint()) return;
      if (scene.getSnapshot().phase === 'running') scene.setPaused(true);
      const session = scene.createSessionCheckpoint();
      if (session) callbacksRef.current.onCheckpoint?.(session);
      if (!leavePaused && scene.getSnapshot().phase === 'paused') scene.setPaused(false);
    };
    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') checkpoint(true);
    };
    const onPageHide = (): void => checkpoint(true);
    const interval = window.setInterval(() => {
      if (!game.isBooted) return;
      const scene = game.scene.keys.RunnerScene;
      if (scene instanceof RunnerScene && scene.getSnapshot().phase === 'running') checkpoint(false);
    }, 1_000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [inputBridge, attempt]);

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
