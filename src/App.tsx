import { useState } from 'react';
import { CharacterSelect } from './app/screens/CharacterSelect';
import { getCharacter } from './game/characters/characterCatalog';
import type { CharacterId } from './game/characters/characterTypes';

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<'home' | 'characters' | 'ready'>(() =>
    new URLSearchParams(window.location.search).get('screen') === 'characters' ? 'characters' : 'home',
  );
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('player-default');

  if (screen === 'characters') {
    return (
      <CharacterSelect
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
    const character = getCharacter(selectedCharacterId);
    return (
      <main className="landing-shell">
        <section className="title-card" aria-labelledby="game-title">
          <p className="eyebrow">RUNNER PREVIEW</p>
          <h1 id="game-title">{character.displayName}</h1>
          <p className="intro-copy">선택한 캐릭터로 러닝을 시작할 준비가 되었어요.</p>
          <button className="selector-confirm" type="button" onClick={() => setScreen('characters')}>
            캐릭터 다시 선택
          </button>
        </section>
      </main>
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
