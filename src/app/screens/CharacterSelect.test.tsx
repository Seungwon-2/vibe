import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharacterSelect } from './CharacterSelect';
import { getCharacter } from '../../game/characters/characterCatalog';
import { getCharacterPassive } from '../../game/characters/characterAbilities';
import { DEFAULT_PLAYER_PROFILE } from '../../services/LocalPlayerProfileStore';

const order = ['player-default', 'hanayo-hiyori', 'tokino-mary', 'goth-student', 'cogane-rang'] as const;

afterEach(cleanup);

describe('CharacterSelect', () => {
  it('shows five face cards followed by ten non-interactive slots', () => {
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />);
    const roster = screen.getByRole('group', { name: '플레이할 캐릭터' });
    const cards = within(roster).getAllByRole('button');
    expect(cards).toHaveLength(5);
    expect(roster.querySelectorAll('[data-grid-slot][aria-hidden="true"]')).toHaveLength(10);
    for (const [index, id] of order.entries()) {
      expect(cards[index]).toHaveAccessibleName(getCharacter(id).displayName);
      expect(cards[index].querySelector('img')).toHaveAttribute('src', `/assets/character/selector-art/roster/${id}-face.webp`);
    }
  });

  it('updates Hiyori’s portrait and passive together and confirms the catalog ID', () => {
    const onConfirm = vi.fn();
    render(<CharacterSelect profile={DEFAULT_PLAYER_PROFILE} selectedCharacterId="player-default"
      onConfirm={onConfirm} onBack={vi.fn()} />);
    const hiyori = screen.getByRole('button', { name: '하나요 히요리' });
    fireEvent.click(hiyori);
    expect(hiyori).toHaveAttribute('aria-pressed', 'true');
    const detail = screen.getByRole('region', { name: '하나요 히요리' });
    const passive = getCharacterPassive('hanayo-hiyori');
    expect(within(detail).getByRole('img', { name: '하나요 히요리 전신' })).toHaveAttribute('src',
      '/assets/character/selector-art/roster/hanayo-hiyori-full.webp');
    expect(within(detail).getByText(passive.name)).toBeInTheDocument();
    expect(within(detail).getByText(passive.effectLabel)).toBeInTheDocument();
    expect(detail.querySelector('.character-ability-icon')).toHaveAttribute('data-icon', passive.icon);
    fireEvent.click(within(detail).getByRole('button', { name: '달리기 시작' }));
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith('hanayo-hiyori');
  });

  it('guards locked characters and rechecks selection when profile access changes', () => {
    const onConfirm = vi.fn();
    const onBack = vi.fn();
    const { rerender } = render(<CharacterSelect profile={DEFAULT_PLAYER_PROFILE} selectedCharacterId="goth-student"
      onConfirm={onConfirm} onBack={onBack} />);
    const toa = screen.getByRole('button', { name: '시즈키 토아 잠김' });
    expect(toa).toBeDisabled();
    expect(toa).toHaveAccessibleDescription('수정 광산 완주 후 해금');
    fireEvent.click(toa);
    expect(screen.getByRole('button', { name: '아오쿠모 린' })).toHaveAttribute('aria-pressed', 'true');
    rerender(<CharacterSelect profile={{ ...DEFAULT_PLAYER_PROFILE, unlockedCharacterIds: [] }}
      selectedCharacterId="goth-student" onConfirm={onConfirm} onBack={onBack} />);
    const start = screen.getByRole('button', { name: '달리기 시작' });
    expect(start).toBeDisabled();
    fireEvent.click(start);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('keeps arrows separate from selection and exposes the menu and shop actions', () => {
    const onBack = vi.fn();
    const onShop = vi.fn();
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={onBack} onShop={onShop} />);
    const rin = screen.getByRole('button', { name: '아오쿠모 린' });
    const hiyori = screen.getByRole('button', { name: '하나요 히요리' });
    rin.focus();
    fireEvent.keyDown(rin, { key: 'ArrowRight' });
    expect(hiyori).toHaveFocus();
    expect(rin).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '← 타이틀로' }));
    fireEvent.click(screen.getByRole('button', { name: '코인 상점' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onShop).toHaveBeenCalledOnce();
  });
});
