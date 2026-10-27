import { describe, expect, it, vi } from 'vitest';
import type { RunnerResult } from '../game/runner/runnerTypes';
import { PERSONAL_BEST_STORAGE_KEY, PersonalBestStore } from './PersonalBestStore';

const first: RunnerResult = {
  characterId: 'player-default', distanceMeters: 0, coins: 2,
  durationMs: 1000, finishedAtIso: '2026-10-27T00:00:00.000Z',
};

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => { value = next; }),
  };
}

describe('PersonalBestStore', () => {
  it('counts a first 0m run, accepts only a farther integer distance, and keeps equal records unchanged', () => {
    const storage = memoryStorage();
    const store = new PersonalBestStore(storage);
    expect(store.record(first)).toEqual({
      isNewBest: true, bestDistanceMeters: 0, previousDistanceMeters: null,
    });
    expect(store.record({ ...first, coins: 200 })).toEqual({
      isNewBest: false, bestDistanceMeters: 0, previousDistanceMeters: 0,
    });
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(store.record({ ...first, distanceMeters: 14.6 })).toEqual({
      isNewBest: true, bestDistanceMeters: 15, previousDistanceMeters: 0,
    });
    expect(store.getBest('player-default')?.coins).toBe(2);
    expect(store.record({ ...first, distanceMeters: 14, coins: 99 }).isNewBest).toBe(false);
  });

  it('reloads each active character independently from the versioned key', () => {
    const storage = memoryStorage();
    const store = new PersonalBestStore(storage);
    store.record({ ...first, distanceMeters: 300 });
    store.record({ ...first, characterId: 'tokino-mary', distanceMeters: 100 });
    const reloaded = new PersonalBestStore(storage);
    expect(reloaded.getBest('player-default')?.distanceMeters).toBe(300);
    expect(reloaded.getBest('tokino-mary')?.distanceMeters).toBe(100);
    expect(reloaded.getBest('hanayo-hiyori')).toBeNull();
    expect(storage.getItem).toHaveBeenCalledWith(PERSONAL_BEST_STORAGE_KEY);
    expect(JSON.parse(storage.setItem.mock.lastCall![1])).toEqual({
      version: 1, bestByCharacter: {
        'player-default': { distanceMeters: 300, coins: 2, finishedAtIso: first.finishedAtIso },
        'tokino-mary': { distanceMeters: 100, coins: 2, finishedAtIso: first.finishedAtIso },
      },
    });
  });

  it('ignores retired IDs and resets malformed, wrong-version, or invalid saved data', () => {
    const valid = { distanceMeters: 44, coins: 1, finishedAtIso: first.finishedAtIso };
    const stored = new PersonalBestStore(memoryStorage(JSON.stringify({ version: 1,
      bestByCharacter: { 'retired-hero': valid, 'player-default': valid },
    })));
    expect(stored.getBest('player-default')?.distanceMeters).toBe(44);
    for (const raw of ['{broken', JSON.stringify({ version: 2, bestByCharacter: {} }),
      JSON.stringify({ version: 1, bestByCharacter: { 'player-default': { ...valid, coins: -1 } } })]) {
      const store = new PersonalBestStore(memoryStorage(raw));
      expect(store.getBest('player-default')).toBeNull();
      expect(store.record(first).isNewBest).toBe(true);
    }
  });

  it('keeps a session best when browser storage reads or writes fail', () => {
    const storage = { getItem: vi.fn(() => { throw new Error('denied'); }),
      setItem: vi.fn(() => { throw new Error('quota'); }) };
    const store = new PersonalBestStore(storage);
    expect(store.record(first).isNewBest).toBe(true);
    expect(store.record(first).isNewBest).toBe(false);
    expect(store.getBest('player-default')?.distanceMeters).toBe(0);
  });

  it('rejects invalid current results and removed or unavailable characters', () => {
    const store = new PersonalBestStore(null);
    expect(() => store.record({ ...first, distanceMeters: Number.NaN })).toThrow(TypeError);
    expect(() => store.record({ ...first, coins: -1 })).toThrow(TypeError);
    expect(() => store.record({ ...first, finishedAtIso: 'invalid' })).toThrow(TypeError);
    expect(() => store.record({ ...first, finishedAtIso: '2026-99-27T00:00:00.000Z' })).toThrow(TypeError);
    expect(() => store.record({ ...first, durationMs: -1 })).toThrow(TypeError);
    expect(() => store.record({ ...first, characterId: 'goth-student' })).toThrow(TypeError);
    expect(() => store.record({ ...first, characterId: 'removed' as RunnerResult['characterId'] }))
      .toThrow(TypeError);
  });
});
