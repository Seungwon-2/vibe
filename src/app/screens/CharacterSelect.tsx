import { useState } from 'react';
import { CharacterPreview } from '../components/CharacterPreview';
import { CHARACTERS, getCharacter, resolveCharacterId } from '../../game/characters/characterCatalog';
import { getCharacterPassive } from '../../game/characters/characterAbilities';
import type { CharacterDefinition, CharacterId } from '../../game/characters/characterTypes';

const SELECTOR_CHARACTERS = [...CHARACTERS].sort(
  (left, right) => Number(right.available) - Number(left.available),
);

function passiveSummary(character: CharacterDefinition): string {
  const passive = getCharacterPassive(character.id);
  switch (passive.id) {
    case 'time-pickup':
      return `시간 아이템을 얻으면 ${passive.bonusMs / 1_000}초 추가`;
    case 'slide-release-grace':
      return `슬라이딩 입력 해제 후 ${passive.graceMs}ms 유지`;
    case 'rang-second-jump':
      return `2단 점프 힘 ${Math.round((passive.multiplier - 1) * 100)}% 증가`;
    case 'hiyori-pickup-magnet':
      return `아이템 수집 범위 +${passive.radiusPx}px`;
    case 'mary-hit-protection':
      return `피격 후 보호 시간 +${passive.bonusMs}ms`;
  }
}

export type CharacterSelectProps = {
  selectedCharacterId: CharacterId;
  onConfirm(characterId: CharacterId): void;
  onBack(): void;
};

export function CharacterSelect({ selectedCharacterId, onConfirm, onBack }: CharacterSelectProps): React.JSX.Element {
  const [candidateCharacterId, setCandidateCharacterId] = useState(() => resolveCharacterId(selectedCharacterId));
  const selectedCharacter = getCharacter(candidateCharacterId);

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
            <img className="selector-showcase__portrait" src={selectedCharacter.portraitUrl} alt="" />
            <span className="selector-showcase__shade" />
            <div className="selector-showcase__art">
              <CharacterPreview character={selectedCharacter} selected variant="showcase" />
            </div>
            <div className="selector-showcase__details">
              <span className="selector-showcase__eyebrow">선택한 캐릭터</span>
              <h2>{selectedCharacter.displayName}</h2>
              <p>{passiveSummary(selectedCharacter)}</p>
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
                    <img className="character-card__portrait" src={character.portraitUrl} alt="" />
                    <span className="character-card__shade" />
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
