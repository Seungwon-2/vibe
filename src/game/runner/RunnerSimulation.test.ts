import { describe, expect, it } from 'vitest';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type { CharacterId } from '../characters/characterTypes';
import {
  advanceRunner,
  applyCollision,
  collectPickup,
  createRunnerSnapshot,
  finishRunner,
  pauseRunner,
  resumeRunner,
  startRunner,
} from './RunnerSimulation';

const EPOCH = new Date('2026-10-26T00:00:00.000Z');

function running(characterId: CharacterId = 'player-default') {
  return startRunner(createRunnerSnapshot(characterId, EPOCH));
}

describe('RunnerSimulation', () => {
  it('starts after a separate countdown and advances only active running time', () => {
    const initial = createRunnerSnapshot('player-default', EPOCH);
    expect(initial).toMatchObject({
      phase: 'countdown', remainingMs: 90_000, distanceMeters: 0,
      speedUnitsPerSecond: 250, biomeId: 'dawn-city',
    });
    expect(RUNNER_CONFIG.countdownMs).toBe(3_000);
    expect(advanceRunner(initial, 4_000)).toEqual({ state: initial, result: null });

    const started = startRunner(initial);
    const afterSecond = advanceRunner(started, 1_000).state;
    expect(afterSecond.elapsedMs).toBe(1_000);
    expect(afterSecond.remainingMs).toBe(89_000);
    expect(afterSecond.distanceMeters).toBeCloseTo(83.47, 1);
    expect(afterSecond.worldDistance * RUNNER_CONFIG.metersPerWorldUnit)
      .toBeCloseTo(afterSecond.distanceMeters, 8);
    expect(advanceRunner(afterSecond, -100).state).toBe(afterSecond);

    const paused = pauseRunner(afterSecond);
    expect(advanceRunner(paused, 60_000)).toEqual({ state: paused, result: null });
    expect(resumeRunner(paused).phase).toBe('running');
    expect(startRunner(afterSecond)).toBe(afterSecond);
  });

  it('crosses each gate once, changes biome, and caps the ramp at 325', () => {
    expect(RUNNER_GATE_DISTANCES_M).toEqual([2_500, 5_000, 7_500]);
    const first = advanceRunner(running(), 30_000).state;
    expect(first.distanceMeters).toBeGreaterThan(2_500);
    expect(first.passedGateIds).toEqual(['gate-2500']);
    expect(first.biomeId).toBe('moonlit-forest');
    expect(first.remainingMs).toBeCloseTo(80_000, 4);

    const afterRamp = advanceRunner(first, 60_000).state;
    expect(afterRamp.elapsedMs).toBe(90_000);
    expect(afterRamp.speedUnitsPerSecond).toBe(325);
    expect(afterRamp.passedGateIds).toEqual(['gate-2500', 'gate-5000', 'gate-7500']);
    expect(afterRamp.biomeId).toBe('cloud-skyway');
    expect(afterRamp.remainingMs).toBeCloseTo(60_000, 4);
    const extended = advanceRunner(afterRamp, 10_000).state;
    expect(extended.speedUnitsPerSecond).toBe(325);
    expect(extended.passedGateIds).toHaveLength(3);
  });

  it('is independent of update chunk size even across gates and time expiry', () => {
    const oneStep = advanceRunner(running(), 200_000);
    let chunks = running();
    let chunkResult = null;
    for (let step = 0; step < 200 && !chunkResult; step += 1) {
      const next = advanceRunner(chunks, 1_000);
      chunks = next.state;
      chunkResult = next.result;
    }

    expect(oneStep.state.phase).toBe('finished');
    expect(oneStep.state.passedGateIds).toHaveLength(3);
    expect(chunks.passedGateIds).toEqual(oneStep.state.passedGateIds);
    expect(chunks.distanceMeters).toBeCloseTo(oneStep.state.distanceMeters, 6);
    expect(chunkResult).toEqual(oneStep.result);
    expect(oneStep.result?.durationMs).toBeCloseTo(150_000, 4);
    expect(oneStep.result?.finishedAtIso).toBe('2026-10-26T00:02:30.000Z');
    expect(advanceRunner(oneStep.state, 1_000)).toEqual({ state: oneStep.state, result: null });
  });

  it('applies unique coin and time pickups, character bonuses, and the timer cap', () => {
    const rin = running();
    const rinTime = collectPickup(rin, { id: 'time-a', kind: 'time' });
    expect(rinTime.remainingMs).toBe(94_000);
    expect(collectPickup(rinTime, { id: 'time-a', kind: 'time' })).toBe(rinTime);
    const withCoin = collectPickup(rinTime, { id: 'coin-a', kind: 'coin' });
    expect(withCoin.coins).toBe(1);
    expect(withCoin.remainingMs).toBe(94_000);
    expect(rin.coins).toBe(0);

    expect(collectPickup(running('cogane-rang'), { id: 'time-a', kind: 'time' }).remainingMs)
      .toBe(93_000);
    const almostFull = { ...rin, remainingMs: 119_000 };
    expect(collectPickup(almostFull, { id: 'time-b', kind: 'time' }).remainingMs).toBe(120_000);
    expect(collectPickup(pauseRunner(rin), { id: 'coin-b', kind: 'coin' }).coins).toBe(0);
  });

  it('uses Mary collision protection while retaining the standard penalty and stagger', () => {
    const rin = running();
    const mary = running('tokino-mary');
    expect(applyCollision(rin).remainingMs).toBe(85_000);
    const firstHit = applyCollision(mary);
    expect(firstHit.remainingMs).toBe(85_000);
    expect(firstHit.staggerRemainingMs).toBe(1_200);
    expect(firstHit.protectionRemainingMs).toBe(1_450);
    expect(applyCollision(firstHit)).toBe(firstHit);
    expect(advanceRunner(pauseRunner(firstHit), 2_000).state.protectionRemainingMs).toBe(1_450);

    const recovered = advanceRunner(firstHit, 1_200).state;
    expect(recovered.protectionRemainingMs).toBe(250);
    expect(recovered.staggerRemainingMs).toBe(0);
    expect(applyCollision(recovered)).toBe(recovered);
    const unprotected = advanceRunner(recovered, 250).state;
    expect(unprotected.protectionRemainingMs).toBe(0);
    expect(applyCollision(unprotected).remainingMs).toBe(unprotected.remainingMs - 5_000);
    const fatal = applyCollision({ ...rin, remainingMs: 2_000 });
    expect(fatal.phase).toBe('finished');
    expect(fatal.remainingMs).toBe(0);
    expect(fatal.finishedAtElapsedMs).toBe(0);
  });

  it('freezes map distance for 1.2s after a hit while the timer continues', () => {
    const hit = applyCollision(running());
    const halfway = advanceRunner(hit, 600).state;
    expect(halfway.distanceMeters).toBe(hit.distanceMeters);
    expect(halfway.remainingMs).toBe(84_400);
    expect(halfway.staggerRemainingMs).toBe(600);
    const recovered = advanceRunner(halfway, 600).state;
    expect(recovered.distanceMeters).toBe(hit.distanceMeters);
    expect(recovered.staggerRemainingMs).toBe(0);
    expect(recovered.protectionRemainingMs).toBe(0);
    const moving = advanceRunner(recovered, 100).state;
    expect(moving.distanceMeters).toBeGreaterThan(hit.distanceMeters);
    expect(advanceRunner(hit, 1_300).state.distanceMeters).toBeCloseTo(moving.distanceMeters, 7);

    const nearlyExpired = { ...hit, remainingMs: 100 };
    const expiredDuringFreeze = advanceRunner(nearlyExpired, 1_000);
    expect(expiredDuringFreeze.state.phase).toBe('finished');
    expect(expiredDuringFreeze.state.distanceMeters).toBe(hit.distanceMeters);
    expect(expiredDuringFreeze.result).not.toBeNull();
  });

  it('awards a gate reached before timeout but does not travel after the timer ends', () => {
    const nearGate = {
      ...running(), distanceMeters: 2_490, worldDistance: 2_490 * 3, remainingMs: 500,
    };
    const rescued = advanceRunner(nearGate, 30_000);
    expect(rescued.state.passedGateIds).toEqual(['gate-2500']);
    expect(rescued.state.phase).toBe('finished');
    expect(rescued.state.elapsedMs).toBeCloseTo(20_500, 5);

    const tooFar = {
      ...running(), distanceMeters: 2_400, worldDistance: 2_400 * 3, remainingMs: 500,
    };
    const expired = advanceRunner(tooFar, 30_000);
    expect(expired.state.passedGateIds).toEqual([]);
    expect(expired.state.distanceMeters).toBeLessThan(2_500);
    expect(expired.state.elapsedMs).toBe(500);
  });

  it('keeps final results stable and rounds meters only at the result boundary', () => {
    const state = { ...running(), distanceMeters: 12.6, worldDistance: 37.8, coins: 4 };
    const finished = finishRunner(state, new Date('2026-10-26T01:00:00.000Z'));
    expect(finished.result).toEqual({
      characterId: 'player-default', distanceMeters: 13, coins: 4,
      durationMs: 0, finishedAtIso: '2026-10-26T01:00:00.000Z',
    });
    expect(finishRunner(finished.state).result).toEqual(finished.result);
    expect(state.phase).toBe('running');
  });
});
