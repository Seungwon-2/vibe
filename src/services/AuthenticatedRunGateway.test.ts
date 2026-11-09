import { describe, expect, it, vi } from 'vitest';
import type { RunnerResult } from '../game/runner/runnerTypes';
import { AuthenticatedRunGateway, RunApiError } from './AuthenticatedRunGateway';

const finishedAtIso = '2026-11-09T12:00:00.000Z';
const publicBest = { rank: 2, displayName: 'Runner Name', characterId: 'player-default',
  distanceMeters: 1200, coins: 8, finishedAtIso };
const savedRun = { runId: 'private-run-id', characterId: 'player-default', mode: 'endless', storyStageId: null,
  distanceMeters: 1200, coins: 8, durationMs: 90_000, finishedAtIso, finishReason: 'timeout',
  hitsTaken: 1, passedGateCount: 0, completedStage: false };
const parsedSavedRun = { id: savedRun.runId, characterId: savedRun.characterId, mode: savedRun.mode,
  storyStageId: savedRun.storyStageId, distanceMeters: savedRun.distanceMeters, coins: savedRun.coins,
  durationMs: savedRun.durationMs, finishedAtIso: savedRun.finishedAtIso, finishReason: savedRun.finishReason,
  hitsTaken: savedRun.hitsTaken, passedGateCount: savedRun.passedGateCount, completedStage: savedRun.completedStage };
const result: RunnerResult = { characterId: 'player-default', mode: 'endless', storyStageId: null,
  distanceMeters: 1200, coins: 8, durationMs: 90_000, finishedAtIso, finishReason: 'timeout',
  hitsTaken: 1, passedGateCount: 0, completedStage: false };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('AuthenticatedRunGateway', () => {
  it('calls the public best and leaderboard routes with an API bearer token', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(jsonResponse(publicBest)).mockResolvedValueOnce(jsonResponse([publicBest]));
    const gateway = new AuthenticatedRunGateway('/api/', async () => 'delegated-token', fetcher);

    expect(await gateway.getBest()).toEqual(publicBest);
    expect(await gateway.getRanking()).toEqual([publicBest]);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual(['/api/runs/best', '/api/leaderboard']);
    for (const [, init] of fetcher.mock.calls) {
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer delegated-token');
      expect(new Headers(init?.headers).get('Accept')).toBe('application/json');
    }
  });

  it('keeps personal history owner scoped and encodes the opaque cursor', async () => {
    const page = { items: [savedRun], nextCursor: 'next cursor/+=' };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(page));
    const gateway = new AuthenticatedRunGateway('/api', async () => 'token', fetcher);

    expect(await gateway.getPersonalHistory({ limit: 25, cursor: 'opaque cursor/+=' })).toEqual({
      items: [parsedSavedRun], nextCursor: page.nextCursor,
    });
    expect(fetcher).toHaveBeenCalledWith('/api/runs?limit=25&cursor=opaque+cursor%2F%2B%3D', expect.any(Object));
  });

  it('submits a run and returns the private receipt and public best projection', async () => {
    const receipt = { savedRun, personalBest: publicBest, personalBestUpdated: false };
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(receipt)));
    const gateway = new AuthenticatedRunGateway('/api', async () => 'token', fetcher);

    expect(await gateway.submitRun(result)).toEqual({ ...receipt, savedRun: parsedSavedRun });
    const [, init] = fetcher.mock.calls[0];
    expect(fetcher.mock.calls[0][0]).toBe('/api/runs');
    expect(init).toMatchObject({ method: 'POST' });
    const submission = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(submission).toMatchObject({ characterId: result.characterId, mode: result.mode,
      distanceMeters: result.distanceMeters, coins: result.coins, durationMs: result.durationMs,
      finishedAtIso: result.finishedAtIso, finishReason: result.finishReason,
      hitsTaken: result.hitsTaken, passedGateCount: result.passedGateCount, completedStage: result.completedStage });
    expect(submission.runId).toEqual(expect.any(String));
    expect(submission).not.toHaveProperty('playerId');
    expect(submission).not.toHaveProperty('displayName');
    await gateway.submitRun(result);
    const retrySubmission = JSON.parse(fetcher.mock.calls[1][1].body as string) as Record<string, unknown>;
    expect(retrySubmission.runId).toBe(submission.runId);
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token');
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json');
  });

  it('rejects public DTOs containing identifiers and invalid personal stage data', async () => {
    const leakedPublicRecord = { ...publicBest, email: 'private@example.test' };
    const gateway = new AuthenticatedRunGateway('/api', async () => 'token',
      vi.fn().mockResolvedValue(jsonResponse([leakedPublicRecord])));
    await expect(gateway.getRanking()).rejects.toThrow('Invalid public leaderboard DTO');

    const invalidStage = { ...savedRun, mode: 'story', storyStageId: 'unknown-world' };
    const historyGateway = new AuthenticatedRunGateway('/api', async () => 'token',
      vi.fn().mockResolvedValue(jsonResponse({ items: [invalidStage], nextCursor: null })));
    await expect(historyGateway.getPersonalHistory()).rejects.toThrow('Invalid personal run-history DTO');
  });

  it.each([401, 403, 503])('surfaces HTTP %i without pretending the request succeeded', async (status) => {
    const gateway = new AuthenticatedRunGateway('/api', async () => 'token',
      vi.fn().mockResolvedValue(new Response(null, { status })));
    await expect(gateway.getBest()).rejects.toMatchObject({ name: 'RunApiError', status });
  });

  it('labels a fetch failure as a network API error', async () => {
    const gateway = new AuthenticatedRunGateway('/api', async () => 'token',
      vi.fn().mockRejectedValue(new Error('offline')));
    await expect(gateway.getRanking()).rejects.toMatchObject<Partial<RunApiError>>({ status: 0, message: 'offline' });
  });
});
