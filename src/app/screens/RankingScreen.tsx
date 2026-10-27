import { getCharacter } from '../../game/characters/characterCatalog';
import type { RankedRunRecord } from '../../services/RunGateway';

export type RankingScreenProps = {
  rows: readonly RankedRunRecord[];
  loading: boolean;
  error: string | null;
  onBack(): void;
};

function formatRunDate(isoTimestamp: string): string {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(isoTimestamp));
}

export function RankingScreen({ rows, loading, error, onBack }: RankingScreenProps): React.JSX.Element {
  return (
    <main className="landing-shell">
      <section className="title-card rankings-card" aria-labelledby="rankings-title">
        <p className="eyebrow">LOCAL RUNS · THIS BROWSER</p>
        <h1 id="rankings-title">로컬 랭킹</h1>
        <p className="intro-copy">거리 순으로 정렬하고, 거리가 같으면 코인과 완료 시각으로 순위를 정합니다.</p>
        {loading ? <p className="rankings-empty" role="status">기록을 불러오는 중입니다…</p>
          : error ? <p className="rankings-empty" role="alert">{error}</p>
            : rows.length > 0 ? (
              <ol className="rankings-list" aria-label="통합 달리기 랭킹">
                {rows.map((row) => {
                  const character = getCharacter(row.characterId);
                  return (
                    <li key={row.id} style={{ '--character-accent': character.accentColor } as React.CSSProperties}>
                      <span className="ranking-record__rank">{row.rank}위</span>
                      <span className="ranking-record__character">{character.displayName}</span>
                      <strong>{row.distanceMeters.toLocaleString()}m</strong>
                      <small>{row.coins.toLocaleString()} 코인 · <time dateTime={row.finishedAtIso}>{formatRunDate(row.finishedAtIso)}</time></small>
                    </li>
                  );
                })}
              </ol>
            ) : <p className="rankings-empty">아직 달리기 기록이 없습니다. 완주하면 첫 랭킹 기록이 저장됩니다.</p>}
        <div className="result-actions rankings-actions">
          <button type="button" onClick={onBack}>메인 메뉴로</button>
        </div>
      </section>
    </main>
  );
}
