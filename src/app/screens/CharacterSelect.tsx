import { useState } from 'react';
import { SelectorRunnerPreview } from '../components/SelectorRunnerPreview';
import { CharacterAbilityIcon } from '../components/CharacterAbilityIcon';
import { CHARACTERS, getCharacter, resolveCharacterId } from '../../game/characters/characterCatalog';
import { getCharacterPassive } from '../../game/characters/characterAbilities';
import type { CharacterId } from '../../game/characters/characterTypes';
import type { PlayerProfile } from '../../services/PlayerProfile';
import { getCosmetic } from '../../services/CosmeticCatalog';

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
const SELECTOR_ART: Readonly<Record<CharacterId, { portrait: string; runFrames: readonly string[] }>> = {
  'player-default': {
    portrait: '/assets/character/selector-art/aokumo-rin.webp',
    runFrames: Array.from({ length: 12 }, (_, i) => `/assets/character/selector-art/runs/player-default/run-${String(i + 1).padStart(2, '0')}.png`),
  },
  'hanayo-hiyori': {
    portrait: '/assets/character/selector-art/hanayo-hiyori.webp',
    runFrames: Array.from({ length: 12 }, (_, i) => `/assets/character/selector-art/runs/hanayo-hiyori/run-${String(i + 1).padStart(2, '0')}.webp`),
  },
  'tokino-mary': {
    portrait: '/assets/character/selector-art/tokino-mary.webp',
    runFrames: Array.from({ length: 12 }, (_, i) => `/assets/character/selector-art/runs/tokino-mary/run-${String(i + 1).padStart(2, '0')}.webp`),
  },
  'goth-student': {
    portrait: '/assets/character/selector-art/shizuki-toa.webp',
    runFrames: Array.from({ length: 12 }, (_, i) => `/assets/character/selector-art/runs/goth-student/run-${String(i + 1).padStart(2, '0')}.webp`),
  },
  'cogane-rang': {
    portrait: '/assets/character/selector-art/cogane-rang.webp',
    runFrames: Array.from({ length: 12 }, (_, i) => `/assets/character/selector-art/runs/cogane-rang/run-${String(i + 1).padStart(2, '0')}.webp`),
  },
};

export type CharacterSelectProps = {
  selectedCharacterId: CharacterId;
  profile?: PlayerProfile;
  onConfirm(characterId: CharacterId): void;
  onBack(): void;
  onShop?(): void;
};

export function CharacterSelect({ selectedCharacterId, profile, onConfirm, onBack, onShop }: CharacterSelectProps): React.JSX.Element {
  const unlockedCharacterIds = profile?.unlockedCharacterIds ?? SELECTOR_CHARACTER_IDS;
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

        <div className="character-roster character-roster--runner" data-roster-layout="one-row"
          role="group" aria-label="플레이할 캐릭터">
          {SELECTOR_CHARACTERS.map((character) => {
            const selected = character.id === candidateCharacterId;
            const passive = getCharacterPassive(character.id);
            const unlocked = character.available && unlockedCharacterIds.includes(character.id);
            const unlockStage = profile && !unlocked
              ? ({ 'hanayo-hiyori': '새벽 도심 완주', 'tokino-mary': '달빛 숲길 완주',
                'goth-student': '수정 광산 완주', 'cogane-rang': '구름 위 하늘길 완주' } as Partial<Record<CharacterId, string>>)[character.id]
              : null;
            return (
              <button
                className={`character-card character-card--runner${selected ? ' is-selected' : ''}${character.available ? '' : ' is-coming-soon'}`}
                style={{ '--character-accent': character.accentColor } as React.CSSProperties}
                type="button" key={character.id} aria-label={unlocked ? character.displayName : character.displayName + ' 잠김'}
                aria-pressed={selected} disabled={!unlocked} onClick={() => setCandidateCharacterId(character.id)}>
                <span className="character-card__art character-card__art--runner">
                  <img className="character-card__illustration" src={SELECTOR_ART[character.id].portrait}
                    alt="" draggable={false} />
                  {!unlocked && <span className="character-card__coming-soon">{unlockStage ? unlockStage + ' 후 해금' : '준비 중'}</span>}
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
            {SELECTOR_CHARACTERS.filter((character) => unlockedCharacterIds.includes(character.id)).map((character) => (
              <span
                className={`selector-runway__runner${character.id === candidateCharacterId ? ' is-selected' : ''}`}
                style={{ '--character-accent': character.accentColor } as React.CSSProperties}
                key={character.id} data-testid={`selector-runner-${character.id}`} aria-hidden="true">
                <SelectorRunnerPreview characterId={character.id} frames={SELECTOR_ART[character.id].runFrames}
                  trailColor={(profile?.equippedCosmeticIdsByCharacter[character.id] ?? [])
                    .map((cosmeticId) => getCosmetic(cosmeticId)).find((cosmetic) => cosmetic?.kind === 'trail')?.color} />
              </span>
            ))}
          </div>
        </section>

        <footer className="selector-footer selector-footer--runner">
          <button className="selector-back selector-back--runner" type="button" onClick={onBack}>← 타이틀로</button>
          {onShop && <button className="selector-back selector-back--runner" type="button" onClick={onShop}>코인 상점</button>}
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
