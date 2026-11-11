import { getCharacter } from '../../game/characters/characterCatalog';
import type { PublicLeaderboardRecord } from '../../services/RunGateway';

export type RankingScreenProps = {
  rows: readonly PublicLeaderboardRecord[];
  loading: boolean;
  error: string | null;
  source?: 'cloud' | 'local';
  onBack(): void;
};

function formatRunDate(isoTimestamp: string): string {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(isoTimestamp));
}

export function RankingScreen({ rows, loading, error, source = 'local', onBack }: RankingScreenProps): React.JSX.Element {
  const isCloudRanking = source === 'cloud';
  return (
    <main className="landing-shell">
      <section className="title-card rankings-card" aria-labelledby="rankings-title">
        <p className="eyebrow">{isCloudRanking ? 'STELLA RUNNER · COMMUNITY' : 'LOCAL RUNS · THIS BROWSER'}</p>
        <h1 id="rankings-title">{isCloudRanking ? '유저 랭킹' : '로컬 기록'}</h1>
        <p className="intro-copy">{isCloudRanking
          ? '사용자별 최고 거리 기록을 확인할 수 있습니다. 거리가 같으면 코인 수로 순위를 정합니다.'
          : '이 브라우저에 저장된 기록입니다. 거리 순으로 정렬하고, 거리가 같으면 코인 수로 순위를 정합니다.'}</p>
        {loading ? <p className="rankings-empty" role="status">기록을 불러오는 중입니다…</p>
          : error ? <p className="rankings-empty" role="alert">{error}</p>
            : rows.length > 0 ? (
              <ol className="rankings-list" aria-label={isCloudRanking ? '유저 랭킹' : '로컬 기록'}>
                {rows.map((row) => {
                  const character = getCharacter(row.characterId);
                  return (
                    <li key={`${row.rank}:${row.finishedAtIso}`} className={`ranking-record${row.rank <= 3 ? ` is-podium is-podium-${row.rank}` : ''}`}
                      style={{ '--character-accent': character.accentColor } as React.CSSProperties}>
                      <span className="ranking-record__rank">{row.rank}위</span>
                      <span className="ranking-record__character">{row.displayName} · {character.displayName}</span>
                      <strong className="ranking-record__distance">{row.distanceMeters.toLocaleString()}m</strong>
                      <small className="ranking-record__meta">{row.coins.toLocaleString()} 코인 <span aria-hidden="true">·</span> <time dateTime={row.finishedAtIso}>{formatRunDate(row.finishedAtIso)}</time></small>
                    </li>
                  );
                })}
              </ol>
            ) : <p className="rankings-empty">{isCloudRanking
              ? '아직 공개 랭킹 기록이 없습니다. 달리기를 마치면 최고 기록이 등록됩니다.'
              : '아직 저장된 기록이 없습니다. 첫 달리기를 시작해 보세요.'}</p>}
        <div className="result-actions rankings-actions">
          <button type="button" onClick={onBack}>메인 메뉴로</button>
        </div>
      </section>
    </main>
  );
}
