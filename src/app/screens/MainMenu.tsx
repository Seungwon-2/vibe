export type MainMenuProps = {
  onStart(): void;
  onRankings(): void;
};

export function MainMenu({ onStart, onRankings }: MainMenuProps): React.JSX.Element {
  return (
    <main className="landing-shell">
      <section className="title-card main-menu-card" aria-labelledby="game-title">
        <p className="eyebrow">RUN • JUMP • SLIDE</p>
        <h1 id="game-title">바람과 빛의 러너</h1>
        <p className="intro-copy">
          점프와 슬라이딩으로 장애물을 피하고, 시간 보너스를 모아 더 멀리 달려보세요.
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
