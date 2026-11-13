import { describe, expect, it } from 'vitest';
import { LocalRunGateway } from '../../services/LocalRunGateway';
import type { RunnerResult } from './runnerTypes';
import {
  advanceRunner, applyCollision, collectPickup, createRunnerSnapshot, finishRunner, pauseRunner, resumeRunner, startRunner,
} from './RunnerSimulation';

function createMemoryStorage() {
  let saved: string | null = null;
  return {
    getItem: () => saved,
    setItem: (_key: string, value: string) => { saved = value; },
  };
}

describe('offline runner integration', () => {
  it('runs through recurring gates, pickups, life loss, and persists the result into the unified ranking', async () => {
    let state = startRunner(createRunnerSnapshot('player-default', new Date('2026-10-27T00:00:00.000Z')));

    const paused = pauseRunner(state);
    expect(advanceRunner(paused, 5_000).state).toBe(paused);
    state = resumeRunner(paused);
    state = collectPickup(state, { id: 'coin-1', kind: 'coin' });
    state = collectPickup(state, { id: 'time-1', kind: 'time' });
    expect(state.coins).toBe(1);
    expect(state.remainingMs).toBe(90_000); // Endless runs restore time only at gates.

    const hit = applyCollision(state);
    expect(hit.remainingMs).toBe(85_000);
    expect(applyCollision(hit)).toBe(hit); // protection prevents repeated damage
    state = hit;

    const passedGates: string[] = [];
    for (let step = 0; state.distanceMeters < 12_100 && step < 2_000; step += 1) {
      const advanced = advanceRunner(state, 500, (gateId, awardedMs) => {
        expect(awardedMs).toBeGreaterThan(0);
        passedGates.push(gateId);
      });
      state = advanced.state;
    }

    expect(state.distanceMeters).toBeGreaterThanOrEqual(12_100);
    expect(passedGates).toEqual(['gate-2000', 'gate-4000', 'gate-6000', 'gate-8000', 'gate-10000', 'gate-12000']);
    for (let hitIndex = 0; hitIndex < 3; hitIndex += 1) {
      state = applyCollision(state);
      if (hitIndex < 2) state = advanceRunner(state, 1_200).state;
    }
    const completed = finishRunner(state);
    state = completed.state;
    const result: RunnerResult = completed.result;

    expect(result).not.toBeNull();
    expect(result.distanceMeters).toBeGreaterThan(12_000);
    expect(result.finishReason).toBe('lives-exhausted');
    expect(state.phase).toBe('finished');
    expect(state.livesRemaining).toBe(0);
    expect(state.biomeId).toBe('cloud-skyway');

    const storage = createMemoryStorage();
    const gateway = new LocalRunGateway(storage);
    const submitted = await gateway.submitRun(result);
    const reloadedRanking = await new LocalRunGateway(storage).getRanking();
    expect(submitted.personalBest?.rank).toBe(1);
    expect(reloadedRanking).toHaveLength(1);
    expect(reloadedRanking[0]).toMatchObject({
      rank: 1, characterId: 'player-default', coins: 1, distanceMeters: result!.distanceMeters,
    });
  });
});
