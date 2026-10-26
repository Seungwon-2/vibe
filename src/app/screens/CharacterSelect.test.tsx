import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharacterSelect } from './CharacterSelect';

describe('CharacterSelect', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows all four characters and defaults to Rin when the saved ID is invalid', () => {
    render(
      <CharacterSelect
        selectedCharacterId={'unknown-id' as never}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    for (const name of ['Aokumo Rin', 'Shizuki Toa', 'Ayatsuno Yuni', 'Akane Lize']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Aokumo Rin' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('character-preview-player-default')).toHaveAttribute('data-animation', 'run');
    expect(screen.getByTestId('character-preview-goth-student')).toHaveAttribute('data-animation', 'idle');
  });

  it('changes selection and starts the selected character on a single atlas animation', () => {
    render(
      <CharacterSelect selectedCharacterId="player-default" onConfirm={vi.fn()} onBack={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ayatsuno Yuni' }));
    expect(screen.getByRole('button', { name: 'Ayatsuno Yuni' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Aokumo Rin' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('character-preview-moonwing')).toHaveAttribute('data-animation', 'run');
    expect(screen.getByTestId('character-preview-moonwing')).toHaveAttribute('data-frame', 'moonwing-run-00');

    const preview = screen.getByTestId('character-preview-moonwing');
    expect(preview).toHaveClass('is-running');
    expect(preview).toHaveAttribute('src', expect.stringContaining('moonwing.png'));
    expect(preview.style.animationTimingFunction).toBe('steps(8, end)');
    expect(preview.style.animationDuration).toBe('768ms');
  });

  it('confirms only the chosen character and keeps back separate from confirmation', () => {
    const onConfirm = vi.fn();
    const onBack = vi.fn();
    render(<CharacterSelect selectedCharacterId="player-default" onConfirm={onConfirm} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: 'Akane Lize' }));
    fireEvent.click(screen.getByRole('button', { name: '선택한 캐릭터로 게임 시작' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('akane-lize');

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
