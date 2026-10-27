import { useState } from 'react';
import { CharacterPreview } from '../components/CharacterPreview';
import { CharacterAbilityIcon } from '../components/CharacterAbilityIcon';
import { CHARACTERS, getCharacter, resolveCharacterId } from '../../game/characters/characterCatalog';
import { getCharacterPassive } from '../../game/characters/characterAbilities';
import type { CharacterId } from '../../game/characters/characterTypes';

const SELECTOR_CHARACTERS = [...CHARACTERS].sort(
  (left, right) => Number(right.available) - Number(left.available),
);

export type CharacterSelectProps = {
  selectedCharacterId: CharacterId;
  onConfirm(characterId: CharacterId): void;
  onBack(): void;
};

export function CharacterSelect({ selectedCharacterId, onConfirm, onBack }: CharacterSelectProps): React.JSX.Element {
  const [candidateCharacterId, setCandidateCharacterId] = useState(() => resolveCharacterId(selectedCharacterId));
  const selectedCharacter = getCharacter(candidateCharacterId);
  const selectedPassive = getCharacterPassive(selectedCharacter.id);

  return (
    <main className="selector-shell">
      <section className="selector-panel" aria-labelledby="character-select-title">
        <header className="selector-header">
          <div>
            <p className="eyebrow">CHOOSE YOUR HERO</p>
            <h1 id="character-select-title">캐릭터 선택</h1>
            <p className="selector-intro">함께 달릴 캐릭터를 선택하세요.</p>
          </div>
          <button className="selector-back" type="button" onClick={onBack}>뒤로</button>
        </header>

        <div className="selector-layout">
          <section className="selector-showcase"
            style={{ '--character-accent': selectedCharacter.accentColor } as React.CSSProperties}
            aria-label={`${selectedCharacter.displayName} 소개`}>
            <img className="selector-showcase__portrait" src={selectedCharacter.portraitUrl} alt="" data-testid="selector-showcase-portrait" />
            <span className="selector-showcase__shade" />
            <div className="selector-showcase__art">
              <CharacterPreview key={selectedCharacter.id} character={selectedCharacter} selected animation="victory" loop={false} variant="showcase" />
            </div>
            <div className="selector-showcase__details">
              <span className="selector-showcase__eyebrow">선택한 캐릭터</span>
              <h2>{selectedCharacter.displayName}</h2>
              <div className="selector-showcase__ability" data-testid="selector-passive">
                {selectedPassive.icon && <CharacterAbilityIcon icon={selectedPassive.icon}
                  accentColor={selectedCharacter.accentColor} size={22} />}
                <span><strong>{selectedPassive.name}</strong><small>{selectedPassive.effectLabel}</small></span>
              </div>
            </div>
            <span className="sr-only" aria-live="polite">{selectedCharacter.displayName} 선택됨</span>
          </section>

          <div className="character-roster" role="group" aria-label="플레이할 캐릭터">
            {SELECTOR_CHARACTERS.map((character) => {
              const selected = character.id === candidateCharacterId;
              return (
                <button
                  className={`character-card${selected ? ' is-selected' : ''}${character.available ? '' : ' is-coming-soon'}`}
                  style={{ '--character-accent': character.accentColor } as React.CSSProperties}
                  type="button" key={character.id} aria-label={character.displayName} aria-pressed={selected}
                  disabled={!character.available} onClick={() => setCandidateCharacterId(character.id)}>
                  <span className="character-card__art">
                    <CharacterPreview character={character} selected={false} variant="roster" />
                    {!character.available && <span className="character-card__coming-soon">준비 중</span>}
                    {selected && <span className="character-card__selected-marker">선택됨</span>}
                  </span>
                  <span className="character-card__name">{character.displayName}</span>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="selector-footer">
          <p>선택을 확정하면 3초 카운트다운 후 달리기를 시작합니다.</p>
          <button className="selector-confirm" type="button" onClick={() => onConfirm(candidateCharacterId)}>
            선택한 캐릭터로 달리기 시작
          </button>
        </footer>
      </section>
    </main>
  );
}
