import { useState } from 'react';
import { CharacterPreview } from '../components/CharacterPreview';
import { CharacterAbilityIcon } from '../components/CharacterAbilityIcon';
import { CHARACTERS, getCharacter, resolveCharacterId } from '../../game/characters/characterCatalog';
import { getCharacterPassive } from '../../game/characters/characterAbilities';
import type { CharacterId } from '../../game/characters/characterTypes';

const SELECTOR_CHARACTER_IDS: readonly CharacterId[] = [
  'player-default', 'hanayo-hiyori', 'tokino-mary', 'goth-student', 'cogane-rang',
];
const SELECTOR_CHARACTERS = SELECTOR_CHARACTER_IDS.map((id) => CHARACTERS.find((character) => character.id === id)!)
  .filter(Boolean);
const SHORT_NAMES: Readonly<Record<CharacterId, string>> = {
  'player-default': '린',
  'hanayo-hiyori': '히요리',
  'tokino-mary': '메리',
  'goth-student': '토아',
  'cogane-rang': '랑',
};

export type CharacterSelectProps = {
  selectedCharacterId: CharacterId;
  onConfirm(characterId: CharacterId): void;
  onBack(): void;
};

export function CharacterSelect({ selectedCharacterId, onConfirm, onBack }: CharacterSelectProps): React.JSX.Element {
  const [candidateCharacterId, setCandidateCharacterId] = useState(() => resolveCharacterId(selectedCharacterId));
  const selectedCharacter = getCharacter(candidateCharacterId);

  return (
    <main className="selector-shell selector-shell--runner">
      <section className="selector-panel selector-panel--runner" aria-labelledby="character-select-title">
        <header className="selector-header selector-header--runner">
          <div>
            <p className="eyebrow">YOUR RUNNER</p>
            <h1 id="character-select-title">누구와 달려볼까요?</h1>
          </div>
          <p className="selector-intro">캐릭터를 고른 뒤 아래의 달리기 버튼을 누르세요.</p>
        </header>

        <div className="character-roster character-roster--runner" role="group" aria-label="플레이할 캐릭터">
          {SELECTOR_CHARACTERS.map((character) => {
            const selected = character.id === candidateCharacterId;
            const passive = getCharacterPassive(character.id);
            return (
              <button
                className={`character-card character-card--runner${selected ? ' is-selected' : ''}${character.available ? '' : ' is-coming-soon'}`}
                style={{ '--character-accent': character.accentColor } as React.CSSProperties}
                type="button" key={character.id} aria-label={character.displayName} aria-pressed={selected}
                disabled={!character.available} onClick={() => setCandidateCharacterId(character.id)}>
                <span className="character-card__art character-card__art--runner">
                  <CharacterPreview character={character} selected={false} animation="idle" variant="roster" />
                  {!character.available && <span className="character-card__coming-soon">준비 중</span>}
                  {selected && <span className="character-card__selected-marker">선택됨</span>}
                </span>
                <span className="character-card__details">
                  <span className="character-card__name">{character.displayName}</span>
                  <span className="character-card__passive">
                    {passive.icon && <CharacterAbilityIcon icon={passive.icon} accentColor={character.accentColor} size={32} />}
                    <span className="character-card__passive-copy">
                      <strong>{passive.name}</strong>
                      <small>{passive.effectLabel}</small>
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <section className="selector-runway" aria-label="캐릭터 달리기 미리보기">
          <div className="selector-runway__runners">
            {SELECTOR_CHARACTERS.map((character) => (
              <span
                className={`selector-runway__runner${character.id === candidateCharacterId ? ' is-selected' : ''}`}
                style={{ '--character-accent': character.accentColor } as React.CSSProperties}
                key={character.id} data-testid={`selector-runner-${character.id}`} aria-hidden="true">
                <CharacterPreview character={character} selected animation="run" variant="runway" />
              </span>
            ))}
          </div>
        </section>

        <footer className="selector-footer selector-footer--runner">
          <button className="selector-back selector-back--runner" type="button" onClick={onBack}>← 타이틀로</button>
          <button className="selector-confirm selector-confirm--runner" type="button"
            onClick={() => onConfirm(candidateCharacterId)}>
            {SHORT_NAMES[candidateCharacterId]} · 달리기 시작 ▶
          </button>
        </footer>
        <span className="sr-only" aria-live="polite">{selectedCharacter.displayName} 선택됨</span>
      </section>
    </main>
  );
}
