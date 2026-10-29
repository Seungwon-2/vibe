import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AUDIO_PREFERENCES } from '../../audio/audioPreferences';
import { MainMenu } from './MainMenu';

describe('MainMenu audio actions', () => {
  it('opens effects settings and catalog-driven credits', () => {
    const onUnlockAudio = vi.fn();
    render(<MainMenu onStart={vi.fn()} onRankings={vi.fn()} topRun={null} topRunLoading={false}
      topRunError={null} showControlsHelp={false} audioPreferences={{ ...DEFAULT_AUDIO_PREFERENCES }}
      onAudioPreferencesChange={vi.fn()} onUnlockAudio={onUnlockAudio} />);

    fireEvent.click(screen.getByRole('button', { name: /사운드 설정/ }));
    expect(screen.getByRole('dialog', { name: /사운드 설정/ })).toBeInTheDocument();
    expect(onUnlockAudio).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /설정 닫기/ }));
    fireEvent.click(screen.getByRole('button', { name: /효과음 크레딧/ }));
    expect(screen.getByRole('dialog', { name: /효과음 크레딧/ })).toBeInTheDocument();
  });
});
