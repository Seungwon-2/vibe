import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRunnerEngineCheckpoint } from './game/runner/runnerSessionTestFixtures';
import { AUDIO_PREFERENCES_STORAGE_KEY } from './audio/audioPreferences';

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

const cloudGatewayMock = vi.hoisted(() => ({ getBest: vi.fn() }));

const sessionMock = vi.hoisted(() => ({
  getKey: (scope: { kind: 'guest' } | { kind: 'account'; id: string }) => scope.kind === 'guest'
    ? 'stella-runner:session:v1:guest' : `stella-runner:session:v1:account:${encodeURIComponent(scope.id)}`,
}));

const authMock = vi.hoisted(() => ({
  value: {
    mode: 'local', status: 'signed-in', account: null, error: null,
    signIn: vi.fn(), signOut: vi.fn(), acquireApiToken: vi.fn(),
  } as {
    mode: 'local' | 'cloud' | 'configuration-error';
    status: 'loading' | 'signed-out' | 'signed-in' | 'error';
    account: { homeAccountId: string; name: string; username: string } | null;
    error: string | null;
    apiConsentStatus?: 'checking' | 'available' | 'unavailable' | 'consent-required' | 'error';
    signIn: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    acquireApiToken: ReturnType<typeof vi.fn>;
  },
}));

vi.mock('./services/PersonalBestStore', () => ({
  browserPersonalBestStore: { getBest: vi.fn(() => null) },
}));

