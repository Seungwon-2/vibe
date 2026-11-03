import { CharacterPreview } from '../components/CharacterPreview';
import { getCharacter } from '../../game/characters/characterCatalog';
import type { CharacterId } from '../../game/characters/characterTypes';
import type { RunnerFinishOutcome, RunnerResult } from '../../game/runner/runnerTypes';
import type { RankedRunRecord } from '../../services/RunGateway';
import type { SettlementResult } from '../../services/PlayerProgression';
import { ACHIEVEMENTS } from '../../services/AchievementCatalog';

export type RunResultProps = {
  result: RunnerResult;
  outcome: RunnerFinishOutcome;
  bestDistanceMeters: number;
  submittedRank?: number | null;
  recordPending?: boolean;
  recordError?: string | null;
  overallBest?: RankedRunRecord | null;
  settlement?: SettlementResult;
  newlyUnlockedAchievementIds?: readonly string[];
  achievementBonusCoins?: number;
  onRetry(): void;
  onChooseCharacter(): void;
  onRankings(): void;
};

export function RunResult({ result, outcome, bestDistanceMeters, submittedRank = null,
  recordPending = false, recordError = null, overallBest = null, settlement,
  newlyUnlockedAchievementIds = [], achievementBonusCoins = 0,
  onRetry, onChooseCharacter, onRankings }: RunResultProps): React.JSX.Element {
  const character = getCharacter(result.characterId as CharacterId);
  const overallBestCharacter = overallBest ? getCharacter(overallBest.characterId) : null;
  const isNewBest = outcome === 'personal-best';
  return (
    <main className="result-shell">
      <section className="result-panel" aria-labelledby="result-title">
        <div className="result-character" style={{ '--character-accent': character.accentColor } as React.CSSProperties}>
          <div className="result-character__stage">
            <img className="result-character__portrait" src={character.portraitUrl} alt="" data-testid="result-character-portrait" />
            <span className="result-character__veil" aria-hidden="true" />
            <span className="result-character__badge" aria-hidden="true" data-testid="result-character-badge">
              {isNewBest ? 'NEW PERSONAL BEST' : 'RUN COMPLETE'}
            </span>
            <CharacterPreview character={character} selected={false}
              playbackRate={0.6}
              animation={result.finishReason !== 'pit' && result.finishReason !== 'lives-exhausted' && isNewBest
                ? 'victory' : 'gameOver'} />
          </div>
          <span className="result-character__name">{character.displayName}</span>
        </div>
        <div className="result-details">
          <p className="eyebrow">RUN COMPLETE</p>
          <h1 id="result-title">{isNewBest ? '새로운 최고 기록!' : '달리기 종료'}</h1>
          {result.finishReason === 'pit' && (
            <p className="result-cause" role="status"><span aria-hidden="true">✦</span> 낭떠러지에 빠져 달리기가 종료되었습니다.</p>
          )}
          <p className="result-distance">{Math.round(result.distanceMeters).toLocaleString()}<span>m</span></p>
          {settlement && <div className="result-settlement" role="status">
            <span>지갑에 코인 {settlement.depositedCoins.toLocaleString()}개 적립</span>
            {achievementBonusCoins > 0 && <span>업적 보상 +{achievementBonusCoins} 코인</span>}
            {settlement.newlyUnlockedStageId && <span>새 스테이지 해금</span>}
            {settlement.newlyUnlockedCharacterId && <span>{getCharacter(settlement.newlyUnlockedCharacterId).displayName} 해금</span>}
            {settlement.newlyClaimedCosmeticIds.length > 0 && <span>도전 꾸미기 {settlement.newlyClaimedCosmeticIds.length}개 해금</span>}
            {newlyUnlockedAchievementIds.map((id) => <span key={id}>업적 달성 · {ACHIEVEMENTS.find((item) => item.id === id)?.name ?? id}</span>)}
          </div>}
          <dl className="result-stats">
            <div><dt>최고 거리</dt><dd>{bestDistanceMeters.toLocaleString()}m</dd></div>
            <div><dt>수집 코인</dt><dd>{result.coins.toLocaleString()}</dd></div>
            {(result.nearMissScore ?? 0) > 0 && <div><dt>아슬아슬 회피 점수</dt><dd>+{result.nearMissScore!.toLocaleString()}</dd></div>}
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
