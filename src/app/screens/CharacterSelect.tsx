import { useState } from 'react';
import { CharacterPreview } from '../components/CharacterPreview';
import { CHARACTERS, resolveCharacterId } from '../../game/characters/characterCatalog';
import type { CharacterId } from '../../game/characters/characterTypes';

export type CharacterSelectProps = {
  selectedCharacterId: CharacterId;
  onConfirm(characterId: CharacterId): void;
  onBack(): void;
};

export function CharacterSelect({
  selectedCharacterId,
  onConfirm,
  onBack,
}: CharacterSelectProps): React.JSX.Element {
  const [candidateCharacterId, setCandidateCharacterId] = useState(() =>
    resolveCharacterId(selectedCharacterId),
  );

  return (
    <main className="selector-shell">
      <section className="selector-panel" aria-labelledby="character-select-title">
        <header className="selector-header">
          <div>
            <p className="eyebrow">CHOOSE YOUR HERO</p>
            <h1 id="character-select-title">캐릭터 선택</h1>
            <p className="selector-intro">모험을 함께할 캐릭터를 선택하세요.</p>
          </div>
          <button className="selector-back" type="button" onClick={onBack}>
            뒤로
          </button>
        </header>

        <div className="character-rail" aria-label="플레이할 캐릭터">
          {CHARACTERS.map((character) => {
            const selected = character.id === candidateCharacterId;
            return (
              <button
                className={`character-card${selected ? ' is-selected' : ''}`}
                style={{ '--character-accent': character.accentColor } as React.CSSProperties}
                type="button"
                key={character.id}
                aria-label={character.displayName}
                aria-pressed={selected}
                onClick={() => setCandidateCharacterId(character.id)}
              >
                <span className="character-card__art">
                  <img className="character-card__portrait" src={character.portraitUrl} alt="" />
                  <span className="character-card__shade" />
                  <CharacterPreview character={character} selected={selected} />
                </span>
                <span className="character-card__name">{character.displayName}</span>
              </button>
            );
          })}
        </div>

        <footer className="selector-footer">
          <p>선택을 확정하면 러닝을 시작할 준비가 됩니다.</p>
          <button
            className="selector-confirm"
            type="button"
            onClick={() => onConfirm(candidateCharacterId)}
          >
            선택한 캐릭터로 게임 시작
          </button>
        </footer>
      </section>
    </main>
  );
}
