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
    expect(screen.getAllByTestId('selector-showcase-portrait')).toHaveLength(1);
    expect(screen.getByTestId('selector-showcase-portrait')).toHaveAttribute('src', expect.stringContaining('aokumo-rin-portrait'));
    expect(document.querySelectorAll('.character-card__portrait')).toHaveLength(0);
    expect(screen.getByTestId('character-preview-player-default-showcase')).toHaveAttribute('data-animation', 'victory');
    expect(screen.getByTestId('character-preview-player-default-showcase').style.animationIterationCount).toBe('1');
    expect(screen.getByTestId('character-preview-player-default-showcase').style.animationFillMode).toBe('forwards');
    expect(screen.getByTestId('character-preview-player-default-showcase').style.animationDuration).toBe('1200ms');
    expect(screen.getByText('Aokumo Rin 선택됨')).toHaveClass('sr-only');
    for (const id of ['hanayo-hiyori', 'tokino-mary', 'goth-student', 'cogane-rang']) {
      expect(screen.getByTestId(`character-preview-${id}-roster`)).toHaveAttribute('data-animation', 'idle');
      expect(screen.getByTestId(`character-preview-${id}-roster`).style.animationIterationCount).toBe('infinite');
    }
    expect(screen.getByTestId('character-preview-hanayo-hiyori-roster').style.animationFillMode).toBe('none');
    expect(screen.queryByText(/MAX|레벨|가격|구매/)).not.toBeInTheDocument();
  });

  it('applies perceived-height normalization on the sprite wrapper for the whole roster', () => {
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />);
    const contentHeights: Record<string, number> = {
      'player-default': 70,
      'hanayo-hiyori': 53,
      'tokino-mary': 58,
      'goth-student': 88,
      'cogane-rang': 83,
    };
    for (const [id, contentHeight] of Object.entries(contentHeights)) {
      const frame = screen.getByTestId(`character-preview-frame-${id}-roster`);
      expect(Number.parseFloat(frame.style.getPropertyValue('--preview-scale')))
        .toBeCloseTo(136 / contentHeight, 4);
      expect(screen.getByTestId(`character-preview-${id}-roster`).style.getPropertyValue('--preview-scale')).toBe('');
    }
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
    const previousPreview = screen.getByTestId('character-preview-player-default-showcase');
    fireEvent.click(screen.getByRole('button', { name: 'Hanayo Hiyori' }));
    expect(screen.getByRole('button', { name: 'Hanayo Hiyori' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Aokumo Rin' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('character-preview-hanayo-hiyori-showcase')).toHaveAttribute('data-animation', 'victory');
    expect(screen.getByText('유령의 수호 · 충돌·낭떠러지 방어 2회')).toBeInTheDocument();
    const preview = screen.getByTestId('character-preview-hanayo-hiyori-showcase');
    expect(previousPreview.isConnected).toBe(false);
    expect(preview).toHaveAttribute('data-frame', 'hanayo-hiyori-victory-00');
    expect(preview).toHaveClass('is-animated');
    expect(preview).toHaveAttribute('src', expect.stringContaining('hanayo-hiyori.png'));
    expect(preview.style.animationTimingFunction).toBe('steps(5, end)');
    expect(preview.style.animationDuration).toBe('1200ms');
    expect(preview.style.animationIterationCount).toBe('1');
    expect(preview.style.animationFillMode).toBe('forwards');
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

  it('uses the first victory frame as the reduced-motion fallback', () => {
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId('character-preview-player-default-showcase')).toHaveAttribute('data-frame', 'victory-00');
  });
});
