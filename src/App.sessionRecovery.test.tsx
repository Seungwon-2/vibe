import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { PLAYER_PROFILE_STORAGE_KEY } from './services/LocalPlayerProfileStore';
import { createRunnerSessionKey } from './services/RunnerSessionStore';
import type { RunnerSessionEnvelope } from './game/runner/runnerSessionTypes';
import { createRunnerEngineCheckpoint } from './game/runner/runnerSessionTestFixtures';

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

describe('active session recovery prompt', () => {
  it('can be dismissed without deleting the saved run and returns after remount', async () => {
    const savedAt = new Date().toISOString();
    const envelope: RunnerSessionEnvelope = {
      schemaVersion: 1,
      kind: 'active',
      savedAt,
      accountScope: scope,
      runId: 'active-recovery-dismiss-test',
      payload: {
        characterId: 'player-default',
        mode: 'endless',
        storyStageId: null,
        snapshot: {
          phase: 'paused', characterId: 'player-default', mode: 'endless', storyStageId: null,
          speedPickupRemainingMs: 0, elapsedMs: 1_000, remainingMs: 89_000, distanceMeters: 240,
          worldDistance: 240, speedUnitsPerSecond: 255, coins: 3, giantRemainingMs: 0,
          collectedPickupIds: [], passedGateIds: [], staggerRemainingMs: 0, protectionRemainingMs: 0,
          passiveChargesRemaining: 0, passiveEffectRemainingMs: 0, slideGuardRemainingMs: 0,
          slideGuardCooldownRemainingMs: 0, biomeId: 'dawn-city', finishedAtElapsedMs: null,
          finishReason: null, startedAtIso: savedAt, finishedAtIso: null,
        },
        engine: createRunnerEngineCheckpoint(),
      },
    };
    const serializedEnvelope = JSON.stringify(envelope);
    localStorage.setItem(sessionKey, serializedEnvelope);

    const view = render(<App />);
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(localStorage.getItem(sessionKey)).toBe(serializedEnvelope);

    view.unmount();
    render(<App />);
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(dialog).not.toBeInTheDocument();
    expect(localStorage.getItem(sessionKey)).toBe(serializedEnvelope);
  });
});