vi.mock('./services/LocalRunGateway', () => ({ browserRunGateway: runGatewayMock }));
vi.mock('./services/AuthenticatedRunGateway', async (importOriginal) => {
  const original = await importOriginal<typeof import('./services/AuthenticatedRunGateway')>();
  return { ...original, AuthenticatedRunGateway: class { getBest = cloudGatewayMock.getBest; } };
});
vi.mock('./audio/RunnerAudioManager', () => ({ browserRunnerAudio: audioMock }));
vi.mock('./auth/AuthProvider', () => ({ useRunnerAuth: () => authMock.value }));

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
  cloudGatewayMock.getBest.mockReset().mockResolvedValue(null);
  authMock.value = {
    mode: 'local', status: 'signed-in', account: null, error: null,
    signIn: vi.fn(), signOut: vi.fn(), acquireApiToken: vi.fn(),
  };
  localStorage.removeItem(sessionMock.getKey({ kind: 'guest' }));
  localStorage.removeItem('runner-action:tutorial:v1:seen');
  localStorage.removeItem(AUDIO_PREFERENCES_STORAGE_KEY);
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
  it('opens story stage selection from the character detail start button', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /달리기 시작/ }));
    fireEvent.click(screen.getByRole('button', { name: /스토리 스테이지/ }));
    fireEvent.click(screen.getByRole('button', { name: '하나요 히요리' }));
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
    expect(screen.getByRole('heading', { name: '달릴 스테이지를 선택하세요' })).toBeInTheDocument();
  });

  it('keeps local best hidden while login records resolve and the cloud best loads', async () => {
    const oldLocalBest = { rank: 1, displayName: 'Local Player', characterId: 'player-default',
      distanceMeters: 17687, coins: 12, finishedAtIso: '2026-11-13T00:00:00.000Z' };
    runGatewayMock.getBest.mockResolvedValue(oldLocalBest);
    let resolveCloudBest!: (value: typeof oldLocalBest) => void;
    cloudGatewayMock.getBest.mockReturnValue(new Promise((resolve) => { resolveCloudBest = resolve; }));
    authMock.value = { ...authMock.value, mode: 'cloud', status: 'signed-in', apiConsentStatus: 'checking',
      account: { homeAccountId: 'employee-1', name: 'Employee One', username: 'employee@example.test' } };
    const { rerender } = render(<App />);
    expect(screen.getByText('기록 불러오는 중…')).toBeInTheDocument();
    expect(screen.queryByText(/17,687/)).not.toBeInTheDocument();
    expect(runGatewayMock.getBest).not.toHaveBeenCalled();
    authMock.value = { ...authMock.value, apiConsentStatus: 'available' };
    rerender(<App />);
    await waitFor(() => expect(cloudGatewayMock.getBest).toHaveBeenCalledOnce());
    expect(screen.getByText('기록 불러오는 중…')).toBeInTheDocument();
    await act(async () => resolveCloudBest({ ...oldLocalBest, displayName: 'Employee One', distanceMeters: 837 }));
    expect(await screen.findByText(/내 최고 기록 837m/)).toBeInTheDocument();
    expect(screen.queryByText(/17,687/)).not.toBeInTheDocument();
    expect(runGatewayMock.getBest).not.toHaveBeenCalled();
  });

  it('hides the previous account best immediately when another account signs in', async () => {
    let resolveNextBest!: (value: null) => void;
    cloudGatewayMock.getBest.mockResolvedValueOnce({ rank: 1, displayName: 'First Runner', characterId: 'player-default',
      distanceMeters: 17687, coins: 12, finishedAtIso: '2026-11-13T00:00:00.000Z' })
      .mockReturnValueOnce(new Promise((resolve) => { resolveNextBest = resolve; }));
    authMock.value = { ...authMock.value, mode: 'cloud', status: 'signed-in', apiConsentStatus: 'available',
      account: { homeAccountId: 'employee-1', name: 'First Runner', username: 'first@example.test' } };
    const { rerender } = render(<App />);
    expect(await screen.findByText(/17,687m/)).toBeInTheDocument();
    authMock.value = { ...authMock.value,
      account: { homeAccountId: 'employee-2', name: 'Second Runner', username: 'second@example.test' } };
    rerender(<App />);
    expect(screen.queryByText(/17,687/)).not.toBeInTheDocument();
    expect(screen.getByText('기록 불러오는 중…')).toBeInTheDocument();
    await act(async () => resolveNextBest(null));
    expect(await screen.findByText(/내 기록이 없습니다/)).toBeInTheDocument();
  });
  it('keeps cloud-authenticated runs and rankings local while preserving account controls', async () => {
    const signOut = vi.fn();
    const acquireApiToken = vi.fn();
    authMock.value = {
      mode: 'cloud', status: 'signed-in',
      account: { homeAccountId: 'employee-1', name: 'Employee One', username: 'employee@example.test' },
      error: null, signIn: vi.fn(), signOut, acquireApiToken,
    };
    render(<App />);

    expect(await screen.findByText(/이 브라우저에 저장된 기록이 없습니다/)).toBeInTheDocument();
    expect(screen.getByText('Employee One')).toBeInTheDocument();
    expect(screen.getByText('employee@example.test')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(signOut).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: '이 브라우저 기록 보기' }));
    expect(await screen.findByRole('heading', { name: '로컬 기록' })).toBeInTheDocument();
    expect(await screen.findByText('이 브라우저에 저장된 기록입니다. 거리 순으로 정렬하고, 거리가 같으면 코인 수로 순위를 정합니다.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '← 타이틀로' }));

    openEndlessCharacterSelect();
    fireEvent.click(screen.getByRole('button', { name: '아오쿠모 린' }));
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
    expect(await screen.findByTestId('runner-mock')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'mock time out' }));
    await waitFor(() => expect(runGatewayMock.submitRun).toHaveBeenCalledOnce());
    expect(acquireApiToken).not.toHaveBeenCalled();
  });

  it('still requires company sign-in before starting in cloud mode', () => {
    const signIn = vi.fn();
    authMock.value = { mode: 'cloud', status: 'signed-out', account: null, error: null,
      signIn, signOut: vi.fn(), acquireApiToken: vi.fn() };
    render(<App />);

    expect(document.querySelector<HTMLButtonElement>('.home-start')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '회사 계정으로 로그인' }));
    expect(signIn).toHaveBeenCalledOnce();
  });

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
        snapshot, engine: createRunnerEngineCheckpoint() },
    }));
    render(<App />);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('이어 달릴까요?');
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
    expect(JSON.parse(localStorage.getItem(AUDIO_PREFERENCES_STORAGE_KEY)!)).toMatchObject({ effectsVolume: 0.3 });
    expect(audioMock.setPreferences).toHaveBeenLastCalledWith(expect.objectContaining({ effectsVolume: 0.3 }));
  });

  it('shows menu controls before the first run and hides them after returning', async () => {
    render(<App />);
    expect(document.querySelector('.main-menu-help')).toBeInTheDocument();
    openEndlessCharacterSelect();
    fireEvent.click(screen.getByRole('button', { name: '하나요 히요리' }));
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
    expect(await screen.findByTestId('runner-mock')).toHaveAttribute('data-tutorial-enabled', 'true');
    fireEvent.click(screen.getByRole('button', { name: '안내를 확인하고 시작' }));
    expect(localStorage.getItem('runner-action:tutorial:v1:seen')).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: '일시정지' }));
    fireEvent.click(screen.getByRole('button', { name: '나가기' }));
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
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
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
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
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
    fireEvent.click(screen.getByRole('button', { name: '이 브라우저 기록 보기' }));
    expect(screen.getByRole('heading', { name: '로컬 기록' })).toBeInTheDocument();
    expect(await screen.findByText(/하나요 히요리/)).toBeInTheDocument();
    expect(screen.getByText('1,250m')).toBeInTheDocument();
    expect(runGatewayMock.getRanking).toHaveBeenCalledOnce();
    expect(screen.queryByText(/월드 선택|스테이지 선택|체크포인트/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '← 타이틀로' }));
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
    expect(screen.getByRole('heading', { name: '어떤 모험을 할까요?' })).toBeInTheDocument();
  });

  it('keeps the result available and shows a message when run submission fails', async () => {
    runGatewayMock.submitRun.mockRejectedValueOnce(new Error('storage denied'));
    render(<App />);
    openEndlessCharacterSelect();
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
    fireEvent.click(screen.getByRole('button', { name: 'mock time out' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('기록을 저장하지 못했습니다');
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '같은 캐릭터로 다시 달리기' })).toBeEnabled();
  });

  it('does not label a successful save as failed when the separate best lookup fails', async () => {
    render(<App />);
    openEndlessCharacterSelect();
    fireEvent.click(screen.getByRole('button', { name: '달리기 시작' }));
    await screen.findByTestId('runner-mock');
    runGatewayMock.getBest.mockRejectedValueOnce(new Error('best lookup unavailable'));
    fireEvent.click(screen.getByRole('button', { name: 'mock time out' }));
    expect(await screen.findByText('1위')).toBeInTheDocument();
    await waitFor(() => expect(runGatewayMock.getBest).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/최고 기록 조회 안내:/)).toBeInTheDocument();
    expect(runGatewayMock.submitRun).toHaveBeenCalledOnce();
  });
});
