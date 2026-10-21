import type { StageRankingRow } from '../../services/GameGateway';
import type { StageDefinition } from '../../game/content/stageTypes';

type RankingScreenProps = {
  rows: StageRankingRow[];
  stageId: string;
  stages: StageDefinition[];
  onStageChange: (stageId: string) => void;
  onBack: () => void;
};

export function RankingScreen({ rows, stageId, stages, onStageChange, onBack }: RankingScreenProps): React.JSX.Element {
  return (
    <section className="ranking-panel" aria-labelledby="ranking-title">
      <header className="panel-heading"><div><p className="eyebrow">BEST RECORDS</p><h1 id="ranking-title">스테이지 랭킹</h1></div><button onClick={onBack}>메뉴</button></header>
      <label className="stage-select">스테이지
        <select value={stageId} onChange={(event) => onStageChange(event.target.value)}>
          {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
        </select>
      </label>
      <ol className="ranking-list">
        {rows.slice(0, 10).map((row, index) => <li key={`${row.displayName}-${row.stageId}`}><span>{index + 1}</span><strong>{row.displayName}</strong><b>{row.score.toLocaleString()}점</b><time>{(row.clearTimeMs / 1_000).toFixed(1)}초</time></li>)}
        {rows.length === 0 && <li className="empty-ranking">아직 등록된 기록이 없습니다.</li>}
      </ol>
    </section>
  );
}
