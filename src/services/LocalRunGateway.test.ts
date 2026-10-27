import { describe, expect, it, vi } from 'vitest';
import type { RunnerResult } from '../game/runner/runnerTypes';
import { LocalRunGateway, RUN_RECORDS_STORAGE_KEY } from './LocalRunGateway';

const first: RunnerResult = {
  characterId: 'player-default', distanceMeters: 12.4, coins: 2,
  durationMs: 10_000, finishedAtIso: '2026-10-27T00:00:00.000Z',
};

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => { value = next; }),
    value: () => value,
  };
}

describe('LocalRunGateway', () => {
  it('persists normalized records under the versioned key and reloads them', async () => {
    const storage = memoryStorage();
    const gateway = new LocalRunGateway(storage);
    const submitted = await gateway.submitRun(first);
    expect(submitted.distanceMeters).toBe(12);
    expect(submitted.rank).toBe(1);
    expect(storage.setItem).toHaveBeenCalledWith(RUN_RECORDS_STORAGE_KEY, expect.any(String));
    expect(JSON.parse(storage.value()!)).toMatchObject({ version: 1, records: [
      { characterId: 'player-default', distanceMeters: 12, coins: 2, durationMs: 10_000,
        finishedAtIso: first.finishedAtIso },
    ] });
    const reloaded = new LocalRunGateway(storage);
    expect(await reloaded.getBest()).toMatchObject({ rank: 1, distanceMeters: 12 });
  });

  it('keeps one ranking across all five catalog characters and orders distance, coins, time, then ID', async () => {
    const storage = memoryStorage();
    const gateway = new LocalRunGateway(storage);
    const runs: RunnerResult[] = [
      { ...first, characterId: 'player-default', distanceMeters: 100, coins: 3,
        finishedAtIso: '2026-10-27T00:00:02.000Z' },
      { ...first, characterId: 'goth-student', distanceMeters: 100, coins: 5,
        finishedAtIso: '2026-10-27T00:00:03.000Z' },
      { ...first, characterId: 'cogane-rang', distanceMeters: 100, coins: 5,
        finishedAtIso: '2026-10-27T00:00:01.000Z' },
      { ...first, characterId: 'hanayo-hiyori', distanceMeters: 130, coins: 0 },
      { ...first, characterId: 'tokino-mary', distanceMeters: 100, coins: 5,
        finishedAtIso: '2026-10-27T00:00:00.000Z' },
    ];
    for (const run of runs) await gateway.submitRun(run);
    const ranking = await gateway.getRanking();
    expect(ranking.map(({ characterId, rank }) => [characterId, rank])).toEqual([
      ['hanayo-hiyori', 1], ['tokino-mary', 2], ['cogane-rang', 3],
      ['goth-student', 4], ['player-default', 5],
    ]);
    expect(await gateway.getBest()).toEqual(ranking[0]);
  });

  it('uses the record ID as the final deterministic tie-breaker', async () => {
    const date = first.finishedAtIso;
    const storage = memoryStorage(JSON.stringify({ version: 1, records: [
      { id: 'z-run', characterId: 'player-default', distanceMeters: 50, coins: 4,
        durationMs: 1_000, finishedAtIso: date },
      { id: 'a-run', characterId: 'hanayo-hiyori', distanceMeters: 50, coins: 4,
        durationMs: 1_000, finishedAtIso: date },
    ] }));
    const ranking = await new LocalRunGateway(storage).getRanking();
    expect(ranking.map(({ id, rank }) => [id, rank])).toEqual([['a-run', 1], ['z-run', 2]]);
  });

  it('stores only the best ten rows and returns rank 11 for a result outside the list', async () => {
    const gateway = new LocalRunGateway(memoryStorage());
    for (let distance = 1; distance <= 10; distance += 1) {
      await gateway.submitRun({ ...first, distanceMeters: distance });
    }
    const outside = await gateway.submitRun({ ...first, distanceMeters: 0 });
    expect(outside.rank).toBe(11);
    const ranking = await gateway.getRanking();
    expect(ranking).toHaveLength(10);
    expect(ranking.map((record) => record.distanceMeters)).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(ranking.map((record) => record.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('uses an empty list for malformed, wrong-version, or invalid saved snapshots', async () => {
    const validRecord = { id: 'saved-1', characterId: 'player-default', distanceMeters: 10,
      coins: 1, durationMs: 2_000, finishedAtIso: first.finishedAtIso };
    const snapshots = [
      '{broken',
      JSON.stringify({ version: 2, records: [validRecord] }),
      JSON.stringify({ version: 1, records: [{ ...validRecord, coins: -1 }] }),
      JSON.stringify({ version: 1, records: [{ ...validRecord, characterId: 'removed' }] }),
      JSON.stringify({ version: 1, records: [validRecord, validRecord] }),
    ];
    for (const raw of snapshots) {
      const gateway = new LocalRunGateway(memoryStorage(raw));
      expect(await gateway.getRanking()).toEqual([]);
      expect((await gateway.submitRun(first)).rank).toBe(1);
    }
  });

  it('keeps an in-memory ranking when storage reads or writes are denied', async () => {
    const readDenied = { getItem: vi.fn(() => { throw new Error('denied'); }),
      setItem: vi.fn(() => { throw new Error('quota'); }) };
    const gateway = new LocalRunGateway(readDenied);
    expect((await gateway.submitRun(first)).rank).toBe(1);
    expect((await gateway.getBest())?.distanceMeters).toBe(12);
    expect(await gateway.getRanking()).toHaveLength(1);
  });

  it('rejects invalid results and creates one unique ID per submitted run', async () => {
    const gateway = new LocalRunGateway(null);
    await expect(gateway.submitRun({ ...first, distanceMeters: Number.NaN })).rejects.toThrow(TypeError);
    await expect(gateway.submitRun({ ...first, distanceMeters: Number.POSITIVE_INFINITY })).rejects.toThrow(TypeError);
    await expect(gateway.submitRun({ ...first, coins: -1 })).rejects.toThrow(TypeError);
    await expect(gateway.submitRun({ ...first, durationMs: -1 })).rejects.toThrow(TypeError);
    await expect(gateway.submitRun({ ...first, durationMs: Number.NaN })).rejects.toThrow(TypeError);
    await expect(gateway.submitRun({ ...first, finishedAtIso: 'invalid' })).rejects.toThrow(TypeError);
    await expect(gateway.submitRun({ ...first, finishedAtIso: '2026-99-27T00:00:00.000Z' })).rejects.toThrow(TypeError);
    await expect(gateway.submitRun({ ...first, characterId: 'removed' as RunnerResult['characterId'] }))
      .rejects.toThrow(TypeError);
    const firstSaved = await gateway.submitRun(first);
    const secondSaved = await gateway.submitRun(first);
    expect(firstSaved.id).not.toBe(secondSaved.id);
  });
});
