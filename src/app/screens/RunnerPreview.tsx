import { useState } from 'react';
import { getCharacter } from '../../game/characters/characterCatalog';
import type { CharacterId } from '../../game/characters/characterTypes';
import { RunnerGame } from '../../game/runner/RunnerGame';
import { RunnerInputBridge } from '../../game/runner/RunnerInput';
import { createRunnerSnapshot } from '../../game/runner/RunnerSimulation';
import type { RunnerResult, RunnerSnapshot } from '../../game/runner/runnerTypes';
import type { RunnerEvent } from '../../game/runner/runnerEvents';
import type { RunnerFinishOutcome } from '../../game/runner/runnerTypes';
import { browserPersonalBestStore } from '../../services/PersonalBestStore';

type DisplayResult = Readonly<{
  result: RunnerResult;
  outcome: RunnerFinishOutcome;
  previousBestDistance: number | null;
}>;

export function RunnerPreview({ characterId, onBack }: {
  characterId: CharacterId;
  onBack(): void;
}): React.JSX.Element {
  const character = getCharacter(characterId);
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [snapshot, setSnapshot] = useState<RunnerSnapshot>(() => createRunnerSnapshot(characterId));
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [previousBestDistance, setPreviousBestDistance] = useState<number | null>(
    () => browserPersonalBestStore.getBest(characterId)?.distanceMeters ?? null,
  );
  const [message, setMessage] = useState('점프: Space/↑ · 슬라이드: ↓');
  const [inputBridge, setInputBridge] = useState(() => new RunnerInputBridge());

  function restart(): void {
    setPaused(false);
    setResult(null);
    setPreviousBestDistance(browserPersonalBestStore.getBest(characterId)?.distanceMeters ?? null);
    setSnapshot(createRunnerSnapshot(characterId));
    setMessage('점프: Space/↑ · 슬라이드: ↓');
    setInputBridge(new RunnerInputBridge());
    setAttempt((value) => value + 1);
  }

  function handleEvent(event: RunnerEvent): void {
    if (event.type === 'pickup') {
      setMessage(event.kind === 'coin' ? '코인 +1' : `시간 +${event.awardedMs / 1000}초`);
    } else if (event.type === 'gate') {
      setMessage(`보너스 게이트 +${event.awardedMs / 1000}초`);
    }
  }

  return (
    <main className="runner-shell">
      <section className="runner-panel" aria-label="러닝 미리보기">
        <header className="runner-header">
          <strong>{character.displayName}</strong>
          <div className="runner-stats" aria-live="off">
            <span>{Math.floor(snapshot.distanceMeters).toLocaleString()}m</span>
            <span>{Math.ceil(snapshot.remainingMs / 1000)}초</span>
            <span>코인 {snapshot.coins}</span>
          </div>
          <div className="runner-menu">
            <button type="button" onClick={() => setPaused((value) => !value)} disabled={!!result}>
              {paused ? '계속' : '일시 정지'}
            </button>
            <button type="button" onClick={onBack}>나가기</button>
          </div>
        </header>
        <div className="runner-stage">
          <RunnerGame key={attempt} characterId={characterId} inputBridge={inputBridge}
            paused={paused} onSnapshot={(next) => {
              setSnapshot(next);
              if (next.phase === 'paused') setPaused(true);
            }} onFinished={(finishedResult, outcome) => setResult({
              result: finishedResult, outcome, previousBestDistance,
            })} onEvent={handleEvent} />
          {snapshot.phase === 'countdown' && <div className="runner-overlay">출발 준비!</div>}
          {paused && !result && <div className="runner-overlay">일시 정지</div>}
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
          <button type="button" onPointerDown={() => inputBridge.press('jump')}
            onPointerUp={() => inputBridge.release('jump')}
            onPointerCancel={() => inputBridge.release('jump')}
            onPointerLeave={() => inputBridge.release('jump')}>
            점프
          </button>
          <span role="status">{message}</span>
          <button type="button" onPointerDown={() => inputBridge.press('slide')}
            onPointerUp={() => inputBridge.release('slide')}
            onPointerCancel={() => inputBridge.release('slide')}
            onPointerLeave={() => inputBridge.release('slide')}>
            슬라이드
          </button>
        </footer>
      </section>
    </main>
  );
}
