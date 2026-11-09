import { describe, expect, it } from 'vitest';
import { RunService } from '../src/domain/runService.js';
import { createDefaultProfile } from '../src/domain/profileDefaults.js';
import type { LeaderboardBestDocument, PlayerPrincipal, ProfileDocument, RunDocument, RunSubmission } from '../src/shared/contracts.js';
import { ApiException } from '../src/shared/errors.js';
import type { RunnerRepository, Versioned } from '../src/data/cosmosRepository.js';

const alice: PlayerPrincipal = { playerId: 'tenant:alice', displayName: 'Alice' };
const bob: PlayerPrincipal = { playerId: 'tenant:bob', displayName: 'Bob' };
function run(runId: string, overrides: Partial<RunSubmission> = {}): RunSubmission {
  return { runId, characterId: 'player-default', mode: 'endless', storyStageId: null,
    distanceMeters: 2500, coins: 8, durationMs: 30_000, finishedAtIso: '2026-11-09T12:00:00.000Z',
    finishReason: 'timeout', hitsTaken: 0, passedGateCount: 1, completedStage: false, ...overrides };
}

class MemoryRepository implements RunnerRepository {
  profiles = new Map<string, Versioned<ProfileDocument>>();
  runs = new Map<string, RunDocument>();
  bests = new Map<string, Versioned<LeaderboardBestDocument>>();
  conflictsRemaining = 0;
  async getProfile(playerId: string) { return this.profiles.get(playerId) ?? null; }
  async ensureProfile(playerId: string) {
    const existing = await this.getProfile(playerId); if (existing) return existing;
    const doc: ProfileDocument = { id: 'profile', playerId, kind: 'profile', schemaVersion: 1,
      updatedAtIso: '2026-11-09T12:00:00.000Z', profile: createDefaultProfile() };
    const created = { value: doc, etag: 'profile-1' }; this.profiles.set(playerId, created); return created;
  }
  async getRun(playerId: string, runId: string) { return this.runs.get(`${playerId}:${runId}`) ?? null; }
  async getBest(playerId: string) { return this.bests.get(playerId) ?? null; }
  async commitRun(document: RunDocument, profile: ProfileDocument, _profileEtag: string,
    best: LeaderboardBestDocument | null, bestEtag: string | null){
    void bestEtag;
    if (this.conflictsRemaining) { this.conflictsRemaining -= 1; throw new ApiException(409, 'SUBMISSION_CONFLICT', 'conflict'); }
    this.runs.set(`${document.playerId}:${document.run.runId}`, document);
    this.profiles.set(document.playerId, { value: profile, etag: `profile-${this.runs.size + 1}` });
    if (best) this.bests.set(document.playerId, { value: best, etag: `best-${this.bests.size + 1}` });
  }
  async getRunHistory(playerId: string, limit: number) {
    return { items: [...this.runs.values()].filter((item) => item.playerId === playerId).slice(0, limit), nextCursor: null };
  }
  async listBestProjections() { return [...this.bests.values()].map((item) => item.value); }
}

describe('authenticated run service', () => {
  it('stores full run history by owner and publishes only one best endless result', async () => {
    const repository = new MemoryRepository(); const service = new RunService(repository);
    const first = await service.submit(alice, run('run-1'));
    const story = await service.submit(alice, run('run-2', { mode: 'story', storyStageId: 'dawn-city',
      distanceMeters: 1000, finishReason: 'lives-exhausted' }));
    expect(first.personalBest?.displayName).toBe('Alice');
    expect(story.personalBest?.distanceMeters).toBe(2500);
    expect(repository.runs.size).toBe(2);
    expect(repository.bests.size).toBe(1);
    expect((await service.history(alice, 10, null)).items).toHaveLength(2);
    expect((await service.history(bob, 10, null)).items).toHaveLength(0);
    expect(await service.leaderboard(10)).toHaveLength(1);
  });
  it('returns the previous receipt for a duplicate without reapplying coins or rewards', async () => {
    const repository = new MemoryRepository(); const service = new RunService(repository);
    const submission = run('same-run');
    await service.submit(alice, submission);
    const walletAfterFirst = repository.profiles.get(alice.playerId)!.value.profile.walletCoins;
    const duplicate = await service.submit(alice, submission);
    expect(duplicate.personalBestUpdated).toBe(false);
    expect(repository.profiles.get(alice.playerId)!.value.profile.walletCoins).toBe(walletAfterFirst);
    await expect(service.submit(alice, run('same-run', { coins: 9 }))).rejects.toMatchObject({ code: 'RUN_ID_REUSED' });
  });
  it('keeps per-player best by distance, then coins, and assigns global rank', async () => {
    const repository = new MemoryRepository(); const service = new RunService(repository);
    await service.submit(alice, run('alice-low', { distanceMeters: 3000, coins: 8 }));
    await service.submit(bob, run('bob-high', { distanceMeters: 3000, coins: 9 }));
    await service.submit(alice, run('alice-tie-better', { distanceMeters: 3000, coins: 10 }));
    await service.submit(alice, run('alice-short', { distanceMeters: 2999, coins: 999 }));
    expect((await service.best(alice))?.coins).toBe(10);
    expect((await service.leaderboard(10)).map((row) => row.displayName)).toEqual(['Alice', 'Bob']);
    expect((await service.best(bob))?.rank).toBe(2);
  });
  it('retries optimistic concurrency conflicts without duplicating a run', async () => {
    const repository = new MemoryRepository(); repository.conflictsRemaining = 1;
    const service = new RunService(repository);
    await service.submit(alice, run('retry-run'));
    expect(repository.runs.size).toBe(1);
    expect(repository.profiles.get(alice.playerId)!.value.profile.processedRunIds).toContain('retry-run');
  });
});
