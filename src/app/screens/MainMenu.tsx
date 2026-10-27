import { getCharacter } from '../../game/characters/characterCatalog';
import type { RankedRunRecord } from '../../services/RunGateway';

export type MainMenuProps = {
  onStart(): void;
  onRankings(): void;
  topRun: RankedRunRecord | null;
  topRunLoading: boolean;
  topRunError: string | null;
};

export function MainMenu({ onStart, onRankings, topRun, topRunLoading, topRunError }: MainMenuProps): React.JSX.Element {
  const topCharacter = topRun ? getCharacter(topRun.characterId) : null;
  return (
    <main className="landing-shell">
      <section className="title-card main-menu-card" aria-labelledby="game-title">
        <p className="eyebrow">RUN • JUMP • SLIDE</p>
        <h1 id="game-title">바람과 빛의 러너</h1>
        <p className="intro-copy">
          점프와 슬라이딩으로 장애물을 피하고, 시간 보너스를 모아 더 멀리 달려보세요.
        </p>
        <p className="main-menu-record" aria-live="polite">
          {topRunLoading ? '기록 불러오는 중…'
            : topRunError ? topRunError
              : topRun && topCharacter
                ? `로컬 최고 기록 ${topRun.distanceMeters.toLocaleString()}m · ${topCharacter.displayName}`
                : '아직 로컬 기록이 없습니다. 첫 달리기를 시작해보세요!'}
        </p>
        <div className="main-menu-actions">
          <button className="selector-confirm home-start" type="button" onClick={onStart}>
            달리기 시작
          </button>
          <button className="main-menu-rankings" type="button" onClick={onRankings}>
            로컬 기록 보기
          </button>
        </div>
        <p className="main-menu-help">Space / ↑ 점프 · ↓ 슬라이딩 · P 일시정지</p>
      </section>
    </main>
  );
}
