import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharacterSelect } from './CharacterSelect';
import { CHARACTERS } from '../../game/characters/characterCatalog';
import { getCharacterPassive } from '../../game/characters/characterAbilities';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const selectorCharacters = [...CHARACTERS].sort((left, right) => {
  const order = ['player-default', 'hanayo-hiyori', 'tokino-mary', 'goth-student', 'cogane-rang'];
  const leftIndex = order.indexOf(left.id);
  const rightIndex = order.indexOf(right.id);
  return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex)
    - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
});

describe('CharacterSelect', () => {
  it('renders every registered character from catalog art and passive data', () => {
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />);

    const rosterGroup = screen.getByRole('group', { name: '플레이할 캐릭터' });
    const cards = [...rosterGroup.querySelectorAll<HTMLButtonElement>('.character-card--runner')];
    expect(rosterGroup).toHaveAttribute('data-roster-layout', 'adaptive');
    expect(rosterGroup).toHaveAttribute('data-character-count', String(selectorCharacters.length));
    expect(cards).toHaveLength(CHARACTERS.length);
    expect(cards.map((card) => card.getAttribute('aria-label')))
      .toEqual(selectorCharacters.map((character) => character.displayName));
    expect(cards.every((card) => card.parentElement === rosterGroup)).toBe(true);

    for (const [index, character] of selectorCharacters.entries()) {
      const card = cards[index];
      expect(card).toHaveAttribute('aria-pressed', index === 0 ? 'true' : 'false');
      expect(card.querySelector('img.character-card__illustration')).toHaveAttribute('src', character.portraitUrl);
      expect(card.querySelector('.character-preview')).toBeNull();
      expect(card.querySelector('.character-card__name')).toHaveTextContent(character.displayName);

      const passive = getCharacterPassive(character.id);
      expect(card.querySelector('.character-card__passive-copy strong')).toHaveTextContent(passive.name);
      expect(card.querySelector('.character-card__passive-copy small')).toHaveTextContent(passive.effectLabel);
      if (passive.icon) {
        expect(card.querySelector('.character-ability-icon')).toHaveAttribute('data-icon', passive.icon);
      }
    }
  });

  it('animates each registered character run frames in the lower preview lane at 20 fps', () => {
    vi.useFakeTimers();
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />);

    const availableCharacters = selectorCharacters.filter((character) => character.available);
    expect(screen.getByRole('region', { name: '캐릭터 달리기 미리보기' })).toBeInTheDocument();
    for (const character of availableCharacters) {
      const runner = screen.getByTestId(`selector-runner-${character.id}`);
      const image = runner.querySelector('img');
      expect(image).toHaveClass('selector-runner-frame');
      expect(image).toHaveAttribute('src', character.qualityAnimations.run[0]?.url);
    }

    act(() => vi.advanceTimersByTime(50));
    for (const character of availableCharacters) {
      const image = screen.getByTestId(`selector-runner-${character.id}`).querySelector('img');
      expect(image).toHaveAttribute('src', character.qualityAnimations.run[1]?.url);
    }
  });

  it('selects a character and confirms its unchanged catalog ID', () => {
    const onConfirm = vi.fn();
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={onConfirm} onBack={vi.fn()} />);
    const nextCharacter = selectorCharacters.find((character) => character.available && character.id !== 'player-default');
    expect(nextCharacter).toBeDefined();
    const card = screen.getByRole('button', { name: nextCharacter!.displayName });
    fireEvent.click(card);

    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(card).toHaveClass('is-selected');
    expect(screen.getByTestId(`selector-runner-${nextCharacter!.id}`)).toHaveClass('is-selected');
    fireEvent.click(screen.getByRole('button', { name: `${nextCharacter!.displayName} · 달리기 시작 ▶` }));
    expect(onConfirm).toHaveBeenCalledWith(nextCharacter!.id);
  });

  it('preserves the back action and uses the selected catalog display name', () => {
    const onConfirm = vi.fn();
    const onBack = vi.fn();
    const character = selectorCharacters.find((candidate) => candidate.available && candidate.id === 'cogane-rang')
      ?? selectorCharacters.find((candidate) => candidate.available)!;
    render(<CharacterSelect selectedCharacterId={character.id} onConfirm={onConfirm} onBack={onBack} />);

    expect(screen.getByRole('button', { name: `${character.displayName} · 달리기 시작 ▶` })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '← 타이틀로' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
