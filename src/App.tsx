import { useRef, useState } from 'react';
import { CharacterSelect } from './app/screens/CharacterSelect';
import { MainMenu } from './app/screens/MainMenu';
import { RunResult } from './app/screens/RunResult';
import { RunScreen } from './app/screens/RunScreen';
import { CHARACTERS } from './game/characters/characterCatalog';
import type { CharacterId } from './game/characters/characterTypes';
import type { RunnerFinishOutcome, RunnerResult } from './game/runner/runnerTypes';
import { browserPersonalBestStore } from './services/PersonalBestStore';

type AppScreen = 'menu' | 'character-select' | 'run' | 'result' | 'rankings';
type FinishedRun = { result: RunnerResult; outcome: RunnerFinishOutcome };

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('player-default');
  const [finishedRun, setFinishedRun] = useState<FinishedRun | null>(null);
  const [runId, setRunId] = useState(0);
  const latestRunId = useRef(0);

  function startRun(characterId = selectedCharacterId): void {
    latestRunId.current += 1;
    setSelectedCharacterId(characterId);
    setFinishedRun(null);
    setRunId(latestRunId.current);
    setScreen('run');
  }

  if (screen === 'character-select') {
    return (
      <CharacterSelect selectedCharacterId={selectedCharacterId}
        onConfirm={(characterId) => startRun(characterId)}
        onBack={() => setScreen('menu')} />
    );
  }

  if (screen === 'run') {
    const currentRunId = runId;
    return (
      <RunScreen key={`${currentRunId}:${selectedCharacterId}`} characterId={selectedCharacterId}
        onExit={() => {
          latestRunId.current += 1;
          setScreen('menu');
        }}
        onFinish={(result, outcome) => {
          if (latestRunId.current !== currentRunId) return;
          setFinishedRun({ result, outcome });
          setScreen('result');
        }} />
    );
  }

  if (screen === 'result' && finishedRun) {
    const bestDistance = browserPersonalBestStore.getBest(finishedRun.result.characterId)?.distanceMeters ??
      Math.round(finishedRun.result.distanceMeters);
    return (
      <RunResult result={finishedRun.result} outcome={finishedRun.outcome} bestDistanceMeters={bestDistance}
        onRetry={() => startRun(finishedRun.result.characterId)}
        onChooseCharacter={() => setScreen('character-select')}
        onRankings={() => setScreen('rankings')} />
    );
  }

  if (screen === 'rankings') {
    const records = CHARACTERS.filter((character) => character.available)
      .map((character) => ({ character, best: browserPersonalBestStore.getBest(character.id) }))
      .filter((entry): entry is { character: (typeof CHARACTERS)[number]; best: NonNullable<typeof entry.best> } => entry.best !== null)
      .sort((left, right) => right.best.distanceMeters - left.best.distanceMeters || right.best.coins - left.best.coins);
    return (
      <main className="landing-shell">
        <section className="title-card rankings-card" aria-labelledby="rankings-title">
          <p className="eyebrow">LOCAL RECORDS</p>
          <h1 id="rankings-title">로컬 최고 기록</h1>
          <p className="intro-copy">이 브라우저에 저장된 캐릭터별 최고 거리입니다.</p>
          {records.length > 0 ? (
            <ol className="rankings-list">
              {records.map(({ character, best }) => (
                <li key={character.id} style={{ '--character-accent': character.accentColor } as React.CSSProperties}>
                  <span>{character.displayName}</span>
                  <strong>{best.distanceMeters.toLocaleString()}m</strong>
                  <small>{best.coins.toLocaleString()} 코인</small>
                </li>
              ))}
            </ol>
          ) : <p className="rankings-empty">아직 기록이 없습니다. 첫 달리기를 시작해보세요!</p>}
          <div className="result-actions">
            <button type="button" onClick={() => setScreen('menu')}>메인 메뉴</button>
            <button className="selector-confirm" type="button" onClick={() => setScreen('character-select')}>달리기 시작</button>
          </div>
        </section>
      </main>
    );
  }

  return <MainMenu onStart={() => setScreen('character-select')} onRankings={() => setScreen('rankings')} />;
}

export default App;
