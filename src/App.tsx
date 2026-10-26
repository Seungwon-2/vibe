import { lazy, Suspense, useState } from 'react';
import { CharacterSelect } from './app/screens/CharacterSelect';
import type { CharacterId } from './game/characters/characterTypes';

const RunnerPreview = lazy(() => import('./app/screens/RunnerPreview').then((module) => ({ default: module.RunnerPreview })));

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<'home' | 'characters' | 'ready'>(() =>
    new URLSearchParams(window.location.search).get('screen') === 'characters' ? 'characters' : 'home',
  );
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('player-default');

  if (screen === 'characters') {
    return (
      <CharacterSelect
        key={selectedCharacterId}
        selectedCharacterId={selectedCharacterId}
        onConfirm={(characterId) => {
          setSelectedCharacterId(characterId);
          setScreen('ready');
        }}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'ready') {
    return (
      <Suspense fallback={<main className="landing-shell">러닝 화면을 여는 중…</main>}>
        <RunnerPreview characterId={selectedCharacterId} onBack={() => setScreen('characters')} />
      </Suspense>
    );
  }

  return (
    <main className="landing-shell">
      <section className="title-card" aria-labelledby="game-title">
        <p className="eyebrow">사내 플랫포머 프로젝트</p>
        <h1 id="game-title">바람과 빛의 모험</h1>
        <p className="intro-copy">
          바람이 깃든 고대 유적과 빛나는 광산을 탐험할 준비를 하고 있어요.
        </p>
        <div className="status-pill" role="status">
          모험 준비 중
        </div>
        <button className="selector-confirm home-start" type="button" onClick={() => setScreen('characters')}>
          캐릭터 선택하기
        </button>
      </section>
    </main>
  );
}

export default App;
