import { CharacterPreview } from '../components/CharacterPreview';
import { getCharacter } from '../../game/characters/characterCatalog';
import type { CharacterId } from '../../game/characters/characterTypes';
import type { RunnerFinishOutcome, RunnerResult } from '../../game/runner/runnerTypes';
import type { RankedRunRecord } from '../../services/RunGateway';

export type RunResultProps = {
  result: RunnerResult;
  outcome: RunnerFinishOutcome;
  bestDistanceMeters: number;
  submittedRank?: number | null;
  recordPending?: boolean;
  recordError?: string | null;
  overallBest?: RankedRunRecord | null;
  onRetry(): void;
  onChooseCharacter(): void;
  onRankings(): void;
};

export function RunResult({ result, outcome, bestDistanceMeters, submittedRank = null,
  recordPending = false, recordError = null, overallBest = null,
  onRetry, onChooseCharacter, onRankings }: RunResultProps): React.JSX.Element {
  const character = getCharacter(result.characterId as CharacterId);
  const overallBestCharacter = overallBest ? getCharacter(overallBest.characterId) : null;
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
            {submittedRank !== null && <div><dt>통합 랭킹</dt><dd>{submittedRank <= 10 ? `${submittedRank}위` : '10위 밖'}</dd></div>}
            {overallBest && overallBestCharacter && (
              <div><dt>전체 최고</dt><dd>{overallBest.distanceMeters.toLocaleString()}m · {overallBestCharacter.displayName}</dd></div>
            )}
          </dl>
          {recordPending && <p className="record-feedback" role="status">로컬 기록 저장 중…</p>}
          {recordError && <p className="record-feedback is-error" role="alert">{recordError}</p>}
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
