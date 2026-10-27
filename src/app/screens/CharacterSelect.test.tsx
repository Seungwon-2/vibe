import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharacterSelect } from './CharacterSelect';

describe('CharacterSelect', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows all five catalog characters, selects Rin by default, and marks unfinished entries', () => {
    render(<CharacterSelect selectedCharacterId={'unknown-id' as never} onConfirm={vi.fn()} onBack={vi.fn()} />);
    for (const name of ['Aokumo Rin', 'Hanayo Hiyori', 'Tokino Mary', 'Shizuki Toa', 'Cogane Rang']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: 'Ayatsuno Yuni' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Akane Lize' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aokumo Rin' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Shizuki Toa' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cogane Rang' })).toBeDisabled();
    expect(screen.getAllByText('준비 중')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: '캐릭터 선택' })).toBeInTheDocument();
    expect(screen.getByTestId('character-preview-player-default-showcase')).toHaveAttribute('data-animation', 'run');
    for (const id of ['hanayo-hiyori', 'tokino-mary', 'goth-student', 'cogane-rang']) {
      expect(screen.getByTestId(`character-preview-${id}-roster`)).toHaveAttribute('data-animation', 'idle');
    }
    expect(screen.queryByText(/MAX|레벨|가격|구매/)).not.toBeInTheDocument();
  });

  it('does not allow an unavailable character to become the candidate or start the run', () => {
    const onConfirm = vi.fn();
    render(<CharacterSelect selectedCharacterId="goth-student" onConfirm={onConfirm} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Aokumo Rin' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Shizuki Toa' }));
    expect(screen.getByRole('button', { name: 'Aokumo Rin' })).toHaveAttribute('aria-pressed', 'true');
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('updates showcase art, name, passive, and accent when a playable character is chosen', () => {
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hanayo Hiyori' }));
    expect(screen.getByRole('button', { name: 'Hanayo Hiyori' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Aokumo Rin' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('character-preview-hanayo-hiyori-showcase')).toHaveAttribute('data-animation', 'run');
    expect(screen.getByText('아이템 수집 범위 +20px')).toBeInTheDocument();
    const preview = screen.getByTestId('character-preview-hanayo-hiyori-showcase');
    expect(preview).toHaveAttribute('data-frame', 'hanayo-hiyori-run-00');
    expect(preview).toHaveClass('is-animated');
    expect(preview).toHaveAttribute('src', expect.stringContaining('hanayo-hiyori.png'));
    expect(preview.style.animationTimingFunction).toBe('steps(12, end)');
    expect(preview.style.animationDuration).toBe('768ms');
    expect(screen.getByText('Hanayo Hiyori 선택됨')).toBeInTheDocument();
  });

  it('confirms only the chosen character and keeps back separate from confirmation', () => {
    const onConfirm = vi.fn();
    const onBack = vi.fn();
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={onConfirm} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tokino Mary' }));
    fireEvent.click(screen.getByRole('button', { name: '선택한 캐릭터로 달리기 시작' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledWith('tokino-mary');
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('uses the first running frame as the reduced-motion fallback', () => {
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId('character-preview-player-default-showcase')).toHaveAttribute('data-frame', 'run-00');
  });
});
