import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RunnerInputBridge } from '../../game/runner/RunnerInput';
import { createRunnerSnapshot, startRunner } from '../../game/runner/RunnerSimulation';
import type { RunnerFinishOutcome, RunnerResult, RunnerSnapshot } from '../../game/runner/runnerTypes';
import type { RunnerEvent } from '../../game/runner/runnerEvents';

const mock = vi.hoisted(() => ({
  bridge: null as RunnerInputBridge | null,
  paused: false,
  finish: null as ((result: RunnerResult, outcome: RunnerFinishOutcome) => void) | null,
  onEvent: null as ((event: RunnerEvent) => void) | null,
  onSnapshot: null as ((snapshot: RunnerSnapshot) => void) | null,
  bestDistance: null as number | null,
}));

vi.mock('../../services/PersonalBestStore', () => ({
  browserPersonalBestStore: { getBest: vi.fn(() => mock.bestDistance === null
    ? null : { distanceMeters: mock.bestDistance }) },
}));

vi.mock('../../game/runner/RunnerGame', () => ({
  RunnerGame: ({ inputBridge, paused, onFinished, onEvent, onSnapshot }: {
    inputBridge: RunnerInputBridge;
    paused: boolean;
    onFinished(result: RunnerResult, outcome: RunnerFinishOutcome): void;
    onEvent(event: RunnerEvent): void;
    onSnapshot(snapshot: RunnerSnapshot): void;
  }) => {
    mock.bridge = inputBridge;
    mock.paused = paused;
    mock.finish = onFinished;
    mock.onEvent = onEvent;
    mock.onSnapshot = onSnapshot;
    return <div data-testid="runner-canvas" />;
  },
}));

import { RunnerPreview } from './RunnerPreview';

afterEach(cleanup);

describe('RunnerPreview', () => {
  it('sends touch controls through the shared input bridge and resumes from pause without remounting', () => {
    const view = render(<RunnerPreview characterId="hanayo-hiyori" onBack={vi.fn()} />);
    expect(screen.getByTestId('runner-canvas')).toBeInTheDocument();
    act(() => mock.onSnapshot?.(startRunner(createRunnerSnapshot('hanayo-hiyori'))));
    fireEvent.pointerDown(screen.getByRole('button', { name: '점프' }));
    expect(mock.bridge?.consumeFrame()).toEqual({ jumpPressed: true, slideHeld: false });
    fireEvent.pointerUp(screen.getByRole('button', { name: '점프' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: '슬라이딩' }));
    expect(mock.bridge?.consumeFrame().slideHeld).toBe(true);
    fireEvent.pointerCancel(screen.getByRole('button', { name: '슬라이딩' }));
    expect(mock.bridge?.consumeFrame().slideHeld).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '일시 정지' }));
    expect(mock.paused).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '계속하기' }));
    expect(mock.paused).toBe(false);
    view.unmount();
  });

  it('shows the 3-2-1 countdown and only displays a bonus announced by the runner event', () => {
    render(<RunnerPreview characterId="player-default" onBack={vi.fn()} />);
    expect(screen.getByRole('status', { name: '3초 후 시작' })).toBeInTheDocument();
    act(() => mock.onEvent?.({ type: 'countdown', value: 2 }));
    expect(screen.getByRole('status', { name: '2초 후 시작' })).toBeInTheDocument();
    act(() => mock.onEvent?.({ type: 'countdown', value: 0 }));
    expect(screen.queryByRole('status', { name: '2초 후 시작' })).not.toBeInTheDocument();
    expect(screen.queryByText('+3초')).not.toBeInTheDocument();
    act(() => mock.onEvent?.({ type: 'pickup', pickupId: 'time-1', kind: 'time', awardedMs: 3_000 }));
    expect(screen.getByRole('status')).toHaveTextContent('+3초');
    act(() => mock.onEvent?.({ type: 'pickup', pickupId: 'capped-time', kind: 'time', awardedMs: 0 }));
    expect(screen.queryByText('+0초')).not.toBeInTheDocument();
  });

  it('shows a readable personal-best result and restarts without losing the character', () => {
    mock.bestDistance = null;
    const onBack = vi.fn();
    render(<RunnerPreview characterId="hanayo-hiyori" onBack={onBack} />);
    act(() => mock.finish?.({ characterId: 'hanayo-hiyori', distanceMeters: 1234, coins: 2,
      durationMs: 30_000, finishedAtIso: '2026-10-27T00:00:00.000Z' }, 'personal-best'));
    expect(screen.getByText('새 최고 기록')).toBeInTheDocument();
    expect(screen.getByText('1,234m')).toBeInTheDocument();
    expect(screen.getByText('이전 최고: 기록 없음')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 달리기' }));
    expect(screen.queryByText('새 최고 기록')).not.toBeInTheDocument();
    expect(screen.getByText('Hanayo Hiyori')).toBeInTheDocument();
    act(() => mock.finish?.({ characterId: 'hanayo-hiyori', distanceMeters: 800, coins: 0,
      durationMs: 20_000, finishedAtIso: '2026-10-27T00:00:00.000Z' }, 'completed'));
    expect(screen.getByText('런 종료')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '캐릭터 선택' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('pauses in portrait and keeps the pause overlay when landscape returns', () => {
    const originalMatchMedia = window.matchMedia;
    let portrait = false;
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({
      get matches() { return portrait; },
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })) });
    const view = render(<RunnerPreview characterId="player-default" onBack={vi.fn()} />);
    portrait = true;
    act(() => window.dispatchEvent(new Event('orientationchange')));
    expect(screen.getByText('화면을 가로로 돌려 주세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '계속하기' })).toBeDisabled();
    portrait = false;
    act(() => window.dispatchEvent(new Event('orientationchange')));
    expect(screen.getByText('일시 정지')).toBeInTheDocument();
    expect(mock.paused).toBe(true);
    view.unmount();
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  });
});
