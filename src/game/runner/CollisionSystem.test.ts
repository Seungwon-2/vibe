import { describe, expect, it } from 'vitest';
import { getHazardCollisionGeometry, getHazardGeometry, getHazardVisualGeometry, isHazardDodgedBySlide,
  tryResolveHazardHit, tryResolvePitFall } from './CollisionSystem';
import { createRunnerSnapshot, startRunner } from './RunnerSimulation';
import type { HazardDefinition } from './hazardTypes';
import { RUNNER_CONFIG } from './runnerConfig';
import { RUNNER_GROUND_Y } from './runnerPose';

const ground: HazardDefinition = { id: 'spikes', kind: 'ground', offsetMeters: 0,
  width: 46, height: 48, warningColor: '#ffcf6b' };
const overhead: HazardDefinition = { id: 'bar', kind: 'overhead', offsetMeters: 0,
  width: 64, height: 36, warningColor: '#8fe5f8' };
const highBarrier: HazardDefinition = { id: 'wall', kind: 'double-jump', offsetMeters: 0,
  width: 64, height: 156, warningColor: '#ff9a66' };

describe('hazard collision', () => {
  it('uses boxes aligned to standing and sliding silhouettes', () => {
    expect(getHazardGeometry(ground, 100)).toEqual({ x: 100, y: 422, width: 46, height: 48 });
    expect(getHazardGeometry(overhead, 100)).toEqual({ x: 100, y: 380, width: 64, height: 36 });
    expect(getHazardGeometry(highBarrier, 100)).toEqual({ x: 100, y: RUNNER_GROUND_Y - 156, width: 64, height: 156 });
    expect(getHazardGeometry(overhead, 100).y + overhead.height).toBeLessThan(430);
  });

  it('extends overhead collision through the full runner lane while leaving its artwork geometry unchanged', () => {
    expect(getHazardCollisionGeometry(overhead, 100)).toEqual({ x: 100, y: 0, width: 64, height: RUNNER_GROUND_Y });
    expect(getHazardCollisionGeometry(ground, 100)).toEqual(getHazardGeometry(ground, 100));
    expect(getHazardGeometry(overhead, 100)).toEqual({ x: 100, y: 380, width: 64, height: 36 });
  });

  it('gives overhead artwork a full-height canvas while ground art keeps its original size', () => {
    expect(getHazardVisualGeometry(overhead, 100)).toEqual({
      x: 100, y: 0, width: 64, height: RUNNER_GROUND_Y,
    });
    expect(getHazardVisualGeometry(ground, 100)).toEqual(getHazardGeometry(ground, 100));
  });

  it('allows only a grounded slide to dodge overhead hazards', () => {
    expect(isHazardDodgedBySlide(overhead, true)).toBe(true);
    expect(isHazardDodgedBySlide(overhead, false)).toBe(false);
    expect(isHazardDodgedBySlide(ground, true)).toBe(false);
    expect(isHazardDodgedBySlide(highBarrier, true)).toBe(false);
  });

  it('sets the tall barrier between one-jump and well-timed double-jump ceilings', () => {
    const { gravityY, jumpImpulseY, doubleJumpBarrierHeightPx } = RUNNER_CONFIG;
    const oneJumpHeight = Math.abs(jumpImpulseY) ** 2 / (2 * gravityY);
    const doubleJumpHeight = oneJumpHeight * 2;

    expect(oneJumpHeight).toBeLessThan(doubleJumpBarrierHeightPx);
    expect(doubleJumpHeight).toBeGreaterThan(doubleJumpBarrierHeightPx);
  });

  it('applies one penalty then ignores overlaps during protection', () => {
    const initial = startRunner(createRunnerSnapshot('player-default', new Date('2026-10-26T00:00:00Z')));
    const first = tryResolveHazardHit(initial);
    expect(first.hit).toBe(true);
    expect(first.state.remainingMs).toBe(85_000);
    expect(first.state.livesRemaining).toBe(2);
    expect(first.state.protectionRemainingMs).toBe(1_200);
    expect(tryResolveHazardHit(first.state)).toEqual({ state: first.state, hit: false, blockedByPassive: false, passiveId: null, result: null });
    const mary = startRunner(createRunnerSnapshot('tokino-mary'));
    expect(tryResolveHazardHit(mary).state.remainingMs).toBe(85_000);
    expect(tryResolveHazardHit(mary).state.protectionRemainingMs).toBe(1_200);

    const hiyori = startRunner(createRunnerSnapshot('hanayo-hiyori'));
    const guarded = tryResolveHazardHit(hiyori);
    expect(guarded).toMatchObject({ hit: true, blockedByPassive: true, result: null });
    expect(guarded.state).toMatchObject({ remainingMs: 90_000, passiveChargesRemaining: 1, protectionRemainingMs: 1_200 });
  });

  it('treats ordinary hazard overlap as passed while giant is active', () => {
    const initial = { ...startRunner(createRunnerSnapshot('player-default')), giantRemainingMs: 1_000 };
    expect(tryResolveHazardHit(initial)).toMatchObject({
      state: initial, hit: false, blockedByPassive: false, passiveId: null, result: null,
    });
  });

  it('finishes once when a collision depletes the remaining timer', () => {
    const initial = startRunner(createRunnerSnapshot('player-default'));
    const hit = tryResolveHazardHit({ ...initial, remainingMs: 4_000 });
    expect(hit.state.phase).toBe('finished');
    expect(hit.result?.distanceMeters).toBe(0);
    expect(tryResolveHazardHit(hit.state).hit).toBe(false);
  });

  it('blocks a pit while Hiyori has a charge and returns a fatal pit result after charges are spent', () => {
    const initial = startRunner(createRunnerSnapshot('hanayo-hiyori'));
    expect(tryResolvePitFall(initial)).toMatchObject({
      blockedByPassive: true, result: null,
      state: { phase: 'running', passiveChargesRemaining: 1, remainingMs: 90_000 },
    });
    const noCharges = { ...initial, passiveChargesRemaining: 0, distanceMeters: 845, coins: 3 };
    expect(tryResolvePitFall(noCharges)).toMatchObject({
      blockedByPassive: false,
      result: { finishReason: 'pit', distanceMeters: 845, coins: 3 },
      state: { phase: 'finished', finishReason: 'pit' },
    });
  });
});
