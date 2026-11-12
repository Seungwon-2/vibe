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

const audioMock = vi.hoisted(() => ({
  unlock: vi.fn(),
  setPreferences: vi.fn(),
  playEffect: vi.fn(),
}));

const sessionMock = vi.hoisted(() => ({
  getKey: (scope: { kind: 'guest' } | { kind: 'account'; id: string }) => scope.kind === 'guest'
    ? 'stella-runner:session:v1:guest' : `stella-runner:session:v1:account:${encodeURIComponent(scope.id)}`,
}));

vi.mock('./services/PersonalBestStore', () => ({
  browserPersonalBestStore: { getBest: vi.fn(() => null) },
}));

vi.mock('./services/LocalRunGateway', () => ({ browserRunGateway: runGatewayMock }));
vi.mock('./audio/RunnerAudioManager', () => ({ browserRunnerAudio: audioMock }));

vi.mock('./game/runner/RunnerGame', async () => {
  const React = await import('react');
  return {
    RunnerGame: ({ characterId, tutorialEnabled, paused, initialSession, onFinished }: {
      characterId: string;
      tutorialEnabled: boolean;
      paused?: boolean;
      initialSession?: { snapshot: { distanceMeters: number } } | null;
      onFinished(result: { characterId: string; distanceMeters: number; coins: number; durationMs: number; finishedAtIso: string }, outcome: 'personal-best' | 'completed'): void;
    }) => {
      React.useEffect(() => {
        runnerMock.mounts += 1;
        return () => { runnerMock.destroys += 1; };
      }, []);
      runnerMock.finish = (id, outcome) => onFinished({ characterId: id, distanceMeters: 1250,
        coins: 4, durationMs: 90_000, finishedAtIso: '2026-10-27T00:00:00.000Z' }, outcome);
      return <div data-testid="runner-mock" data-character={characterId}
        data-tutorial-enabled={tutorialEnabled} data-paused={paused}
        data-session-distance={initialSession?.snapshot.distanceMeters}>
        <button type="button" onClick={() => runnerMock.finish?.(characterId, 'personal-best')}>mock time out</button>
      </div>;
    },
  };
});

import App from './App';

function openEndlessCharacterSelect(): void {
  fireEvent.click(document.querySelector('.home-start')!);
  fireEvent.click(document.querySelector('.mode-option--endless')!);
}

afterEach(cleanup);
beforeEach(() => {
  localStorage.removeItem(sessionMock.getKey({ kind: 'guest' }));
  localStorage.removeItem('runner-action:tutorial:v1:seen');
  localStorage.removeItem('runner-audio:preferences:v1');
  runnerMock.finish = null;
  runnerMock.mounts = 0;
  runnerMock.destroys = 0;
  runGatewayMock.getBest.mockResolvedValue(null);
  runGatewayMock.getRanking.mockResolvedValue([]);
  runGatewayMock.submitRun.mockImplementation(async (result: {
    characterId: string; distanceMeters: number; coins: number; durationMs: number; finishedAtIso: string;
  }) => ({ savedRun: { ...result, id: 'run-1', rank: 1, mode: 'endless', storyStageId: null,
    finishReason: 'timeout', hitsTaken: 0, passedGateCount: 0, completedStage: false },
    personalBest: { rank: 1, displayName: 'Local Player', characterId: 'hanayo-hiyori',
      distanceMeters: 1250, coins: 4, finishedAtIso: '2026-10-27T00:00:00.000Z' }, personalBestUpdated: true }));
  runGatewayMock.getBest.mockClear();
  runGatewayMock.getRanking.mockClear();
  runGatewayMock.submitRun.mockClear();
  audioMock.unlock.mockClear();
  audioMock.setPreferences.mockClear();
  audioMock.playEffect.mockClear();
});

