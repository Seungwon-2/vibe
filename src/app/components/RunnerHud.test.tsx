import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCharacter } from '../../game/characters/characterCatalog';
import { createRunnerSnapshot, startRunner } from '../../game/runner/RunnerSimulation';
import type { RunnerSnapshot } from '../../game/runner/runnerTypes';
import { CountdownOverlay } from './CountdownOverlay';
import { PauseOverlay } from './PauseOverlay';
import { RunnerHud } from './RunnerHud';

afterEach(cleanup);

describe('RunnerHud', () => {
  const snapshot = (overrides: Partial<RunnerSnapshot> = {}) => ({
    ...startRunner(createRunnerSnapshot('hanayo-hiyori')),
    distanceMeters: 61,
    coins: 2,
    ...overrides,
  });

  it('shows current run information and an accessible passive label', () => {
    const onPause = vi.fn();
    render(<RunnerHud snapshot={snapshot()} character={getCharacter('hanayo-hiyori')}
      recentBonus={null} onPause={onPause} />);
    expect(screen.getByText('1:30')).toBeInTheDocument();
    expect(screen.getByText('61')).toBeInTheDocument();
    expect(screen.getByLabelText('코인 2개')).toBeInTheDocument();
    expect(screen.getByText(/새벽 도심 · 다음 보너스까지 2,439m/)).toBeInTheDocument();
    expect(screen.getByText(/아이템 수집 범위 증가/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '일시정지' }));
    expect(onPause).toHaveBeenCalledOnce();
  });

  it('warns at ten seconds, hides zero rewards, and shows actual awarded bonus only', () => {
    const { rerender } = render(<RunnerHud snapshot={snapshot({ remainingMs: 10_000 })}
      character={getCharacter('player-default')} recentBonus={{ id: 'capped', kind: 'pickup', awardedMs: 0 }}
      onPause={vi.fn()} />);
    expect(screen.getByText('0:10').parentElement).toHaveClass('is-warning');
    expect(screen.queryByText('+0초')).not.toBeInTheDocument();
    rerender(<RunnerHud snapshot={snapshot()} character={getCharacter('player-default')}
      recentBonus={{ id: 'time-coin', kind: 'pickup', awardedMs: 4_000 }} onPause={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('+4초');
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });
});

describe('overlays', () => {
  it('renders countdown values and hides the overlay at zero', () => {
    const { rerender } = render(<CountdownOverlay value={3} />);
    expect(screen.getByRole('status', { name: '3초 후 시작' })).toBeInTheDocument();
    rerender(<CountdownOverlay value={0} />);
    expect(screen.queryByRole('status', { name: /초 후 시작/ })).not.toBeInTheDocument();
  });

  it('prevents resuming in portrait but provides resume and exit in landscape', () => {
    const onResume = vi.fn();
    const onExit = vi.fn();
    const { rerender } = render(<PauseOverlay onResume={onResume} onExit={onExit} portrait />);
    expect(screen.getByRole('button', { name: '계속하기' })).toBeDisabled();
    rerender(<PauseOverlay onResume={onResume} onExit={onExit} portrait={false} />);
    fireEvent.click(screen.getByRole('button', { name: '계속하기' }));
    fireEvent.click(screen.getByRole('button', { name: '나가기' }));
    expect(onResume).toHaveBeenCalledOnce();
    expect(onExit).toHaveBeenCalledOnce();
  });
});
