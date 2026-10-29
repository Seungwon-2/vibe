import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AUDIO_PREFERENCES } from '../../audio/audioPreferences';
import { AudioSettingsDialog } from './AudioSettingsDialog';

describe('AudioSettingsDialog', () => {
  it('changes mute and effect volume, unlocks audio, and closes with Escape', () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    const onUnlockAudio = vi.fn();
    render(<AudioSettingsDialog preferences={{ ...DEFAULT_AUDIO_PREFERENCES }} onChange={onChange}
      onClose={onClose} onUnlockAudio={onUnlockAudio} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /전체 음소거/ }));
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_AUDIO_PREFERENCES, muted: true });
    fireEvent.change(screen.getByRole('slider', { name: /효과음 크기/ }), { target: { value: '0.35' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_AUDIO_PREFERENCES, effectsVolume: 0.35 });
    expect(onUnlockAudio).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
