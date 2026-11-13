import { useState } from 'react';
import { moveGridFocus } from '../keyboardNavigation';
import { SelectorRunnerPreview } from '../components/SelectorRunnerPreview';
import { CharacterAbilityIcon } from '../components/CharacterAbilityIcon';
import { CHARACTERS, getCharacter, resolveCharacterId } from '../../game/characters/characterCatalog';
import { getCharacterPassive } from '../../game/characters/characterAbilities';
import type { CharacterId } from '../../game/characters/characterTypes';
import type { PlayerProfile } from '../../services/PlayerProfile';
import { getCosmetic } from '../../services/CosmeticCatalog';

const SELECTOR_ORDER: readonly CharacterId[] = [
  'player-default', 'hanayo-hiyori', 'tokino-mary', 'goth-student', 'cogane-rang',
];
const SELECTOR_CHARACTERS = [...CHARACTERS].sort((left, right) => {
  const leftOrder = SELECTOR_ORDER.indexOf(left.id);
  const rightOrder = SELECTOR_ORDER.indexOf(right.id);
  return (leftOrder < 0 ? Number.MAX_SAFE_INTEGER : leftOrder)
    - (rightOrder < 0 ? Number.MAX_SAFE_INTEGER : rightOrder);
});

export type CharacterSelectProps = {
  selectedCharacterId: CharacterId;
  profile?: PlayerProfile;
  onConfirm(characterId: CharacterId): void;
  onBack(): void;
  onShop?(): void;
};

export function CharacterSelect({ selectedCharacterId, profile, onConfirm, onBack, onShop }: CharacterSelectProps): React.JSX.Element {
  const unlockedCharacterIds = profile?.unlockedCharacterIds ?? SELECTOR_CHARACTERS
    .filter((character) => character.available).map((character) => character.id);
  const initialCharacterId = unlockedCharacterIds.includes(selectedCharacterId) ? selectedCharacterId
    : unlockedCharacterIds[0] ?? 'player-default';
  const [candidateCharacterId, setCandidateCharacterId] = useState(() => resolveCharacterId(initialCharacterId));
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

        <div className="character-roster character-roster--runner" data-roster-layout="adaptive"
          data-character-count={SELECTOR_CHARACTERS.length}
          role="group" aria-label="플레이할 캐릭터"
          onKeyDown={(event) => moveGridFocus(event,
            window.matchMedia('(max-width: 760px)').matches ? 2 : 5)}>
          {SELECTOR_CHARACTERS.map((character) => {
            const selected = character.id === candidateCharacterId;
            const passive = getCharacterPassive(character.id);
            const unlocked = character.available && unlockedCharacterIds.includes(character.id);
            const unlockStage = profile && !unlocked
              ? ({ 'goth-student': '수정 광산', 'cogane-rang': '구름 위 하늘길' } as Partial<Record<CharacterId, string>>)[character.id]
              : null;
            return (
              <button
                className={`character-card character-card--runner${selected ? ' is-selected' : ''}${!unlocked ? ' is-locked' : ''}${character.available ? '' : ' is-coming-soon'}`}
                style={{ '--character-accent': character.accentColor } as React.CSSProperties}
                type="button" key={character.id} aria-label={unlocked ? character.displayName : character.displayName + ' 잠김'}
                aria-pressed={selected} disabled={!unlocked} onClick={() => setCandidateCharacterId(character.id)}>
                <span className="character-card__art character-card__art--runner">
                  <img className="character-card__illustration" src={character.portraitUrl}
                    alt="" draggable={false} />
                  {!unlocked && (
                    <span className="character-card__lock-overlay" aria-hidden="true">
                      <span className="character-card__lock-title">
                        {character.available ? <><span className="character-card__lock-icon">🔒</span> 잠김</> : '준비 중'}
                      </span>
                      {character.available && unlockStage && (
                        <span className="character-card__unlock-hint">{unlockStage} 완주 후 해금</span>
                      )}
                    </span>
                  )}
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
            {SELECTOR_CHARACTERS.filter((character) => character.available && unlockedCharacterIds.includes(character.id)).map((character) => (
              <span
                className={`selector-runway__runner${character.id === candidateCharacterId ? ' is-selected' : ''}`}
                style={{ '--character-accent': character.accentColor } as React.CSSProperties}
                key={character.id} data-testid={`selector-runner-${character.id}`} aria-hidden="true">
                <SelectorRunnerPreview characterId={character.id} frames={character.qualityAnimations.run}
                  trailColor={(profile?.equippedCosmeticIdsByCharacter[character.id] ?? [])
                    .map((cosmeticId) => getCosmetic(cosmeticId)).find((cosmetic) => cosmetic?.kind === 'trail')?.color} />
              </span>
            ))}
          </div>
        </section>

        <footer className="selector-footer selector-footer--runner">
          <div className="selector-footer__navigation">
            <button className="selector-back selector-back--runner" type="button" onClick={onBack}>← 타이틀로</button>
            {onShop && <button className="selector-back selector-back--runner selector-shop-button" type="button" onClick={onShop}>코인 상점</button>}
          </div>
          <button className="selector-confirm selector-confirm--runner" type="button"
            onClick={() => onConfirm(candidateCharacterId)}>
            {selectedCharacter.displayName} · 달리기 시작 ▶
          </button>
        </footer>
        <span className="sr-only" aria-live="polite">{selectedCharacter.displayName} 선택됨</span>
      </section>
    </main>
  );
}
