type MainMenuProps = {
  canContinue: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onRankings: () => void;
};

export function MainMenu({ canContinue, onNewGame, onContinue, onRankings }: MainMenuProps): React.JSX.Element {
  return (
    <section className="menu-panel" aria-labelledby="menu-title">
      <p className="eyebrow">픽셀 플랫포머</p>
      <h1 id="menu-title">바람과 빛의 모험</h1>
      <p className="intro-copy">바람이 깃든 고대 유적과 빛나는 광산을 탐험하세요.</p>
      <div className="menu-actions">
        <button className="primary-button" onClick={onNewGame}>새 게임</button>
        <button onClick={onContinue} disabled={!canContinue}>이어서 하기</button>
        <button onClick={onRankings}>스테이지 랭킹</button>
      </div>
      <p className="control-hint">이동: 방향키 또는 A / D · 점프: Space 또는 W / ↑ · 달리기: Shift</p>
    </section>
  );
}
