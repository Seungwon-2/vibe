import { CharacterPreview } from '../components/CharacterPreview';
import { getCharacter } from '../../game/characters/characterCatalog';
import { getStoryStage, getNextStoryStageId } from '../../game/runner/storyConfig';
import type { RunnerResult, StoryStageId } from '../../game/runner/runnerTypes';
import { ACHIEVEMENTS } from '../../services/AchievementCatalog';
import type { SettlementResult } from '../../services/PlayerProgression';

export type StoryResultProps = {
  result: RunnerResult;
  settlement: SettlementResult;
  newlyUnlockedAchievementIds: readonly string[];
  achievementBonusCoins: number;
  onRetry(): void;
  onNextStage(stageId: StoryStageId): void;
  onStageSelect(): void;
};

export function StoryResult({ result, settlement, newlyUnlockedAchievementIds, achievementBonusCoins,
  onRetry, onNextStage, onStageSelect }: StoryResultProps): React.JSX.Element {
  const stageId = result.storyStageId ?? 'dawn-city';
  const stage = getStoryStage(stageId);
  const character = getCharacter(result.characterId);
  const cleared = result.completedStage === true && result.finishReason === 'stage-complete';
  const nextStageId = getNextStoryStageId(stageId);
  const unlockedNames = newlyUnlockedAchievementIds
    .map((id) => ACHIEVEMENTS.find((achievement) => achievement.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <main className="result-shell story-result-shell">
      <section className="result-panel story-result-panel" aria-labelledby="story-result-title">
        <div className="result-character" style={{ '--character-accent': character.accentColor } as React.CSSProperties}>
          <div className="result-character__stage">
            <img className="result-character__portrait" src={character.portraitUrl} alt="" />
            <span className="result-character__veil" aria-hidden="true" />
            <span className="result-character__badge">{cleared ? 'COURSE CLEAR' : 'TRY AGAIN'}</span>
            <CharacterPreview character={character} selected={false} animation={cleared ? 'victory' : 'gameOver'} />
          </div>
          <span className="result-character__name">{character.displayName}</span>
        </div>
        <div className="result-details">
          <p className="eyebrow">STORY · STAGE {String(stage.order).padStart(2, '0')}</p>
          <h1 id="story-result-title">{cleared ? `${stage.name} 완주!` : `${stage.name} 재도전`}</h1>
          <p className="result-distance">{Math.round(result.distanceMeters).toLocaleString()}<span>m</span></p>
          <dl className="result-stats">
            <div><dt>수집 코인</dt><dd>{result.coins.toLocaleString()}개</dd></div>
            <div><dt>남은 생명</dt><dd>{result.livesRemaining ?? 0}</dd></div>
            <div><dt>업적 코인 보상</dt><dd>+{achievementBonusCoins}</dd></div>
          </dl>
          <div className="story-result-rewards" role="status">
            <strong>지갑에 코인 {settlement.depositedCoins.toLocaleString()}개 적립</strong>
            {achievementBonusCoins > 0 && <span>업적 보상 코인 +{achievementBonusCoins}</span>}
            {settlement.newlyUnlockedCharacterId && <span>{getCharacter(settlement.newlyUnlockedCharacterId).displayName} 해금!</span>}
            {settlement.newlyUnlockedStageId && <span>새 스테이지 해금!</span>}
            {settlement.newlyClaimedCosmeticIds.map((id) => <span key={id}>꾸미기 보상 해금 · {id}</span>)}
            {unlockedNames.map((name) => <span key={name}>업적 달성 · {name}</span>)}
          </div>
          <div className="story-challenges">
            <strong>스테이지 도전</strong>
            {settlement.challenges.map((challenge) => <span className={challenge.achieved ? 'is-achieved' : ''} key={challenge.id}>
              {challenge.achieved ? '✓' : '○'} {challenge.id === 'no-hit' ? '무피격 완주' : `코인 ${stage.coinTarget}개 모으기`}
              {challenge.newlyClaimed ? ' · 보상 획득' : ''}
            </span>)}
          </div>
          <div className="result-actions story-result-actions">
            {!cleared && <button className="selector-confirm" type="button" onClick={onRetry}>이 스테이지 재도전</button>}
            {cleared && nextStageId && <button className="selector-confirm" type="button" onClick={() => onNextStage(nextStageId)}>다음 스테이지</button>}
            <button type="button" onClick={onStageSelect}>스테이지 선택</button>
          </div>
        </div>
      </section>
    </main>
  );
}
