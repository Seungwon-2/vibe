import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRunnerSnapshot, startRunner } from '../../game/runner/RunnerSimulation';

const runMock = vi.hoisted(() => ({ paused: false }));

vi.mock('../../game/runner/RunnerGame', () => ({
  RunnerGame: ({ paused, onSnapshot }: {
    paused: boolean;
    onSnapshot(snapshot: ReturnType<typeof startRunner>): void;
  }) => {
    runMock.paused = paused;
    return <div data-testid="run-game" data-paused={paused}>
      <button type="button" onClick={() => onSnapshot(startRunner(createRunnerSnapshot('player-default')))}>
        begin mock run
      </button>
    </div>;
  },
}));

import { RunScreen } from './RunScreen';

afterEach(cleanup);

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
});
