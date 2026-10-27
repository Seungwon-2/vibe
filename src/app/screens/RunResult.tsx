import { CharacterPreview } from '../components/CharacterPreview';
import { getCharacter } from '../../game/characters/characterCatalog';
import type { CharacterId } from '../../game/characters/characterTypes';
import type { RunnerFinishOutcome, RunnerResult } from '../../game/runner/runnerTypes';

export type RunResultProps = {
  result: RunnerResult;
  outcome: RunnerFinishOutcome;
  bestDistanceMeters: number;
  onRetry(): void;
  onChooseCharacter(): void;
  onRankings(): void;
};

export function RunResult({ result, outcome, bestDistanceMeters, onRetry, onChooseCharacter, onRankings }: RunResultProps): React.JSX.Element {
  const character = getCharacter(result.characterId as CharacterId);
  const isNewBest = outcome === 'personal-best';
  return (
    <main className="result-shell">
      <section className="result-panel" aria-labelledby="result-title">
        <div className="result-character" style={{ '--character-accent': character.accentColor } as React.CSSProperties}>
          <CharacterPreview character={character} selected={false} animation={isNewBest ? 'victory' : 'gameOver'} />
          <span>{character.displayName}</span>
        </div>
        <div className="result-details">
          <p className="eyebrow">RUN COMPLETE</p>
          <h1 id="result-title">{isNewBest ? '새로운 최고 기록!' : '달리기 종료'}</h1>
          <p className="result-distance">{Math.round(result.distanceMeters).toLocaleString()}<span>m</span></p>
          <dl className="result-stats">
            <div><dt>최고 거리</dt><dd>{bestDistanceMeters.toLocaleString()}m</dd></div>
            <div><dt>수집 코인</dt><dd>{result.coins.toLocaleString()}</dd></div>
          </dl>
          <div className="result-actions">
            <button className="selector-confirm" type="button" onClick={onRetry}>같은 캐릭터로 다시 달리기</button>
            <button type="button" onClick={onChooseCharacter}>캐릭터 선택</button>
            <button type="button" onClick={onRankings}>로컬 기록 보기</button>
          </div>
        </div>
      </section>
    </main>
  );
}
