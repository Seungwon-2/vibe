import { PhaserGame } from './game/PhaserGame';

function App(): React.JSX.Element {
  return (
    <main className="landing-shell">
      <section className="title-card" aria-labelledby="game-title">
        <p className="eyebrow">사내 플랫포머 프로젝트</p>
        <h1 id="game-title">바람과 빛의 모험</h1>
        <p className="intro-copy">
          바람이 깃든 고대 유적과 빛나는 광산을 탐험할 준비를 하고 있어요.
        </p>
        <PhaserGame />
      </section>
    </main>
  );
}

export default App;
