import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRunnerSnapshot, startRunner } from '../../game/runner/RunnerSimulation';
import type { RunnerEvent } from '../../game/runner/runnerEvents';

const runMock = vi.hoisted(() => ({ paused: false }));

vi.mock('../../game/runner/RunnerGame', () => ({
  RunnerGame: ({ paused, onSnapshot, onEvent }: {
    paused: boolean;
    onSnapshot(snapshot: ReturnType<typeof startRunner>): void;
    onEvent(event: RunnerEvent): void;
  }) => {
    runMock.paused = paused;
    return <div data-testid="run-game" data-paused={paused}>
      <button type="button" onClick={() => {
        onSnapshot(startRunner(createRunnerSnapshot('player-default')));
        onEvent({ type: 'countdown', value: 0 });
      }}>
        begin mock run
      </button>
      <button type="button" onClick={() => onEvent({ type: 'passive-triggered', passiveId: 'hiyori-guard',
        remainingCharges: 1, trigger: 'pit' })}>trigger passive</button>
    </div>;
  },
}));

import { RunScreen } from './RunScreen';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('RunScreen', () => {
  it('pauses, confirms exit without losing the run prematurely, resumes, then exits', () => {
    const onExit = vi.fn();
    render(<RunScreen characterId="player-default" onFinish={vi.fn()} onExit={onExit} />);
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

  it('shows Hiyori defense feedback for 1,200ms and clears it when paused', () => {
    vi.useFakeTimers();
    render(<RunScreen characterId="hanayo-hiyori" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'begin mock run' }));
    fireEvent.click(screen.getByRole('button', { name: 'trigger passive' }));
    expect(screen.getByRole('status')).toHaveTextContent('유령의 수호 · 낭떠러지 방어 · 남은 1회');
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
    const view = render(<RunScreen characterId="hanayo-hiyori" onFinish={vi.fn()} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'trigger passive' }));
    expect(vi.getTimerCount()).toBe(1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
