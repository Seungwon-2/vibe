import { useEffect, useRef, useState } from 'react';
import { getCharacter } from '../../game/characters/characterCatalog';
import type { CharacterId } from '../../game/characters/characterTypes';
import { RunnerGame } from '../../game/runner/RunnerGame';
import { RunnerInputBridge } from '../../game/runner/RunnerInput';
import { createRunnerSnapshot } from '../../game/runner/RunnerSimulation';
import type { RunnerFinishOutcome, RunnerResult, RunnerSnapshot } from '../../game/runner/runnerTypes';
import type { RunnerEvent } from '../../game/runner/runnerEvents';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { PauseOverlay } from '../components/PauseOverlay';
import { RunnerHud } from '../components/RunnerHud';
import { TouchControls } from '../components/TouchControls';

type RecentBonus = { id: string; kind: 'pickup' | 'gate'; awardedMs: number } | null;

function isPortrait(): boolean {
  return window.matchMedia?.('(orientation: portrait)').matches ?? window.innerHeight > window.innerWidth;
}

export type RunScreenProps = {
  characterId: CharacterId;
  onFinish(result: RunnerResult, outcome: RunnerFinishOutcome): void;
  onExit(): void;
};

export function RunScreen({ characterId, onFinish, onExit }: RunScreenProps): React.JSX.Element {
  const character = getCharacter(characterId);
  const [portrait, setPortrait] = useState(isPortrait);
  const [paused, setPaused] = useState(isPortrait);
  const [snapshot, setSnapshot] = useState<RunnerSnapshot>(() => createRunnerSnapshot(characterId));
  const [countdownValue, setCountdownValue] = useState<number | null>(3);
  const [recentBonus, setRecentBonus] = useState<RecentBonus>(null);
  const [exitConfirmation, setExitConfirmation] = useState(false);
  const [inputBridge] = useState(() => new RunnerInputBridge());
  const bonusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearBonus(): void {
    if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
    bonusTimeout.current = null;
    setRecentBonus(null);
  }

  function pauseRun(): void {
    clearBonus();
    setPaused(true);
  }

  useEffect(() => {
    const media = window.matchMedia?.('(orientation: portrait)');
    const updateOrientation = (): void => {
      const nextPortrait = isPortrait();
      setPortrait(nextPortrait);
      if (nextPortrait) {
        if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
        bonusTimeout.current = null;
        setRecentBonus(null);
        setPaused(true);
      }
    };
    media?.addEventListener?.('change', updateOrientation);
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    return () => {
      media?.removeEventListener?.('change', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
      if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
      inputBridge.clear();
    };
  }, [inputBridge]);

  useEffect(() => {
    const onPauseShortcut = (event: KeyboardEvent): void => {
      if (event.code !== 'KeyP' || event.repeat) return;
      if (paused && !portrait && !exitConfirmation) {
        setPaused(false);
      } else if (!paused && snapshot.phase === 'running') {
        if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
        bonusTimeout.current = null;
        setRecentBonus(null);
        inputBridge.clear();
        setPaused(true);
      }
    };
    window.addEventListener('keydown', onPauseShortcut);
    return () => window.removeEventListener('keydown', onPauseShortcut);
  }, [exitConfirmation, inputBridge, paused, portrait, snapshot.phase]);

  function handleEvent(event: RunnerEvent): void {
    if (event.type === 'countdown') {
      setCountdownValue(event.value > 0 ? event.value : null);
    } else if ((event.type === 'pickup' || event.type === 'gate') && event.awardedMs > 0) {
      if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
      setRecentBonus({
        id: event.type === 'pickup' ? event.pickupId : event.gateId,
        kind: event.type,
        awardedMs: event.awardedMs,
      });
      bonusTimeout.current = setTimeout(() => {
        bonusTimeout.current = null;
        setRecentBonus(null);
      }, 900);
    }
  }

  function requestExit(): void {
    pauseRun();
    setExitConfirmation(true);
  }

  return (
    <main className="run-screen">
      <header className="run-screen__header">
        <div><span className="eyebrow">RUNNING ACTION</span><strong>{character.displayName}</strong></div>
        <button type="button" onClick={requestExit}>나가기</button>
      </header>
      <div className="runner-stage" role="region" aria-label="러닝 게임 화면">
        <RunnerGame characterId={characterId} inputBridge={inputBridge} paused={paused}
          onSnapshot={(next) => {
            setSnapshot(next);
            if (next.phase === 'paused') setPaused(true);
          }}
          onFinished={onFinish}
          onEvent={handleEvent} />
        <RunnerHud snapshot={snapshot} character={character} recentBonus={recentBonus} onPause={pauseRun} />
        <TouchControls inputBridge={inputBridge}
          disabled={paused || snapshot.phase !== 'running'} />
        {snapshot.phase === 'countdown' && countdownValue !== null &&
          <CountdownOverlay value={countdownValue} />}
        {paused && (
          <PauseOverlay onResume={() => setPaused(false)} onExit={requestExit} portrait={portrait} />
        )}
        {exitConfirmation && (
          <div className="runner-overlay runner-overlay--confirm" role="alertdialog" aria-modal="true"
            aria-labelledby="exit-confirm-title">
            <div className="runner-pause-card">
              <strong id="exit-confirm-title">이번 달리기를 종료할까요?</strong>
              <p>현재 기록은 결과에 저장되지 않습니다.</p>
              <div className="runner-result-actions">
                <button type="button" onClick={onExit}>종료하고 메뉴로</button>
                <button type="button" onClick={() => setExitConfirmation(false)}>일시정지로 돌아가기</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="run-screen__help">
        <span><kbd>Space</kbd> / <kbd>↑</kbd> 점프</span>
        <span><kbd>↓</kbd> 누르고 있기: 슬라이딩</span>
        <span><kbd>P</kbd> 일시정지</span>
      </footer>
    </main>
  );
}
