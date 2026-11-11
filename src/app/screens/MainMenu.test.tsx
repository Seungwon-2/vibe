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

  it('shows private Entra account identity and a separate logout action when signed in', () => {
    const onSignOut = vi.fn();
    render(<MainMenu onStart={vi.fn()} onRankings={vi.fn()} topRun={null} topRunLoading={false}
      topRunError={null} showControlsHelp={false} audioPreferences={{ ...DEFAULT_AUDIO_PREFERENCES }}
      onAudioPreferencesChange={vi.fn()} onUnlockAudio={vi.fn()} authMode="cloud" authStatus="signed-in"
      accountName="승원 이" accountUsername="seungwon@example.com" onSignOut={onSignOut} />);

    expect(screen.getByLabelText('로그인 계정 정보')).toBeInTheDocument();
    expect(screen.getByText('승원 이')).toBeInTheDocument();
    expect(screen.getByText('seungwon@example.com')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('uses safe account fallbacks and wraps long usernames inside the compact account panel', () => {
    const longUsername = `${'long-user-name-'.repeat(8)}@example.com`;
    const { rerender } = render(<MainMenu onStart={vi.fn()} onRankings={vi.fn()} topRun={null} topRunLoading={false}
      topRunError={null} showControlsHelp={false} audioPreferences={{ ...DEFAULT_AUDIO_PREFERENCES }}
      onAudioPreferencesChange={vi.fn()} onUnlockAudio={vi.fn()} authMode="cloud" authStatus="signed-in"
      accountName={null} accountUsername={longUsername} onSignOut={vi.fn()} />);

    expect(screen.getByText('Runner')).toBeInTheDocument();
    expect(screen.getByText(longUsername)).toHaveClass('main-menu-account__username');
    rerender(<MainMenu onStart={vi.fn()} onRankings={vi.fn()} topRun={null} topRunLoading={false}
      topRunError={null} showControlsHelp={false} audioPreferences={{ ...DEFAULT_AUDIO_PREFERENCES }}
      onAudioPreferencesChange={vi.fn()} onUnlockAudio={vi.fn()} authMode="cloud" authStatus="signed-in"
      accountName="계정 이름" accountUsername={null} onSignOut={vi.fn()} />);
    expect(screen.getByText('계정 정보 없음')).toBeInTheDocument();
  });

  it('keeps sign-in available while hiding the account panel when signed out and in local mode', () => {
    const onSignIn = vi.fn();
    const { rerender } = render(<MainMenu onStart={vi.fn()} onRankings={vi.fn()} topRun={null} topRunLoading={false}
      topRunError={null} showControlsHelp={false} audioPreferences={{ ...DEFAULT_AUDIO_PREFERENCES }}
      onAudioPreferencesChange={vi.fn()} onUnlockAudio={vi.fn()} authMode="cloud" authStatus="signed-out"
      onSignIn={onSignIn} />);
    expect(screen.queryByLabelText('로그인 계정 정보')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '회사 계정으로 로그인' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: '회사 계정으로 로그인' }));
    expect(onSignIn).toHaveBeenCalledOnce();

    rerender(<MainMenu onStart={vi.fn()} onRankings={vi.fn()} topRun={null} topRunLoading={false}
      topRunError={null} showControlsHelp={false} audioPreferences={{ ...DEFAULT_AUDIO_PREFERENCES }}
      onAudioPreferencesChange={vi.fn()} onUnlockAudio={vi.fn()} authMode="local" authStatus="signed-in"
      accountName="잘못된 로컬 계정" accountUsername="private@example.com" onSignOut={vi.fn()} />);
    expect(screen.queryByLabelText('로그인 계정 정보')).not.toBeInTheDocument();
    expect(screen.queryByText('private@example.com')).not.toBeInTheDocument();
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
