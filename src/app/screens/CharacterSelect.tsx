import { useState, type CSSProperties } from 'react';
import { moveGridFocus } from '../keyboardNavigation';
import { CharacterAbilityIcon } from '../components/CharacterAbilityIcon';
import { CHARACTERS } from '../../game/characters/characterCatalog';
import { getCharacterPassive } from '../../game/characters/characterAbilities';
import type { CharacterId } from '../../game/characters/characterTypes';
import type { PlayerProfile } from '../../services/PlayerProfile';
import { getCharacterSelectArt } from './characterSelectArt';
import './CharacterSelect.css';

const SELECTOR_ORDER: readonly CharacterId[] = [
  'player-default', 'hanayo-hiyori', 'tokino-mary', 'goth-student', 'cogane-rang',
];
const SELECTOR_CHARACTERS = [...CHARACTERS].sort((left, right) => {
  const leftOrder = SELECTOR_ORDER.indexOf(left.id);
  const rightOrder = SELECTOR_ORDER.indexOf(right.id);
  return (leftOrder < 0 ? Number.MAX_SAFE_INTEGER : leftOrder)
    - (rightOrder < 0 ? Number.MAX_SAFE_INTEGER : rightOrder);
});
const EMPTY_SLOTS = Array.from({ length: Math.max(0, 15 - SELECTOR_CHARACTERS.length) }, (_, index) => index);
const UNLOCK_STAGES: Partial<Record<CharacterId, string>> = {
  'goth-student': '수정 광산',
  'cogane-rang': '구름 위 하늘길',
};

export type CharacterSelectProps = {
  selectedCharacterId: CharacterId;
  profile?: PlayerProfile;
  onConfirm(characterId: CharacterId): void;
  onBack(): void;
  onShop?(): void;
};

export function CharacterSelect({ selectedCharacterId, profile, onConfirm, onBack, onShop }: CharacterSelectProps): React.JSX.Element {
  const [candidateId, setCandidateId] = useState(selectedCharacterId);
  const selectable = SELECTOR_CHARACTERS.filter((character) => character.available &&
    (!profile || profile.unlockedCharacterIds.includes(character.id)));
  const selected = selectable.find(({ id }) => id === candidateId) ?? selectable[0];
  const passive = selected ? getCharacterPassive(selected.id) : null;

  return (
    <main className="selector-shell selector-shell--runner selector-shell--grid">
      <section className="selector-grid-panel" aria-labelledby="character-select-title">
        <h1 id="character-select-title">누구와 달려볼까요?</h1>
        <div className="selector-grid-layout">
          <div className="selector-grid-list">
            <div className="selector-grid-roster" role="group" aria-label="플레이할 캐릭터"
              onKeyDown={(event) => moveGridFocus(event, 5)}>
              {SELECTOR_CHARACTERS.map((character) => {
                const unlocked = selectable.includes(character);
                const picked = selected?.id === character.id;
                const unlockStage = UNLOCK_STAGES[character.id];
                const status = character.available ? '잠김' : '준비 중';
                const hint = character.available && unlockStage ? `${unlockStage} 완주 후 해금` : undefined;
                return (
                  <button className="selector-grid-card" data-grid-slot type="button" key={character.id}
                    style={{ '--character-accent': character.accentColor } as CSSProperties}
                    aria-label={unlocked ? character.displayName : `${character.displayName} ${status}`}
                    aria-describedby={!unlocked && hint ? `unlock-${character.id}` : undefined}
                    aria-pressed={picked} disabled={!unlocked} onClick={() => setCandidateId(character.id)}>
                    <span className="selector-grid-card-art">
                      <img src={getCharacterSelectArt(character).faceUrl} alt="" draggable={false} />
                      {!unlocked && <span className="selector-grid-lock" aria-hidden="true">{status}</span>}
                      {picked && <span className="selector-grid-picked" aria-hidden="true">선택됨</span>}
                    </span>
                    <span className="selector-grid-name">{character.displayName}</span>
                    {!unlocked && hint && <small id={`unlock-${character.id}`} className="selector-grid-hint">{hint}</small>}
                  </button>
                );
              })}
              {EMPTY_SLOTS.map((index) => (
                <span className="selector-grid-empty" data-grid-slot aria-hidden="true" key={`empty-${index}`} />
              ))}
            </div>
            <footer className="selector-grid-navigation">
              <button type="button" onClick={onBack}>← 타이틀로</button>
              {onShop && <button type="button" onClick={onShop}>코인 상점</button>}
            </footer>
          </div>

          <section className="selector-grid-detail" aria-labelledby="selector-detail-name">
            {selected && <div className="selector-grid-full-art">
              <img src={getCharacterSelectArt(selected).fullUrl} alt={`${selected.displayName} 전신`} draggable={false} />
            </div>}
            <h2 id="selector-detail-name">{selected?.displayName ?? '선택 가능한 캐릭터가 없습니다'}</h2>
            {selected && passive && <div className="selector-grid-passive">
              {passive.icon && <CharacterAbilityIcon icon={passive.icon} accentColor={selected.accentColor} size={40} />}
              <div>
                <strong>{passive.name}</strong>
                <p>{passive.effectLabel}</p>
              </div>
            </div>}
            <button className="selector-grid-start" type="button" disabled={!selected}
              onClick={() => { if (selected) onConfirm(selected.id); }}>
              달리기 시작 <span aria-hidden="true">▶</span>
            </button>
          </section>
        </div>
        <span className="sr-only" aria-live="polite">{selected ? `${selected.displayName} 선택됨` : ''}</span>
      </section>
    </main>
  );
}
