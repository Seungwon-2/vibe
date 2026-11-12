import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { PLAYER_PROFILE_STORAGE_KEY } from './services/LocalPlayerProfileStore';
import { createRunnerSessionKey } from './services/RunnerSessionStore';
import type { RunnerSessionEnvelope } from './game/runner/runnerSessionTypes';

const scope = { kind: 'guest' } as const;
const sessionKey = createRunnerSessionKey(scope);

afterEach(cleanup);
beforeEach(() => {
  localStorage.removeItem(sessionKey);
  localStorage.removeItem(PLAYER_PROFILE_STORAGE_KEY);
  localStorage.removeItem('runner-action:tutorial:v1:seen');
  localStorage.removeItem('runner-audio:preferences:v1');
});

describe('terminal session recovery', () => {
  it('restores a finished run to results and settles its coins exactly once', async () => {
    const finishedAtIso = new Date().toISOString();
    const envelope: RunnerSessionEnvelope = {
      schemaVersion: 1,
      kind: 'terminal',
      savedAt: finishedAtIso,
      accountScope: scope,
      runId: 'terminal-recovery-test',
      payload: {
        characterId: 'player-default',
        mode: 'endless',
        storyStageId: null,
        outcome: 'completed',
        settled: false,
        result: {
          characterId: 'player-default', mode: 'endless', storyStageId: null,
          distanceMeters: 836, coins: 5, durationMs: 20_000, finishedAtIso, finishReason: 'pit',
        },
      },
    };
    localStorage.setItem(sessionKey, JSON.stringify(envelope));

    render(<App />);

    expect(await screen.findByRole('heading', { name: '달리기 종료' })).toBeInTheDocument();
    expect(screen.getByText('836')).toBeInTheDocument();
    expect(screen.getByText('지갑에 코인 5개 적립')).toBeInTheDocument();
    expect(screen.queryByTestId('runner-mock')).not.toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(localStorage.getItem(sessionKey)!).payload.settled).toBe(true));
    const profile = JSON.parse(localStorage.getItem(PLAYER_PROFILE_STORAGE_KEY)!);
    expect(profile.profile.walletCoins).toBe(5);
  });
});
