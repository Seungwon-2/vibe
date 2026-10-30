import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_AUDIO_PREFERENCES } from '../../audio/audioPreferences';
import { MainMenu } from './MainMenu';

afterEach(cleanup);

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

  it('keeps the local records action in the same menu button row and opens rankings', () => {
    const onRankings = vi.fn();
    const { container } = render(<MainMenu onStart={vi.fn()} onRankings={onRankings} topRun={null} topRunLoading={false}
      topRunError={null} showControlsHelp={false} audioPreferences={{ ...DEFAULT_AUDIO_PREFERENCES }}
      onAudioPreferencesChange={vi.fn()} onUnlockAudio={vi.fn()} />);
    const actions = container.querySelector('.main-menu-actions');
    expect(actions?.querySelectorAll(':scope > button')).toHaveLength(4);
    fireEvent.click(actions!.querySelector('.main-menu-rankings')!);
    expect(onRankings).toHaveBeenCalledOnce();
  });

  it('renders the Stella Runner title scene without prototype download links or footer copy', () => {
    const { container } = render(<MainMenu onStart={vi.fn()} onRankings={vi.fn()} topRun={null} topRunLoading={false}
      topRunError={null} showControlsHelp={false} audioPreferences={{ ...DEFAULT_AUDIO_PREFERENCES }}
      onAudioPreferencesChange={vi.fn()} onUnlockAudio={vi.fn()} />);

    expect(container.querySelector('#game-title')).toHaveTextContent('스텔라 러너');
    expect(container.querySelector('.main-menu-hero')).toHaveAttribute('src', '/assets/title/title-hero.webp');
    expect(screen.getByRole('button', { name: /달리기 시작/ })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/팬 제작 게임 프로토타입|캐릭터 이미지와 게임 화면을 함께 즐기는 데모/)).not.toBeInTheDocument();
  });
});
