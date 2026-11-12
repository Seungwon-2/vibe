import { getCharacter } from '../../game/characters/characterCatalog';
import { getStoryStage } from '../../game/runner/storyConfig';
import type { PersonalRunHistoryRecord } from '../../services/RunGateway';
import './PersonalHistoryScreen.css';

export type PersonalHistoryScreenProps = {
  rows: readonly PersonalRunHistoryRecord[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore(): void;
  onRetry(): void;
  onBack(): void;
};

function formatRunDate(isoTimestamp: string): string {
  const timestamp = Date.parse(isoTimestamp);
  if (!Number.isFinite(timestamp)) return '날짜 정보 없음';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(timestamp);
}

function getModeLabel(record: PersonalRunHistoryRecord): string {
  if (record.mode === 'endless') return '끝없는 달리기';
  if (!record.storyStageId) return '스토리 스테이지';
  try {
    return getStoryStage(record.storyStageId).name;
  } catch {
    return '스토리 스테이지';
  }
}

function getFinishLabel(reason: PersonalRunHistoryRecord['finishReason']): string {
  switch (reason) {
    case 'timeout': return '시간 종료';
    case 'pit': return '낭떠러지 추락';
    case 'lives-exhausted': return '생명 소진';
    case 'stage-complete': return '코스 완주';
    default: return '달리기 종료';
  }
}

export function PersonalHistoryScreen({ rows, loading, error, hasMore, onLoadMore, onRetry, onBack }: PersonalHistoryScreenProps): React.JSX.Element {
  return (
    <main className="landing-shell">
      <section className="title-card rankings-card personal-history-card" aria-labelledby="history-title">
        <p className="eyebrow">MY RUNS · PRIVATE HISTORY</p>
        <h1 id="history-title">내 플레이 기록</h1>
        <p className="intro-copy">이 브라우저에 저장된 달리기 기록입니다. 다른 기기와는 공유되지 않습니다.</p>
        {loading && rows.length === 0 && <p className="rankings-empty" role="status">기록을 불러오는 중입니다…</p>}
        {error && <p className="rankings-empty" role="alert">{error}</p>}
        {error && rows.length === 0 && <button type="button" onClick={onRetry} disabled={loading}>다시 시도</button>}
        {!loading && !error && rows.length === 0 &&
          <p className="rankings-empty">아직 저장된 플레이 기록이 없습니다. 첫 달리기를 시작해 보세요.</p>}
        {rows.length > 0 && (
          <ol className="rankings-list personal-history-list" aria-label="내 달리기 기록">
            {rows.map((row) => {
              const character = getCharacter(row.characterId);
              const modeLabel = getModeLabel(row);
              return (
                <li key={row.id} className="personal-history-record"
                  style={{ '--character-accent': character.accentColor } as React.CSSProperties}>
                  <span className="personal-history-record__mode">{modeLabel}</span>
                  <span className="personal-history-record__character">{character.displayName}</span>
                  <strong className="ranking-record__distance">{Math.round(row.distanceMeters).toLocaleString()}m</strong>
                  <small className="ranking-record__meta">
                    <span>{row.coins.toLocaleString()} 코인</span>
                    <span>{row.hitsTaken}회 피격</span>
                    <span>{row.completedStage ? '스테이지 완주' : '미완주'}</span>
                    <span>{getFinishLabel(row.finishReason)}</span>
                    <time dateTime={row.finishedAtIso}>{formatRunDate(row.finishedAtIso)}</time>
                  </small>
                </li>
              );
            })}
          </ol>
        )}
        <div className="result-actions rankings-actions personal-history-actions">
          {hasMore && <button type="button" onClick={onLoadMore} disabled={loading}>
            {loading ? '불러오는 중…' : '기록 더 보기'}
          </button>}
          <button type="button" onClick={onBack}>메인 메뉴로</button>
        </div>
      </section>
    </main>
  );
}
