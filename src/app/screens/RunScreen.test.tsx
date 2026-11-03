import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRunnerSnapshot, startRunner } from '../../game/runner/RunnerSimulation';
import type { RunnerEvent } from '../../game/runner/runnerEvents';
import { DEFAULT_AUDIO_PREFERENCES } from '../../audio/audioPreferences';

const runMock = vi.hoisted(() => ({ paused: false }));
const audioMock = vi.hoisted(() => ({ playEffect: vi.fn() }));
vi.mock('../../audio/RunnerAudioManager', () => ({ browserRunnerAudio: audioMock }));

vi.mock('../../game/runner/RunnerGame', () => ({
  RunnerGame: ({ paused, tutorialEnabled, onSnapshot, onEvent }: {
    paused: boolean;
    tutorialEnabled: boolean;
    onSnapshot(snapshot: ReturnType<typeof startRunner>): void;
    onEvent(event: RunnerEvent): void;
  }) => {
    runMock.paused = paused;
    return <div data-testid="run-game" data-paused={paused} data-tutorial-enabled={tutorialEnabled}>
      <button type="button" onClick={() => {
        onSnapshot(startRunner(createRunnerSnapshot('player-default')));
        onEvent({ type: 'countdown', value: 0 });
      }}>
        begin mock run
      </button>
      <button type="button" onClick={() => onEvent({ type: 'passive-triggered', passiveId: 'hiyori-guard',
        remainingCharges: 1, trigger: 'pit' })}>trigger passive</button>
      <button type="button" onClick={() => {
        onEvent({ type: 'player-action', action: 'jump' });
        onEvent({ type: 'player-action', action: 'double-jump' });
        onEvent({ type: 'player-action', action: 'slide' });
        onEvent({ type: 'pickup', pickupId: 'coin-1', kind: 'coin', awardedMs: 0 });
        onEvent({ type: 'pickup', pickupId: 'time-1', kind: 'time', awardedMs: 3_000 });
        onEvent({ type: 'pickup', pickupId: 'time-2', kind: 'time', awardedMs: 0 });
        onEvent({ type: 'pickup', pickupId: 'giant-0', kind: 'giant', awardedMs: 0 });
        onEvent({ type: 'gate', gateId: 'gate-2000', awardedMs: 20_000 });
        onEvent({ type: 'hazard-hit' });
        onEvent({ type: 'pit-fall-started' });
        onEvent({ type: 'passive-triggered', passiveId: 'hiyori-guard', remainingCharges: 1, trigger: 'pit' });
      }}>play effects</button>
    </div>;
  },
}));

import { RunScreen } from './RunScreen';

const audioProps = {
  audioPreferences: { ...DEFAULT_AUDIO_PREFERENCES },
  onAudioPreferencesChange: vi.fn(),
  onUnlockAudio: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => localStorage.removeItem('runner-action:tutorial:v1:seen'));

