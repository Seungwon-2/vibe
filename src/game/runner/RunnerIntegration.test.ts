import { describe, expect, it } from 'vitest';
import { LocalRunGateway } from '../../services/LocalRunGateway';
import type { RunnerResult } from './runnerTypes';
import {
  advanceRunner, applyCollision, collectPickup, createRunnerSnapshot, pauseRunner, resumeRunner, startRunner,
} from './RunnerSimulation';

function createMemoryStorage() {
  let saved: string | null = null;
  return {
    getItem: () => saved,
    setItem: (_key: string, value: string) => { saved = value; },
  };
}

describe('offline runner integration', () => {
  it('runs through gates, pickups, collision, timeout, and persists a result into the unified ranking', async () => {
    let state = startRunner(createRunnerSnapshot('player-default', new Date('2026-10-27T00:00:00.000Z')));

    const paused = pauseRunner(state);
    expect(advanceRunner(paused, 5_000).state).toBe(paused);
    state = resumeRunner(paused);
    state = collectPickup(state, { id: 'coin-1', kind: 'coin' });
    state = collectPickup(state, { id: 'time-1', kind: 'time' });
    expect(state.coins).toBe(1);
    expect(state.remainingMs).toBe(94_000); // 3s item + Rin's 1s passive

    const hit = applyCollision(state);
    expect(hit.remainingMs).toBe(89_000);
    expect(applyCollision(hit)).toBe(hit); // protection prevents repeated damage
    state = hit;

    const passedGates: string[] = [];
    let result: RunnerResult | null = null;
    for (let step = 0; step < 500 && !result; step += 1) {
      const advanced = advanceRunner(state, 500, (gateId, awardedMs) => {
        expect(awardedMs).toBeGreaterThan(0);
        passedGates.push(gateId);
      });
      state = advanced.state;
      result = advanced.result;
    }

    expect(result).not.toBeNull();
    expect(result!.distanceMeters).toBeGreaterThan(12_500);
    expect(passedGates).toEqual(['gate-2000', 'gate-4000', 'gate-6000', 'gate-8000', 'gate-10000']);
    expect(state.phase).toBe('finished');
    expect(state.remainingMs).toBe(0);
    expect(state.biomeId).toBe('cloud-skyway');

    const storage = createMemoryStorage();
    const gateway = new LocalRunGateway(storage);
    const submitted = await gateway.submitRun(result!);
    const reloadedRanking = await new LocalRunGateway(storage).getRanking();
    expect(submitted.rank).toBe(1);
    expect(reloadedRanking).toHaveLength(1);
    expect(reloadedRanking[0]).toMatchObject({
      rank: 1, characterId: 'player-default', coins: 1, distanceMeters: result!.distanceMeters,
    });
  });
});
