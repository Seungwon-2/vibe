import { useEffect, useState } from 'react';
import { getCharacter } from '../../game/characters/characterCatalog';
import type { CharacterId } from '../../game/characters/characterTypes';
import { RunnerGame } from '../../game/runner/RunnerGame';
import { RunnerInputBridge } from '../../game/runner/RunnerInput';
import { createRunnerSnapshot } from '../../game/runner/RunnerSimulation';
import type { RunnerResult, RunnerSnapshot } from '../../game/runner/runnerTypes';
import type { RunnerEvent } from '../../game/runner/runnerEvents';
import type { RunnerFinishOutcome } from '../../game/runner/runnerTypes';
import { browserPersonalBestStore } from '../../services/PersonalBestStore';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { PauseOverlay } from '../components/PauseOverlay';
import { RunnerHud } from '../components/RunnerHud';
import { TouchControls } from '../components/TouchControls';

type DisplayResult = Readonly<{
  result: RunnerResult;
  outcome: RunnerFinishOutcome;
  previousBestDistance: number | null;
}>;

type RecentBonus = { id: string; kind: 'pickup' | 'gate'; awardedMs: number } | null;

function getPortraitOrientation(): boolean {
  const media = window.matchMedia?.('(orientation: portrait)');
  return media?.matches ?? window.innerHeight > window.innerWidth;
}

export function RunnerPreview({ characterId, onBack }: {
  characterId: CharacterId;
  onBack(): void;
}): React.JSX.Element {
  const character = getCharacter(characterId);
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(getPortraitOrientation);
  const [portrait, setPortrait] = useState(getPortraitOrientation);
  const [countdownValue, setCountdownValue] = useState<number | null>(3);
  const [recentBonus, setRecentBonus] = useState<RecentBonus>(null);
  const [snapshot, setSnapshot] = useState<RunnerSnapshot>(() => createRunnerSnapshot(characterId));
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [previousBestDistance, setPreviousBestDistance] = useState<number | null>(
    () => browserPersonalBestStore.getBest(characterId)?.distanceMeters ?? null,
  );
  const [inputBridge, setInputBridge] = useState(() => new RunnerInputBridge());

  useEffect(() => {
    const media = window.matchMedia?.('(orientation: portrait)');
    const update = (): void => {
      const nextPortrait = getPortraitOrientation();
      setPortrait(nextPortrait);
      if (nextPortrait) setPaused(true);
    };
    media?.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      media?.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  function restart(): void {
    setPaused(portrait);
    setResult(null);
    setCountdownValue(3);
    setRecentBonus(null);
    setPreviousBestDistance(browserPersonalBestStore.getBest(characterId)?.distanceMeters ?? null);
    setSnapshot(createRunnerSnapshot(characterId));
    setInputBridge(new RunnerInputBridge());
    setAttempt((value) => value + 1);
  }

  function handleEvent(event: RunnerEvent): void {
    if (event.type === 'countdown') {
      setCountdownValue(event.value > 0 ? event.value : null);
    } else if (event.type === 'pickup' || event.type === 'gate') {
      setRecentBonus({
        id: event.type === 'pickup' ? event.pickupId : event.gateId,
        kind: event.type,
        awardedMs: event.awardedMs,
      });
    }
  }

  return (
    <main className="runner-shell">
      <section className="runner-panel" aria-label="러닝 게임 미리보기">
        <header className="runner-header">
          <div>
            <strong>{character.displayName}</strong>
            <p>Space / ↑ 점프 · ↓ 누르고 슬라이딩</p>
          </div>
          <button type="button" onClick={onBack}>나가기</button>
        </header>
        <div className="runner-stage">
          <RunnerGame key={attempt} characterId={characterId} inputBridge={inputBridge}
            paused={paused} onSnapshot={(next) => {
              setSnapshot(next);
              if (next.phase === 'paused') setPaused(true);
            }} onFinished={(finishedResult, outcome) => setResult({
              result: finishedResult, outcome, previousBestDistance,
            })} onEvent={handleEvent} />
          <RunnerHud snapshot={snapshot} character={character} recentBonus={recentBonus}
            onPause={() => setPaused(true)} />
          <TouchControls inputBridge={inputBridge}
            disabled={paused || !!result || snapshot.phase !== 'running'} />
          {snapshot.phase === 'countdown' && countdownValue !== null &&
            <CountdownOverlay value={countdownValue} />}
          {paused && !result && <PauseOverlay onResume={() => setPaused(false)}
            onExit={onBack} portrait={portrait} />}
          {result && <div className="runner-overlay runner-overlay--result" role="status">
            <div className="runner-result-panel">
              <strong>{result.outcome === 'personal-best' ? '새 최고 기록' : '런 종료'}</strong>
              <span>{result.result.distanceMeters.toLocaleString()}m</span>
              <small>이전 최고: {result.previousBestDistance === null
                ? '기록 없음' : `${result.previousBestDistance.toLocaleString()}m`}</small>
              <div className="runner-result-actions">
                <button type="button" onClick={restart}>다시 달리기</button>
                <button type="button" onClick={onBack}>캐릭터 선택</button>
              </div>
            </div>
          </div>}
        </div>
        <footer className="runner-controls">
          <span>{character.displayName} · 점프와 슬라이딩으로 장애물을 피하세요</span>
        </footer>
      </section>
    </main>
  );
}