describe('RunScreen', () => {
  it.each(['story', 'endless'] as const)('keeps the %s HUD outside the gameplay stage', (mode) => {
    render(<RunScreen {...audioProps} characterId="player-default" mode={mode}
      storyStageId={mode === 'story' ? 'dawn-city' : null} onFinish={vi.fn()} onExit={vi.fn()} />);
    const hud = document.querySelector('.runner-hud');
    const hudRow = document.querySelector('.run-screen__hud');
    const stage = document.querySelector('.runner-stage');
    expect(hud).toBeInTheDocument();
    expect(hud?.parentElement).toBe(hudRow);
    expect(hud?.closest('.runner-stage')).toBeNull();
    expect(stage?.querySelector('.runner-hud')).toBeNull();
    expect(hudRow?.nextElementSibling).toBe(stage);
    expect(within(hud as HTMLElement).getByRole('button', { name: '일시정지' })).toBeInTheDocument();
  });

  it('routes gameplay events to effects and ignores zero-award pickups', () => {
    audioMock.playEffect.mockClear();
    render(<RunScreen {...audioProps} characterId="hanayo-hiyori" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'play effects' }));
    expect(audioMock.playEffect.mock.calls).toEqual([
      ['jump'], ['double-jump'], ['slide'], ['coin'], ['time-pickup'], ['time-pickup'], ['gate'], ['hit'], ['fall'], ['hiyori-defense'],
    ]);
  });

  it('shows a brief gate speed burst and restarts its duration on another gate', () => {
    vi.useFakeTimers();
    render(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'play effects' }));
    const stage = document.querySelector('.runner-stage');
    expect(stage).toHaveClass('is-gate-boosting');
    act(() => vi.advanceTimersByTime(600));
    fireEvent.click(screen.getByRole('button', { name: 'play effects' }));
    act(() => vi.advanceTimersByTime(649));
    expect(stage).toHaveClass('is-gate-boosting');
    act(() => vi.advanceTimersByTime(1));
    expect(stage).not.toHaveClass('is-gate-boosting');
  });

  it('shows control help on the first run and hides it after persistence on the next run', () => {
    const firstRun = render(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={vi.fn()} />);
    expect(screen.getByTestId('run-game')).toHaveAttribute('data-tutorial-enabled', 'true');
    expect(document.querySelector('.run-screen__help')).toBeInTheDocument();
    expect(localStorage.getItem('runner-action:tutorial:v1:seen')).toBe('1');
    firstRun.unmount();

    render(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={vi.fn()} />);
    expect(screen.getByTestId('run-game')).toHaveAttribute('data-tutorial-enabled', 'false');
    expect(document.querySelector('.run-screen__help')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /점프/ })).toBeInTheDocument();
  });

  it('pauses, confirms exit without losing the run prematurely, resumes, then exits', () => {
    const onExit = vi.fn();
    render(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', { name: 'begin mock run' }));
    fireEvent.keyDown(window, { code: 'KeyP' });
    expect(runMock.paused).toBe(true);
    fireEvent.keyDown(window, { code: 'KeyP' });
    expect(runMock.paused).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: '일시정지' }));
    const pauseDialog = screen.getByRole('dialog');
    fireEvent.click(within(pauseDialog).getByRole('button', { name: '나가기' }));
    const confirmation = screen.getByRole('alertdialog', { name: '이번 달리기를 종료할까요?' });
    expect(onExit).not.toHaveBeenCalled();
    fireEvent.click(within(confirmation).getByRole('button', { name: '일시정지로 돌아가기' }));
    fireEvent.click(screen.getByRole('button', { name: '계속하기' }));
    expect(runMock.paused).toBe(false);

    const header = screen.getByRole('banner');
    fireEvent.click(within(header).getByRole('button', { name: '나가기' }));
    fireEvent.click(screen.getByRole('button', { name: '종료하고 메뉴로' }));
    expect(onExit).toHaveBeenCalledOnce();
  });

  it('opens audio settings from pause and keeps the run paused when settings close', () => {
    render(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'begin mock run' }));
    fireEvent.keyDown(window, { code: 'KeyP' });
    expect(runMock.paused).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '사운드 설정' }));
    expect(screen.getByRole('dialog', { name: '사운드 설정' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '설정 닫기' }));
    expect(screen.getByRole('dialog', { name: /일시 정지/ })).toBeInTheDocument();
    expect(runMock.paused).toBe(true);
  });

  it('shows Hiyori defense feedback for 1,200ms and clears it when paused', () => {
    vi.useFakeTimers();
    render(<RunScreen {...audioProps} characterId="hanayo-hiyori" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'begin mock run' }));
    fireEvent.click(screen.getByRole('button', { name: 'trigger passive' }));
    expect(screen.getByRole('status')).toHaveTextContent('벚꽃 수호 · 낭떠러지 방어 · 남은 1회');
    act(() => vi.advanceTimersByTime(1_199));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'trigger passive' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '일시정지' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('clears a pending passive cue timeout when the run screen unmounts', () => {
    vi.useFakeTimers();
    const view = render(<RunScreen {...audioProps} characterId="hanayo-hiyori" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'begin mock run' }));
    const timersBeforePassive = vi.getTimerCount();
    fireEvent.click(screen.getByRole('button', { name: 'trigger passive' }));
    expect(vi.getTimerCount()).toBe(timersBeforePassive + 1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(timersBeforePassive);
  });
});
