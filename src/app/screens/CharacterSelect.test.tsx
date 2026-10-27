import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharacterSelect } from './CharacterSelect';

describe('CharacterSelect', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows the five-character roster and defaults to Rin when the saved ID is invalid', () => {
    render(
      <CharacterSelect
        selectedCharacterId={'unknown-id' as never}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    for (const name of ['Aokumo Rin', 'Shizuki Toa', 'Cogane Rang', 'Hanayo Hiyori', 'Tokino Mary']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: 'Ayatsuno Yuni' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Akane Lize' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aokumo Rin' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('character-preview-player-default')).toHaveAttribute('data-animation', 'run');
    expect(screen.getByRole('button', { name: 'Shizuki Toa' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cogane Rang' })).toBeDisabled();
    expect(screen.getAllByText('준비 중')).toHaveLength(2);
  });

  it('keeps unfinished characters unavailable even when previously selected', () => {
    const onConfirm = vi.fn();
    render(<CharacterSelect selectedCharacterId="goth-student" onConfirm={onConfirm} onBack={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Aokumo Rin' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Cogane Rang' }));
    expect(screen.getByRole('button', { name: 'Aokumo Rin' })).toHaveAttribute('aria-pressed', 'true');
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('changes selection and starts the selected character on a single atlas animation', () => {
    render(
      <CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hanayo Hiyori' }));
    expect(screen.getByRole('button', { name: 'Hanayo Hiyori' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Aokumo Rin' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('character-preview-hanayo-hiyori')).toHaveAttribute('data-animation', 'run');
    expect(screen.getByTestId('character-preview-hanayo-hiyori')).toHaveAttribute('data-frame', 'hanayo-hiyori-run-00');

    const preview = screen.getByTestId('character-preview-hanayo-hiyori');
    expect(preview).toHaveClass('is-running');
    expect(preview).toHaveAttribute('src', expect.stringContaining('hanayo-hiyori.png'));
    expect(preview.style.animationTimingFunction).toBe('steps(12, end)');
    expect(preview.style.animationDuration).toBe('600ms');
  });

  it('confirms only the chosen character and keeps back separate from confirmation', () => {
    const onConfirm = vi.fn();
    const onBack = vi.fn();
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={onConfirm} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tokino Mary' }));
    fireEvent.click(screen.getByRole('button', { name: '선택한 캐릭터로 게임 시작' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('tokino-mary');

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('keeps the first run frame as the static reduced-motion fallback', () => {
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />);

    const selectedCard = screen.getByRole('button', { name: 'Aokumo Rin' });
    expect(within(selectedCard).getByTestId('character-preview-player-default')).toHaveAttribute(
      'data-frame',
      'run-00',
    );
  });
});
