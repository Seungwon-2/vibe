import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RunnerFinishOutcome, RunnerResult } from '../../game/runner/runnerTypes';

const mock = vi.hoisted(() => ({
  bridge: null as { consumeFrame(): { jumpPressed: boolean; slideHeld: boolean } } | null,
  paused: false,
  finish: null as ((result: RunnerResult, outcome: RunnerFinishOutcome) => void) | null,
  bestDistance: null as number | null,
}));

vi.mock('../../services/PersonalBestStore', () => ({
  browserPersonalBestStore: { getBest: vi.fn(() => mock.bestDistance === null
    ? null : { distanceMeters: mock.bestDistance }) },
}));

vi.mock('../../game/runner/RunnerGame', () => ({
  RunnerGame: ({ inputBridge, paused, onFinished }: {
    inputBridge: typeof mock.bridge;
    paused: boolean;
    onFinished(result: RunnerResult, outcome: RunnerFinishOutcome): void;
  }) => {
    mock.bridge = inputBridge;
    mock.paused = paused;
    mock.finish = onFinished;
    return <div data-testid="runner-canvas" />;
  },
}));

import { RunnerPreview } from './RunnerPreview';

describe('RunnerPreview', () => {
  it('sends touch buttons through the shared bridge and pauses without remounting', () => {
    const view = render(<RunnerPreview characterId="hanayo-hiyori" onBack={vi.fn()} />);
    expect(screen.getByTestId('runner-canvas')).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole('button', { name: '점프' }));
    expect(mock.bridge?.consumeFrame()).toEqual({ jumpPressed: true, slideHeld: false });
    fireEvent.pointerUp(screen.getByRole('button', { name: '점프' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: '슬라이드' }));
    expect(mock.bridge?.consumeFrame().slideHeld).toBe(true);
    fireEvent.pointerUp(screen.getByRole('button', { name: '슬라이드' }));
    expect(mock.bridge?.consumeFrame().slideHeld).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '일시 정지' }));
    expect(mock.paused).toBe(true);
    view.unmount();
  });

  it('shows a readable personal-best result and resets the run without losing the character', () => {
    mock.bestDistance = null;
    const onBack = vi.fn();
    render(<RunnerPreview characterId="hanayo-hiyori" onBack={onBack} />);
    act(() => mock.finish?.({ characterId: 'hanayo-hiyori', distanceMeters: 1234, coins: 2,
      durationMs: 30_000, finishedAtIso: '2026-10-27T00:00:00.000Z' }, 'personal-best'));
    expect(screen.getByText('새 최고 기록')).toBeInTheDocument();
    expect(screen.getByText('1,234m')).toBeInTheDocument();
    expect(screen.getByText('이전 최고: 기록 없음')).toBeInTheDocument();
    expect(screen.getByText('새 최고 기록').closest('.runner-overlay')).toHaveClass('runner-overlay--result');
    fireEvent.click(screen.getByRole('button', { name: '다시 달리기' }));
    expect(screen.queryByText('새 최고 기록')).not.toBeInTheDocument();
    expect(screen.getByText('Hanayo Hiyori')).toBeInTheDocument();
    act(() => mock.finish?.({ characterId: 'hanayo-hiyori', distanceMeters: 800, coins: 0,
      durationMs: 20_000, finishedAtIso: '2026-10-27T00:00:00.000Z' }, 'completed'));
    expect(screen.getByText('런 종료')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '캐릭터 선택' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows the prior best when the run does not improve it', () => {
    mock.bestDistance = 900;
    render(<RunnerPreview characterId="player-default" onBack={vi.fn()} />);
    act(() => mock.finish?.({ characterId: 'player-default', distanceMeters: 800, coins: 0,
      durationMs: 20_000, finishedAtIso: '2026-10-27T00:00:00.000Z' }, 'completed'));
    expect(screen.getByText('이전 최고: 900m')).toBeInTheDocument();
    mock.bestDistance = null;
  });
});
