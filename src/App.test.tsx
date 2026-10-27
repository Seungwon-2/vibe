import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runnerMock = vi.hoisted(() => ({
  finish: null as ((characterId: string, outcome: 'personal-best' | 'completed') => void) | null,
  mounts: 0,
  destroys: 0,
}));

const runGatewayMock = vi.hoisted(() => ({
  getBest: vi.fn(),
  getRanking: vi.fn(),
  submitRun: vi.fn(),
}));

vi.mock('./services/PersonalBestStore', () => ({
  browserPersonalBestStore: { getBest: vi.fn(() => null) },
}));

vi.mock('./services/LocalRunGateway', () => ({ browserRunGateway: runGatewayMock }));

vi.mock('./game/runner/RunnerGame', async () => {
  const React = await import('react');
  return {
    RunnerGame: ({ characterId, onFinished }: {
      characterId: string;
      onFinished(result: { characterId: string; distanceMeters: number; coins: number; durationMs: number; finishedAtIso: string }, outcome: 'personal-best' | 'completed'): void;
    }) => {
      React.useEffect(() => {
        runnerMock.mounts += 1;
        return () => { runnerMock.destroys += 1; };
      }, []);
      runnerMock.finish = (id, outcome) => onFinished({ characterId: id, distanceMeters: 1250,
        coins: 4, durationMs: 90_000, finishedAtIso: '2026-10-27T00:00:00.000Z' }, outcome);
      return <div data-testid="runner-mock" data-character={characterId}>
        <button type="button" onClick={() => runnerMock.finish?.(characterId, 'personal-best')}>mock time out</button>
      </div>;
    },
  };
});

import App from './App';

afterEach(cleanup);
beforeEach(() => {
  runnerMock.finish = null;
  runnerMock.mounts = 0;
  runnerMock.destroys = 0;
  runGatewayMock.getBest.mockResolvedValue(null);
  runGatewayMock.getRanking.mockResolvedValue([]);
  runGatewayMock.submitRun.mockImplementation(async (result: {
    characterId: string; distanceMeters: number; coins: number; durationMs: number; finishedAtIso: string;
  }) => ({ ...result, id: 'run-1', rank: 1 }));
  runGatewayMock.getBest.mockClear();
  runGatewayMock.getRanking.mockClear();
  runGatewayMock.submitRun.mockClear();
});

describe('App flow', () => {
  it('connects menu, character selection, results, one submitted run, and a same-character retry', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: '바람과 빛의 러너' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
    expect(screen.getByRole('heading', { name: '캐릭터 선택' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hanayo Hiyori' }));
    fireEvent.click(screen.getByRole('button', { name: '선택한 캐릭터로 달리기 시작' }));
    expect(screen.getByTestId('runner-mock')).toHaveAttribute('data-character', 'hanayo-hiyori');
    expect(screen.getByRole('region', { name: '러닝 게임 화면' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'mock time out' }));
    expect(screen.getByRole('heading', { name: '새로운 최고 기록!' })).toBeInTheDocument();
    expect(screen.getByTestId('character-preview-hanayo-hiyori')).toHaveAttribute('data-animation', 'victory');
    expect(await screen.findByText('통합 랭킹')).toBeInTheDocument();
    expect(await screen.findByText('1위')).toBeInTheDocument();
    expect(runGatewayMock.submitRun).toHaveBeenCalledOnce();
    expect(runnerMock.destroys).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: '같은 캐릭터로 다시 달리기' }));
    expect(screen.getByTestId('runner-mock')).toHaveAttribute('data-character', 'hanayo-hiyori');
    expect(runnerMock.mounts).toBe(2);
    expect(runnerMock.destroys).toBe(1);
  });

  it('submits a repeated finish callback only once', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hanayo Hiyori' }));
    fireEvent.click(screen.getByRole('button', { name: '선택한 캐릭터로 달리기 시작' }));
    await act(async () => {
      runnerMock.finish?.('hanayo-hiyori', 'personal-best');
      runnerMock.finish?.('hanayo-hiyori', 'personal-best');
    });
    await waitFor(() => expect(runGatewayMock.submitRun).toHaveBeenCalledOnce());
  });

  it('loads the unified top-ten list from the menu and keeps stage routes out of the app flow', async () => {
    runGatewayMock.getRanking.mockResolvedValue([{
      id: 'run-1', characterId: 'hanayo-hiyori', distanceMeters: 1250, coins: 4,
      durationMs: 90_000, finishedAtIso: '2026-10-27T00:00:00.000Z', rank: 1,
    }]);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '로컬 기록 보기' }));
    expect(screen.getByRole('heading', { name: '로컬 랭킹' })).toBeInTheDocument();
    expect(await screen.findByText('Hanayo Hiyori')).toBeInTheDocument();
    expect(screen.getByText('1,250m')).toBeInTheDocument();
    expect(runGatewayMock.getRanking).toHaveBeenCalledOnce();
    expect(screen.queryByText(/월드 선택|스테이지 선택|체크포인트/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '메인 메뉴로' }));
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
    expect(screen.getByRole('heading', { name: '캐릭터 선택' })).toBeInTheDocument();
  });

  it('keeps the result available and shows a message when run submission fails', async () => {
    runGatewayMock.submitRun.mockRejectedValueOnce(new Error('storage denied'));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
    fireEvent.click(screen.getByRole('button', { name: '선택한 캐릭터로 달리기 시작' }));
    fireEvent.click(screen.getByRole('button', { name: 'mock time out' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('기록을 저장하지 못했습니다');
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '같은 캐릭터로 다시 달리기' })).toBeEnabled();
  });
});
