import { describe, expect, it } from 'vitest';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type { CharacterId } from '../characters/characterTypes';
import {
  advanceRunner,
  applyCollision,
  applyPitFall,
  beginRunnerSlide,
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

function storyRunning(characterId: CharacterId = 'player-default') {
  return startRunner(createRunnerSnapshot(characterId, EPOCH, { mode: 'story', storyStageId: 'dawn-city' }));
}

describe('RunnerSimulation', () => {
  it('starts after a separate countdown and advances only active running time', () => {
    const initial = createRunnerSnapshot('player-default', EPOCH);
    expect(initial).toMatchObject({
      phase: 'countdown', remainingMs: 90_000, distanceMeters: 0,
      speedUnitsPerSecond: 317.625, biomeId: 'dawn-city',
    });
    expect(RUNNER_CONFIG.countdownMs).toBe(3_000);
    expect(advanceRunner(initial, 4_000)).toEqual({ state: initial, result: null });

    const started = startRunner(initial);
    const afterSecond = advanceRunner(started, 1_000).state;
    expect(afterSecond.elapsedMs).toBe(1_000);
    expect(afterSecond.remainingMs).toBe(89_000);
    expect(afterSecond.distanceMeters).toBeCloseTo(106.05, 1);
    expect(afterSecond.worldDistance * RUNNER_CONFIG.metersPerWorldUnit)
      .toBeCloseTo(afterSecond.distanceMeters, 8);
    expect(advanceRunner(afterSecond, -100).state).toBe(afterSecond);

    const paused = pauseRunner(afterSecond);
    expect(advanceRunner(paused, 60_000)).toEqual({ state: paused, result: null });
    expect(resumeRunner(paused).phase).toBe('running');
    expect(startRunner(afterSecond)).toBe(afterSecond);
  });

  it('gives Endless three lives and escalates collision time penalties by distance', () => {
    const initial = running();
    expect(initial.livesRemaining).toBe(RUNNER_CONFIG.endlessLivesPerRun);
    const tiers = [
      [0, 5_000], [1_999, 5_000], [2_000, 7_000], [3_999, 7_000], [4_000, 9_000],
      [6_000, 11_000], [8_000, 13_000],
    ] as const;
    for (const [distanceMeters, penaltyMs] of tiers) {
      const hit = applyCollision({ ...initial, distanceMeters });
      expect(hit.remainingMs).toBe(initial.remainingMs - penaltyMs);
      expect(hit.livesRemaining).toBe(2);
      expect(hit.hitsTaken).toBe(1);
    }
  });

  it('ends Endless after the third unprotected collision regardless of remaining time', () => {
    let state = running();
    state = applyCollision(state);
    expect(state).toMatchObject({ phase: 'running', livesRemaining: 2, remainingMs: 85_000 });
    state = applyCollision({ ...state, protectionRemainingMs: 0 });
    expect(state).toMatchObject({ phase: 'running', livesRemaining: 1, remainingMs: 80_000 });
    state = applyCollision({ ...state, protectionRemainingMs: 0 });
    expect(state).toMatchObject({ phase: 'finished', livesRemaining: 0, finishReason: 'lives-exhausted', remainingMs: 0 });
  });

  it('crosses five gates once, changes biome at the first three, and adds speed per gate', () => {
    expect(RUNNER_GATE_DISTANCES_M).toEqual([2_000, 4_000, 6_000, 8_000, 10_000]);
    expect(RUNNER_CONFIG.gateSpeedBonusRatio).toBe(0.05);
    const first = advanceRunner(running(), 30_000).state;
    expect(first.distanceMeters).toBeGreaterThan(2_000);
    expect(first.passedGateIds).toEqual(['gate-2000']);
    expect(first.biomeId).toBe('moonlit-forest');
    expect(first.speedUnitsPerSecond).toBeGreaterThan(302.5);

    const afterRamp = advanceRunner(first, 60_000).state;
    expect(afterRamp.elapsedMs).toBe(90_000);
    expect(afterRamp.speedUnitsPerSecond).toBeGreaterThan(393.25);
    expect(afterRamp.passedGateIds.length).toBeGreaterThanOrEqual(3);
    expect(afterRamp.remainingMs).toBeGreaterThan(0);

    const fiveGates = { ...afterRamp, elapsedMs: 90_000,
      passedGateIds: ['gate-2000', 'gate-4000', 'gate-6000', 'gate-8000', 'gate-10000'] as const };
    const atMaxRamp = advanceRunner(fiveGates, 1).state;
    expect(atMaxRamp.speedUnitsPerSecond).toBeCloseTo(516.140625, 8);
    const toaAtMaxRamp = advanceRunner({ ...fiveGates, characterId: 'goth-student' }, 1).state;
    expect(toaAtMaxRamp.speedUnitsPerSecond).toBeCloseTo(491.5625, 8);
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
    expect(oneStep.state.passedGateIds).toHaveLength(5);
    expect(chunks.passedGateIds).toEqual(oneStep.state.passedGateIds);
    expect(chunks.distanceMeters).toBeCloseTo(oneStep.state.distanceMeters, 6);
    expect(chunkResult).toEqual(oneStep.result);
    expect(oneStep.result?.durationMs).toBeGreaterThan(90_000);
    expect(oneStep.result?.finishedAtIso).toBe(
      new Date(Date.parse(running().startedAtIso) + oneStep.result!.durationMs).toISOString(),
    );
    expect(advanceRunner(oneStep.state, 1_000)).toEqual({ state: oneStep.state, result: null });
  });

  it('keeps Endless time recovery at gates and preserves Story time pickup speed', () => {
    const rin = running();
    const rinTime = collectPickup(rin, { id: 'time-a', kind: 'time' });
    expect(rinTime).toBe(rin);
    const withCoin = collectPickup(rinTime, { id: 'coin-a', kind: 'coin' });
    expect(withCoin.coins).toBe(1);
    expect(withCoin.remainingMs).toBe(90_000);
    expect(rin.coins).toBe(0);

    const storyTime = collectPickup(storyRunning(), { id: 'story-time', kind: 'time' });
    expect(storyTime).toMatchObject({ stageSpeedBoostRemainingMs: 3_000 });
    expect(storyTime.speedUnitsPerSecond).toBeCloseTo(rin.speedUnitsPerSecond * 1.15, 8);
    expect(collectPickup(pauseRunner(rin), { id: 'coin-b', kind: 'coin' }).coins).toBe(0);
  });

  it('applies the speed pickup to current speed for three seconds and refreshes without stacking', () => {
    const initial = running();
    const boosted = collectPickup(initial, { id: 'speed-a', kind: 'speed' });
    expect(boosted).toMatchObject({ speedPickupRemainingMs: 3_000, giantRemainingMs: 0 });
    expect(boosted.speedUnitsPerSecond).toBeCloseTo(initial.speedUnitsPerSecond * 2.5, 8);
    const halfway = advanceRunner(boosted, 1_500).state;
    expect(halfway.speedPickupRemainingMs).toBe(1_500);
    const refreshed = collectPickup(halfway, { id: 'speed-b', kind: 'speed' });
    expect(refreshed.speedPickupRemainingMs).toBe(3_000);
    expect(collectPickup(refreshed, { id: 'speed-b', kind: 'speed' })).toBe(refreshed);

    const oneStep = advanceRunner(boosted, 3_500).state;
    let chunks = boosted;
    for (let index = 0; index < 35; index += 1) chunks = advanceRunner(chunks, 100).state;
    expect(oneStep.distanceMeters).toBeCloseTo(chunks.distanceMeters, 7);
    expect(oneStep.speedPickupRemainingMs).toBe(0);
    expect(oneStep.speedUnitsPerSecond).toBeCloseTo(
      advanceRunner(initial, 3_500).state.speedUnitsPerSecond, 8,
    );
  });

  it('uses one capped multiplier when speed pickup and giant overlap, with independent timers', () => {
    const initial = running();
    const giant = collectPickup(initial, { id: 'giant-speed', kind: 'giant' });
    const giantAndSpeed = collectPickup(giant, { id: 'speed-overlap', kind: 'speed' });
    expect(giantAndSpeed.speedUnitsPerSecond).toBeCloseTo(initial.speedUnitsPerSecond * 2.5, 8);

    const onlyGiant = advanceRunner(giant, 3_500).state;
    const overlap = advanceRunner(giantAndSpeed, 3_500).state;
    expect(overlap.distanceMeters).toBeCloseTo(onlyGiant.distanceMeters, 7);
    expect(overlap).toMatchObject({ giantRemainingMs: 2_500, speedPickupRemainingMs: 0 });
    expect(overlap.speedUnitsPerSecond).toBeCloseTo(onlyGiant.speedUnitsPerSecond, 8);

    const expired = advanceRunner(overlap, 2_500).state;
    expect(expired).toMatchObject({ giantRemainingMs: 0, speedPickupRemainingMs: 0 });
    expect(expired.speedUnitsPerSecond).toBeCloseTo(
      advanceRunner(initial, 6_000).state.speedUnitsPerSecond, 8,
    );
  });

  it('activates and refreshes giant for six seconds without changing score or timer', () => {
    const initial = running();
    const giant = collectPickup(initial, { id: 'giant-0', kind: 'giant' });
    expect(giant).toMatchObject({ giantRemainingMs: 6_000, remainingMs: 90_000, coins: 0 });
    expect(collectPickup(giant, { id: 'giant-0', kind: 'giant' })).toBe(giant);
    const halfway = advanceRunner(giant, 1_500).state;
    expect(halfway.giantRemainingMs).toBe(4_500);
    const refresh = collectPickup(halfway, { id: 'giant-1', kind: 'giant' });
    expect(refresh.giantRemainingMs).toBe(6_000);
    expect(advanceRunner(pauseRunner(refresh), 2_000).state.giantRemainingMs).toBe(6_000);
    expect(advanceRunner(refresh, 6_000).state.giantRemainingMs).toBe(0);
  });

  it('expires giant during stagger while keeping pits lethal and clearing it on Hiyori rescue', () => {
    const giant = { ...running(), giantRemainingMs: 2_000, staggerRemainingMs: 1_200 };
    const frozen = advanceRunner(giant, 1_000).state;
    expect(frozen.distanceMeters).toBe(giant.distanceMeters);
    expect(frozen.giantRemainingMs).toBe(1_000);
    const fatal = applyPitFall({ ...running(), giantRemainingMs: 2_000 });
    expect(fatal.state).toMatchObject({ phase: 'finished', finishReason: 'pit', giantRemainingMs: 0 });
    const rescue = applyPitFall({ ...running('hanayo-hiyori'), giantRemainingMs: 2_000 });
    expect(rescue.state).toMatchObject({ phase: 'running', passiveChargesRemaining: 1, giantRemainingMs: 0 });
  });

  it('decrements temporary speed timers during stagger and keeps pause frozen', () => {
    const boosted = collectPickup(running(), { id: 'stagger-speed', kind: 'speed' });
    const staggered = { ...boosted, staggerRemainingMs: 1_200 };
    const paused = pauseRunner(staggered);
    expect(advanceRunner(paused, 1_000).state.speedPickupRemainingMs).toBe(3_000);
    const recovered = advanceRunner(staggered, 1_200).state;
    expect(recovered.speedPickupRemainingMs).toBe(1_800);
    expect(recovered.distanceMeters).toBe(staggered.distanceMeters);
    expect(recovered.speedUnitsPerSecond).toBeCloseTo(
      advanceRunner(running(), 1_200).state.speedUnitsPerSecond * 2.5, 8,
    );
  });

  it('keeps standard collision penalties for non-guard characters', () => {
    const rin = running();
    const mary = running('tokino-mary');
    expect(applyCollision(rin).remainingMs).toBe(85_000);
    const firstHit = applyCollision(mary);
    expect(firstHit.remainingMs).toBe(85_000);
    expect(firstHit.staggerRemainingMs).toBe(1_200);
    expect(firstHit.protectionRemainingMs).toBe(1_200);
    expect(applyCollision(firstHit)).toBe(firstHit);
    expect(advanceRunner(pauseRunner(firstHit), 2_000).state.protectionRemainingMs).toBe(1_200);

    const recovered = advanceRunner(firstHit, 1_200).state;
    expect(recovered.protectionRemainingMs).toBe(0);
    expect(recovered.staggerRemainingMs).toBe(0);
    expect(applyCollision(recovered).remainingMs).toBe(recovered.remainingMs - 5_000);
    const fatal = applyCollision({ ...rin, remainingMs: 2_000 });
    expect(fatal.phase).toBe('finished');
    expect(fatal.remainingMs).toBe(0);
    expect(fatal.finishedAtElapsedMs).toBe(0);
  });

  it('lets giant ignore ordinary hazards without consuming passives or applying penalties', () => {
    const giant = { ...running('hanayo-hiyori'), giantRemainingMs: 1_000 };
    expect(applyCollision(giant)).toBe(giant);
    expect(giant.passiveChargesRemaining).toBe(2);
  });

  it('gives Hiyori two mixed collision/pit guards without penalties, then restores normal outcomes', () => {
    const initial = running('hanayo-hiyori');
    expect(initial.passiveChargesRemaining).toBe(2);
    const collisionRescue = applyCollision(initial);
    expect(collisionRescue).toMatchObject({
      remainingMs: initial.remainingMs, staggerRemainingMs: 0, protectionRemainingMs: 1_200,
      passiveChargesRemaining: 1, passiveEffectRemainingMs: 700,
      livesRemaining: initial.livesRemaining, hitsTaken: initial.hitsTaken,
    });
    const effectHalfway = advanceRunner(collisionRescue, 300).state;
    expect(effectHalfway.remainingMs).toBe(initial.remainingMs - 300);
    expect(effectHalfway.distanceMeters).toBeGreaterThan(initial.distanceMeters);
    expect(effectHalfway.passiveEffectRemainingMs).toBe(400);

    const pitRescue = applyPitFall(collisionRescue);
    expect(pitRescue.blockedByPassive).toBe(true);
    expect(pitRescue.state).toMatchObject({
      phase: 'running', remainingMs: initial.remainingMs, distanceMeters: initial.distanceMeters,
      passiveChargesRemaining: 0, passiveEffectRemainingMs: 700,
      livesRemaining: initial.livesRemaining, hitsTaken: initial.hitsTaken,
    });

    const afterProtection = advanceRunner(pitRescue.state, RUNNER_CONFIG.protectionMs).state;
    const thirdCollision = applyCollision(afterProtection);
    expect(thirdCollision.remainingMs).toBe(afterProtection.remainingMs - RUNNER_CONFIG.collisionPenaltyMs);
    expect(thirdCollision.staggerRemainingMs).toBe(RUNNER_CONFIG.staggerMs);
    const fatalPit = applyPitFall(pitRescue.state);
    expect(fatalPit.blockedByPassive).toBe(false);
    expect(fatalPit.state).toMatchObject({ phase: 'finished', finishReason: 'pit', remainingMs: 0 });
  });

  it("lets Toa's opening slide guard cancel one hit and enforces its 20-second cooldown", () => {
    const initial = running('goth-student');
    const sliding = beginRunnerSlide(initial);
    expect(sliding.slideGuardRemainingMs).toBe(250);

    const guarded = applyCollision(sliding, true);
    expect(guarded).toMatchObject({
      remainingMs: initial.remainingMs,
      livesRemaining: initial.livesRemaining,
      hitsTaken: initial.hitsTaken,
      slideGuardRemainingMs: 0,
      slideGuardCooldownRemainingMs: 20_000,
      passiveEffectRemainingMs: 500,
    });

    expect(beginRunnerSlide(guarded)).toBe(guarded);
    const cooldownAlmostDone = advanceRunner(guarded, 19_999).state;
    expect(cooldownAlmostDone.slideGuardCooldownRemainingMs).toBe(1);
    expect(beginRunnerSlide(cooldownAlmostDone)).toBe(cooldownAlmostDone);
    const ready = advanceRunner(cooldownAlmostDone, 1).state;
    expect(beginRunnerSlide(ready).slideGuardRemainingMs).toBe(250);
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

  it('awards every gate reached while bonus time keeps the run active', () => {
    const nearGate = {
      ...running(), distanceMeters: 1_990, worldDistance: 1_990 * 3, remainingMs: 500,
    };
    const advanced = advanceRunner(nearGate, 30_000);
    expect(advanced.state.passedGateIds).toEqual(['gate-2000', 'gate-4000']);
    expect(advanced.state.phase).toBe('running');
    expect(advanced.state.elapsedMs).toBe(30_000);
    expect(advanced.state.distanceMeters).toBeGreaterThan(4_000);

    const allGatesPassed = {
      ...running(), distanceMeters: 1_900, worldDistance: 1_900 * 3, remainingMs: 500,
      passedGateIds: RUNNER_GATE_DISTANCES_M.map((distance) => `gate-${distance}` as const),
    };
    const atTimeout = advanceRunner(allGatesPassed, 500);
    const overshot = advanceRunner(allGatesPassed, 30_000);
    expect(overshot.state.phase).toBe('finished');
    expect(overshot.state.remainingMs).toBe(0);
    expect(overshot.state.elapsedMs).toBe(500);
    expect(overshot.state.distanceMeters).toBeCloseTo(atTimeout.state.distanceMeters, 8);
  });

  it('keeps final results stable and rounds meters only at the result boundary', () => {
    const state = { ...running(), distanceMeters: 12.6, worldDistance: 37.8, coins: 4 };
    const finished = finishRunner(state, new Date('2026-10-26T01:00:00.000Z'));
    expect(finished.result).toMatchObject({
      characterId: 'player-default', distanceMeters: 13, coins: 4,
      durationMs: 0, finishedAtIso: '2026-10-26T01:00:00.000Z', finishReason: 'timeout',
    });
    expect(finishRunner(finished.state).result).toEqual(finished.result);
    expect(finishRunner(state, undefined, 'pit').result.finishReason).toBe('pit');
    expect(state.phase).toBe('running');
  });
});
