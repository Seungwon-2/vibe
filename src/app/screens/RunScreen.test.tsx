import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRunnerSnapshot, startRunner } from '../../game/runner/RunnerSimulation';
import type { RunnerEvent } from '../../game/runner/runnerEvents';
import { DEFAULT_AUDIO_PREFERENCES } from '../../audio/audioPreferences';
import type { ReactElement } from 'react';

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
      <button type="button" onClick={() => onEvent({ type: 'pickup', pickupId: 'speed-1', kind: 'speed', awardedMs: 0 })}>
        trigger speed pickup
      </button>
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

function renderReadyRunScreen(element: ReactElement): ReturnType<typeof render> {
  const view = render(element);
  const firstRunAction = screen.queryByRole('button', { name: '안내를 확인하고 시작' });
  if (firstRunAction) fireEvent.click(firstRunAction);
  return view;
}

describe('RunScreen', () => {
  it.each(['story', 'endless'] as const)('keeps the %s HUD outside the gameplay stage', (mode) => {
    renderReadyRunScreen(<RunScreen {...audioProps} characterId="player-default" mode={mode}
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
    renderReadyRunScreen(<RunScreen {...audioProps} characterId="hanayo-hiyori" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'play effects' }));
    expect(audioMock.playEffect.mock.calls).toEqual([
      ['jump'], ['double-jump'], ['slide'], ['coin'], ['time-pickup'], ['time-pickup'], ['gate'], ['hit'], ['fall'], ['hiyori-defense'],
    ]);
  });

  it('shows a distinct speed pickup cue, reuses its pickup sound, and clears the cue after 1,200ms', () => {
    vi.useFakeTimers();
    audioMock.playEffect.mockClear();
    renderReadyRunScreen(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'trigger speed pickup' }));
    expect(audioMock.playEffect).toHaveBeenCalledExactlyOnceWith('time-pickup');
    expect(document.querySelector('.runner-hud__bonus')).toHaveTextContent('2.5배 속도 · 3초');
    act(() => vi.advanceTimersByTime(1_199));
    expect(document.querySelector('.runner-hud__bonus')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(document.querySelector('.runner-hud__bonus')).not.toBeInTheDocument();
  });

  it('shows a brief gate speed burst and restarts its duration on another gate', () => {
    vi.useFakeTimers();
    renderReadyRunScreen(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={vi.fn()} />);
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

  it('shows the guide before the first countdown and persists only after starting', () => {
    const firstRun = render(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: '조작법과 아이템 안내' })).toBeInTheDocument();
    expect(screen.getByTestId('run-game')).toHaveAttribute('data-tutorial-enabled', 'true');
    expect(screen.getByTestId('run-game')).toHaveAttribute('data-paused', 'true');
    expect(screen.getByRole('status', { name: '3초 후 시작' })).toBeInTheDocument();
    expect(within(screen.getByRole('dialog', { name: '조작법과 아이템 안내' })).getByText('질주의 메이드')).toBeInTheDocument();
    expect(localStorage.getItem('runner-action:tutorial:v1:seen')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '안내를 확인하고 시작' }));
    expect(localStorage.getItem('runner-action:tutorial:v1:seen')).toBe('1');
    expect(screen.queryByRole('dialog', { name: '조작법과 아이템 안내' })).not.toBeInTheDocument();
    expect(screen.getByTestId('run-game')).toHaveAttribute('data-paused', 'false');
    expect(document.querySelector('.run-screen__help')).not.toBeInTheDocument();
    firstRun.unmount();

    render(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={vi.fn()} />);
    expect(screen.getByTestId('run-game')).toHaveAttribute('data-tutorial-enabled', 'false');
    expect(document.querySelector('.run-screen__help')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /점프/ })).toBeInTheDocument();
  });

  it('pauses, confirms exit without losing the run prematurely, resumes, then exits', () => {
    const onExit = vi.fn();
    renderReadyRunScreen(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={onExit} />);
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

  it('uses Escape to pause and resume without taking over runner movement keys', () => {
    renderReadyRunScreen(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'begin mock run' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(runMock.paused).toBe(true);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(runMock.paused).toBe(false);
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(runMock.paused).toBe(false);
  });

  it('Escape dismisses exit confirmation without exiting or resuming the run', () => {
    const onExit = vi.fn();
    renderReadyRunScreen(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', { name: 'begin mock run' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    const pauseDialog = screen.getByRole('dialog');
    fireEvent.click(within(pauseDialog).getAllByRole('button')[3]);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(runMock.paused).toBe(true);
    expect(onExit).not.toHaveBeenCalled();
  });

  it('opens audio settings from pause and keeps the run paused when settings close', () => {
    renderReadyRunScreen(<RunScreen {...audioProps} characterId="player-default" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'begin mock run' }));
    fireEvent.keyDown(window, { code: 'KeyP' });
    expect(runMock.paused).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '사운드 설정' }));
    expect(screen.getByRole('dialog', { name: '사운드 설정' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '설정 닫기' }));
    expect(screen.getByRole('dialog', { name: /일시 정지/ })).toBeInTheDocument();
    expect(runMock.paused).toBe(true);
  });

  it('reopens the guide from pause and returns to the still-paused game', () => {
    renderReadyRunScreen(<RunScreen {...audioProps} characterId="tokino-mary" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'begin mock run' }));
    fireEvent.keyDown(window, { code: 'KeyP' });
    expect(runMock.paused).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '설명서 보기' }));
    expect(screen.getByRole('dialog', { name: '조작법과 아이템 안내' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /일시 정지/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole('dialog', { name: '조작법과 아이템 안내' })).getByText('음표의 이끌림')).toBeInTheDocument();
    expect(runMock.paused).toBe(true);
    expect(localStorage.getItem('runner-action:tutorial:v1:seen')).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: '일시정지로 돌아가기' }));
    expect(screen.getByRole('dialog', { name: /일시 정지/ })).toBeInTheDocument();
    expect(runMock.paused).toBe(true);
  });

  it('shows Hiyori defense feedback for 1,200ms and clears it when paused', () => {
    vi.useFakeTimers();
    renderReadyRunScreen(<RunScreen {...audioProps} characterId="hanayo-hiyori" onFinish={vi.fn()} onExit={vi.fn()} />);
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
    const view = renderReadyRunScreen(<RunScreen {...audioProps} characterId="hanayo-hiyori" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'begin mock run' }));
    const timersBeforePassive = vi.getTimerCount();
    fireEvent.click(screen.getByRole('button', { name: 'trigger passive' }));
    expect(vi.getTimerCount()).toBe(timersBeforePassive + 1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(timersBeforePassive);
  });
});