describe('App flow', () => {
  it('offers to resume an active checkpoint and restores it paused without countdown', async () => {
    const savedAt = new Date().toISOString();
    const snapshot = {
      phase: 'paused', characterId: 'player-default', mode: 'endless', storyStageId: null,
      speedPickupRemainingMs: 0, elapsedMs: 1_000, remainingMs: 89_000, distanceMeters: 240,
      worldDistance: 240, speedUnitsPerSecond: 255, coins: 3, giantRemainingMs: 0,
      collectedPickupIds: [], passedGateIds: [], staggerRemainingMs: 0, protectionRemainingMs: 0,
      passiveChargesRemaining: 0, passiveEffectRemainingMs: 0, slideGuardRemainingMs: 0,
      slideGuardCooldownRemainingMs: 0, biomeId: 'dawn-city', finishedAtElapsedMs: null,
      finishReason: null, startedAtIso: savedAt, finishedAtIso: null,
    };
    localStorage.setItem(sessionMock.getKey({ kind: 'guest' }), JSON.stringify({
      schemaVersion: 1, kind: 'active', savedAt, accountScope: { kind: 'guest' }, runId: 'resume-test',
      payload: { characterId: 'player-default', mode: 'endless', storyStageId: null,
        snapshot, engine: { version: 1 } },
    }));
    render(<App />);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('이어서 달릴까요?');
    expect(screen.getByRole('button', { name: '새로 시작' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '이어하기' }));
    expect(await screen.findByTestId('runner-mock')).toHaveAttribute('data-paused', 'true');
    expect(screen.getByTestId('runner-mock')).toHaveAttribute('data-session-distance', '240');
    expect(screen.getByTestId('runner-mock')).toHaveAttribute('data-tutorial-enabled', 'false');
  });

  it('opens sound settings, unlocks effects on a user gesture, and persists effect volume', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /사운드 설정/ }));
    expect(audioMock.unlock).toHaveBeenCalled();
    expect(audioMock.playEffect).toHaveBeenCalledWith('ui-click');
    fireEvent.change(screen.getByRole('slider', { name: /효과음 크기/ }), { target: { value: '0.3' } });
    expect(JSON.parse(localStorage.getItem('runner-audio:preferences:v1')!)).toMatchObject({ effectsVolume: 0.3 });
    expect(audioMock.setPreferences).toHaveBeenLastCalledWith(expect.objectContaining({ effectsVolume: 0.3 }));
  });

  it('shows menu controls before the first run and hides them after returning', async () => {
    render(<App />);
    expect(document.querySelector('.main-menu-help')).toBeInTheDocument();
    openEndlessCharacterSelect();
    fireEvent.click(screen.getByRole('button', { name: '하나요 히요리' }));
    fireEvent.click(document.querySelector('.selector-footer .selector-confirm')!);
    expect(await screen.findByTestId('runner-mock')).toHaveAttribute('data-tutorial-enabled', 'true');
    fireEvent.click(screen.getByRole('button', { name: '안내를 확인하고 시작' }));
    expect(localStorage.getItem('runner-action:tutorial:v1:seen')).toBe('1');

    const header = screen.getByRole('banner');
    fireEvent.click(header.querySelector('button')!);
    const confirmation = screen.getByRole('alertdialog');
    fireEvent.click(confirmation.querySelector('button')!);
    expect(document.querySelector('.main-menu-help')).not.toBeInTheDocument();
  });

  it('connects menu, character selection, results, one submitted run, and a same-character retry', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: '스텔라 러너' })).toBeInTheDocument();
    fireEvent.click(document.querySelector('.home-start')!);
    fireEvent.click(document.querySelector('.mode-option--endless')!);
    expect(screen.getByRole('heading', { name: '누구와 달려볼까요?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '하나요 히요리' }));
    fireEvent.click(document.querySelector('.selector-footer .selector-confirm')!);
    expect(await screen.findByTestId('runner-mock')).toHaveAttribute('data-character', 'hanayo-hiyori');
    expect(screen.getByRole('region', { name: '러닝 게임 화면' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'mock time out' }));
    expect(screen.getByRole('heading', { name: '새로운 최고 기록!' })).toBeInTheDocument();
    expect(screen.getByTestId('character-preview-hanayo-hiyori')).toHaveAttribute('data-animation', 'victory');
    expect(await screen.findByText('통합 랭킹')).toBeInTheDocument();
    expect(await screen.findByText('1위')).toBeInTheDocument();
    expect(runGatewayMock.submitRun).toHaveBeenCalledOnce();
    expect(runnerMock.destroys).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: '같은 캐릭터로 다시 달리기' }));
    expect(await screen.findByTestId('runner-mock')).toHaveAttribute('data-character', 'hanayo-hiyori');
    expect(runnerMock.mounts).toBe(2);
    expect(runnerMock.destroys).toBe(1);
  });

  it('submits a repeated finish callback only once', async () => {
    render(<App />);
    openEndlessCharacterSelect();
    fireEvent.click(screen.getByRole('button', { name: '하나요 히요리' }));
    fireEvent.click(document.querySelector('.selector-footer .selector-confirm')!);
    await screen.findByTestId('runner-mock');
    await act(async () => {
      runnerMock.finish?.('hanayo-hiyori', 'personal-best');
      runnerMock.finish?.('hanayo-hiyori', 'personal-best');
    });
    await waitFor(() => expect(runGatewayMock.submitRun).toHaveBeenCalledOnce());
  });

  it('loads the unified top-ten list from the menu and keeps stage routes out of the app flow', async () => {
    runGatewayMock.getRanking.mockResolvedValue([{
      rank: 1, displayName: 'Runner A', characterId: 'hanayo-hiyori', distanceMeters: 1250, coins: 4,
      finishedAtIso: '2026-10-27T00:00:00.000Z',
    }]);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '로컬 기록 보기' }));
    expect(screen.getByRole('heading', { name: '로컬 기록' })).toBeInTheDocument();
    expect(await screen.findByText(/하나요 히요리/)).toBeInTheDocument();
    expect(screen.getByText('1,250m')).toBeInTheDocument();
    expect(runGatewayMock.getRanking).toHaveBeenCalledOnce();
    expect(screen.queryByText(/월드 선택|스테이지 선택|체크포인트/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '메인 메뉴로' }));
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
    expect(screen.getByRole('heading', { name: '어떤 모험을 할까요?' })).toBeInTheDocument();
  });

  it('keeps the result available and shows a message when run submission fails', async () => {
    runGatewayMock.submitRun.mockRejectedValueOnce(new Error('storage denied'));
    render(<App />);
    openEndlessCharacterSelect();
    fireEvent.click(document.querySelector('.selector-footer .selector-confirm')!);
    fireEvent.click(screen.getByRole('button', { name: 'mock time out' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('기록을 저장하지 못했습니다');
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '같은 캐릭터로 다시 달리기' })).toBeEnabled();
  });
});
