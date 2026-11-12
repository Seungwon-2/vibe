import { describe, expect, it } from 'vitest';
import type { CharacterId } from '../game/characters/characterTypes';
import type { RunnerSessionEnvelope, RunnerSessionScope } from '../game/runner/runnerSessionTypes';
import { createRunnerEngineCheckpoint } from '../game/runner/runnerSessionTestFixtures';
import { BrowserRunnerSessionStore, createRunnerSessionKey, RUNNER_SESSION_TTL_MS } from './RunnerSessionStore';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

const guest: RunnerSessionScope = { kind: 'guest' };
const accountA: RunnerSessionScope = { kind: 'account', id: 'home/id + A' };
const accountB: RunnerSessionScope = { kind: 'account', id: 'account-b' };
const savedAt = '2026-11-12T00:00:00.000Z';

function activeEnvelope(scope: RunnerSessionScope = guest): RunnerSessionEnvelope {
  const characterId: CharacterId = 'player-default';
  return {
    schemaVersion: 1,
    kind: 'active',
    savedAt,
    accountScope: scope,
    runId: 'run-1',
    payload: {
      characterId,
      mode: 'endless',
      storyStageId: null,
      snapshot: {
        phase: 'paused', characterId, mode: 'endless', storyStageId: null,
        speedPickupRemainingMs: 0, elapsedMs: 1_000, remainingMs: 89_000,
        distanceMeters: 250, worldDistance: 250, speedUnitsPerSecond: 255,
        coins: 2, giantRemainingMs: 0, collectedPickupIds: [], passedGateIds: [],
        staggerRemainingMs: 0, protectionRemainingMs: 0, passiveChargesRemaining: 0,
        passiveEffectRemainingMs: 0, slideGuardRemainingMs: 0, slideGuardCooldownRemainingMs: 0,
        biomeId: 'dawn-city', finishedAtElapsedMs: null, finishReason: null,
        startedAtIso: savedAt, finishedAtIso: null,
      },
      engine: createRunnerEngineCheckpoint(),
    },
  };
}

function terminalEnvelope(scope: RunnerSessionScope = guest): RunnerSessionEnvelope {
  const characterId: CharacterId = 'player-default';
  return {
    schemaVersion: 1,
    kind: 'terminal',
    savedAt,
    accountScope: scope,
    runId: 'run-2',
    payload: {
      characterId, mode: 'endless', storyStageId: null,
      result: {
        characterId, mode: 'endless', storyStageId: null,
        distanceMeters: 500, coins: 4, durationMs: 20_000,
        finishedAtIso: savedAt, finishReason: 'timeout',
      },
      outcome: 'completed', settled: true,
    },
  };
}

describe('BrowserRunnerSessionStore', () => {
  it('uses isolated guest and encoded account keys', () => {
    expect(createRunnerSessionKey(guest)).toBe('stella-runner:session:v1:guest');
    expect(createRunnerSessionKey(accountA)).toBe('stella-runner:session:v1:account:home%2Fid%20%2B%20A');
    expect(createRunnerSessionKey(accountA)).not.toBe(createRunnerSessionKey(accountB));
  });

  it('round-trips active and terminal envelopes without sharing account data', () => {
    const storage = new MemoryStorage();
    const store = new BrowserRunnerSessionStore(storage);
    const active = activeEnvelope(accountA);
    const terminal = terminalEnvelope(guest);

    expect(store.write(active)).toEqual({ ok: true, value: undefined });
    expect(store.write(terminal)).toEqual({ ok: true, value: undefined });
    const accountRead = store.read(accountA, new Date(savedAt));
    const guestRead = store.read(guest, new Date(savedAt));
    if (!accountRead.ok || !guestRead.ok) throw new Error('Expected saved session envelopes');
    expect(accountRead.value).toEqual(active);
    expect(guestRead.value).toEqual(terminal);
    expect(store.read(accountB, new Date(savedAt))).toEqual({ ok: true, value: null });
  });

  it('rejects and removes data saved under a different account scope', () => {
    const storage = new MemoryStorage();
    const store = new BrowserRunnerSessionStore(storage);
    const key = createRunnerSessionKey(accountA);
    storage.setItem(key, JSON.stringify(activeEnvelope(accountB)));

    expect(store.read(accountA, new Date(savedAt))).toEqual({ ok: false, reason: 'invalid' });
    expect(storage.getItem(key)).toBeNull();
    expect(storage.getItem(createRunnerSessionKey(accountB))).toBeNull();
  });

  it('expires data at the seven-day boundary and removes only that scope', () => {
    const storage = new MemoryStorage();
    const store = new BrowserRunnerSessionStore(storage);
    const key = createRunnerSessionKey(accountA);
    storage.setItem(key, JSON.stringify(activeEnvelope(accountA)));
    storage.setItem(createRunnerSessionKey(accountB), JSON.stringify(activeEnvelope(accountB)));

    expect(store.read(accountA, new Date(Date.parse(savedAt) + RUNNER_SESSION_TTL_MS)))
      .toEqual({ ok: false, reason: 'expired' });
    expect(storage.getItem(key)).toBeNull();
    expect(storage.getItem(createRunnerSessionKey(accountB))).not.toBeNull();
  });

  it('removes malformed JSON and unsupported schema versions', () => {
    const storage = new MemoryStorage();
    const store = new BrowserRunnerSessionStore(storage);
    const key = createRunnerSessionKey(guest);
    storage.setItem(key, '{not-json');
    expect(store.read(guest, new Date(savedAt))).toEqual({ ok: false, reason: 'invalid' });
    storage.setItem(key, JSON.stringify({ ...activeEnvelope(), schemaVersion: 99 }));
    expect(store.read(guest, new Date(savedAt))).toEqual({ ok: false, reason: 'invalid' });
    expect(storage.getItem(key)).toBeNull();
  });

  it('reports denied storage and quota errors instead of throwing', () => {
    const deniedStorage = {
      getItem: () => { throw new DOMException('Blocked', 'SecurityError'); },
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    const deniedStore = new BrowserRunnerSessionStore(deniedStorage);
    expect(deniedStore.read(guest, new Date(savedAt))).toMatchObject({ ok: false, reason: 'unavailable' });

    const quotaStorage = {
      getItem: () => null,
      setItem: () => { throw new DOMException('Full', 'QuotaExceededError'); },
      removeItem: () => undefined,
    };
    const quotaStore = new BrowserRunnerSessionStore(quotaStorage);
    expect(quotaStore.write(activeEnvelope())).toMatchObject({ ok: false, reason: 'quota' });
  });

  it('removes only the requested account key', () => {
    const storage = new MemoryStorage();
    const store = new BrowserRunnerSessionStore(storage);
    store.write(activeEnvelope(accountA));
    store.write(activeEnvelope(accountB));

    expect(store.remove(accountA)).toEqual({ ok: true, value: undefined });
    expect(storage.getItem(createRunnerSessionKey(accountA))).toBeNull();
    expect(storage.getItem(createRunnerSessionKey(accountB))).not.toBeNull();
  });
});
