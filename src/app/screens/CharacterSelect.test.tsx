import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharacterSelect } from './CharacterSelect';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const roster = [
  { id: 'player-default', name: '아오쿠모 린', shortName: '린', portrait: 'aokumo-rin.webp', firstRun: 'runs/player-default/run-01.png', nextRun: 'runs/player-default/run-02.png', passive: '질주의 메이드', icon: 'rin-cloud-tailwind' },
  { id: 'hanayo-hiyori', name: '하나요 히요리', shortName: '히요리', portrait: 'hanayo-hiyori.webp', firstRun: 'runs/hanayo-hiyori/run-01.webp', nextRun: 'runs/hanayo-hiyori/run-02.webp', passive: '벚꽃 수호', icon: 'hiyori-blossom-ward' },
  { id: 'tokino-mary', name: '토키노 메리', shortName: '메리', portrait: 'tokino-mary.webp', firstRun: 'runs/tokino-mary/run-01.webp', nextRun: 'runs/tokino-mary/run-02.webp', passive: '음표의 이끌림', icon: 'mary-music-magnet' },
  { id: 'goth-student', name: '시즈키 토아', shortName: '토아', portrait: 'shizuki-toa.webp', firstRun: 'runs/goth-student/run-01.webp', nextRun: 'runs/goth-student/run-02.webp', passive: '고스트 슬라이드', icon: 'toa-ghost-glide' },
  { id: 'cogane-rang', name: '코가네 랑', shortName: '랑', portrait: 'cogane-rang.webp', firstRun: 'runs/cogane-rang/run-01.webp', nextRun: 'runs/cogane-rang/run-02.webp', passive: '호랑이 탄력', icon: 'rang-tiger-spring' },
] as const;

describe('CharacterSelect', () => {
  it('shows five static high-resolution illustrations with passive icons and Korean names', () => {
    render(<CharacterSelect selectedCharacterId={'unknown-id' as never} onConfirm={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '누구와 달려볼까요?' })).toBeInTheDocument();

    const cards = [...document.querySelectorAll<HTMLButtonElement>('.character-card--runner')];
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual(roster.map(({ name }) => name));
    const rosterGroup = screen.getByRole('group', { name: '플레이할 캐릭터' });
    expect(rosterGroup).toHaveAttribute('data-roster-layout', 'one-row');
    expect(cards.every((card) => card.parentElement === rosterGroup)).toBe(true);
    expect(cards[0]).toHaveAttribute('aria-pressed', 'true');

    for (const [index, character] of roster.entries()) {
      const card = cards[index];
      const illustration = card.querySelector('img.character-card__illustration');
      expect(illustration).not.toBeNull();
      expect(illustration).toHaveClass('character-card__illustration');
      expect(illustration).toHaveAttribute('src', `/assets/character/selector-art/${character.portrait}`);
      expect(card.querySelector('.character-preview')).toBeNull();
      expect(within(card).getByText(character.name)).toBeInTheDocument();
      expect(within(card).getByText(character.passive)).toBeInTheDocument();
      expect(card.querySelector('.character-ability-icon')).toHaveAttribute('data-icon', character.icon);
    }
  });

  it('animates quality run frames only in the lower preview lane at 20 fps', () => {
    vi.useFakeTimers();
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('region', { name: '캐릭터 달리기 미리보기' })).toBeInTheDocument();
    for (const character of roster) {
      const runner = screen.getByTestId(`selector-runner-${character.id}`);
      const image = runner.querySelector('img');
      expect(image).toHaveClass('selector-runner-frame');
      expect(image).toHaveAttribute('src', `/assets/character/selector-art/${character.firstRun}`);
    }
    act(() => vi.advanceTimersByTime(50));
    for (const character of roster) {
      const image = screen.getByTestId(`selector-runner-${character.id}`).querySelector('img');
      expect(image).toHaveAttribute('src', `/assets/character/selector-art/${character.nextRun}`);
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
    fireEvent.click(screen.getByRole('button', { name: '히요리 · 달리기 시작 ▶' }));
    expect(onConfirm).toHaveBeenCalledWith('hanayo-hiyori');
  });

  it('preserves the back action and selected-name start label', () => {
    const onConfirm = vi.fn();
    const onBack = vi.fn();
    render(<CharacterSelect selectedCharacterId="cogane-rang" onConfirm={onConfirm} onBack={onBack} />);
    expect(screen.getByRole('button', { name: '랑 · 달리기 시작 ▶' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '← 타이틀로' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
