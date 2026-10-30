import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharacterSelect } from './CharacterSelect';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const roster = [
  { id: 'player-default', name: '아오쿠모 린', shortName: '린', passive: '질주의 메이드', icon: 'rin-cloud-tailwind' },
  { id: 'hanayo-hiyori', name: '하나요 히요리', shortName: '히요리', passive: '벚꽃 수호', icon: 'hiyori-blossom-ward' },
  { id: 'tokino-mary', name: '토키노 메리', shortName: '메리', passive: '음표의 이끌림', icon: 'mary-music-magnet' },
  { id: 'goth-student', name: '시즈키 토아', shortName: '토아', passive: '고스트 슬라이드', icon: 'toa-ghost-glide' },
  { id: 'cogane-rang', name: '코가네 랑', shortName: '랑', passive: '호랑이 탄력', icon: 'rang-tiger-spring' },
] as const;

describe('CharacterSelect', () => {
  it('shows five cards in reference order with Korean names and passive icons', () => {
    render(<CharacterSelect selectedCharacterId={'unknown-id' as never} onConfirm={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '누구와 달려볼까요?' })).toBeInTheDocument();
    expect(screen.getByText('캐릭터를 고른 뒤 아래의 달리기 버튼을 누르세요.')).toBeInTheDocument();

    const cards = [...document.querySelectorAll<HTMLButtonElement>('.character-card--runner')];
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual(roster.map(({ name }) => name));
    expect(cards[0]).toHaveAttribute('aria-pressed', 'true');

    for (const [index, character] of roster.entries()) {
      const card = cards[index];
      expect(within(card).getByText(character.name)).toBeInTheDocument();
      expect(within(card).getByText(character.passive)).toBeInTheDocument();
      expect(card.querySelector('.character-ability-icon')).toHaveAttribute('data-icon', character.icon);
      expect(card.querySelector('.character-card__passive small')).not.toBeEmptyDOMElement();
    }
  });

  it('loops all five run animations in the lower preview lane', () => {
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('region', { name: '캐릭터 달리기 미리보기' })).toBeInTheDocument();
    for (const character of roster) {
      const runner = screen.getByTestId(`selector-runner-${character.id}`);
      const sprite = runner.querySelector('img');
      expect(sprite).toHaveAttribute('data-animation', 'run');
      expect(sprite?.style.animationIterationCount).toBe('infinite');
      expect(sprite).toHaveAttribute('src', expect.stringContaining(`${character.id === 'player-default' ? 'player-default' : character.id}.png`));
    }
  });

  it('selects a card, updates its accent and start label, and confirms the unchanged ID', () => {
    const onConfirm = vi.fn();
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={onConfirm} onBack={vi.fn()} />);
    const hiyori = screen.getByRole('button', { name: '하나요 히요리' });
    fireEvent.click(hiyori);

    expect(hiyori).toHaveAttribute('aria-pressed', 'true');
    expect(hiyori).toHaveClass('is-selected');
    expect(hiyori.style.getPropertyValue('--character-accent')).toBe('#fca6d0');
    expect(screen.getByTestId('selector-runner-hanayo-hiyori')).toHaveClass('is-selected');
    const start = screen.getByRole('button', { name: '히요리 · 달리기 시작 ▶' });
    fireEvent.click(start);
    expect(onConfirm).toHaveBeenCalledWith('hanayo-hiyori');
  });

  it('preserves the back action and exposes a selected-name start label', () => {
    const onConfirm = vi.fn();
    const onBack = vi.fn();
    render(<CharacterSelect selectedCharacterId="cogane-rang" onConfirm={onConfirm} onBack={onBack} />);
    expect(screen.getByRole('button', { name: '랑 · 달리기 시작 ▶' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '← 타이틀로' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('normalizes every roster sprite to a consistent perceived height', () => {
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />);
    const contentHeights: Record<string, number> = {
      'player-default': 70,
      'hanayo-hiyori': 53,
      'tokino-mary': 58,
      'goth-student': 70,
      'cogane-rang': 67,
    };
    for (const [id, contentHeight] of Object.entries(contentHeights)) {
      const frame = screen.getByTestId(`character-preview-frame-${id}-roster`);
      expect(Number.parseFloat(frame.style.getPropertyValue('--preview-scale'))).toBeCloseTo(136 / contentHeight, 4);
    }
  });
});
