import { describe, expect, it } from 'vitest';
import { getHazardGeometry, tryResolveHazardHit } from './CollisionSystem';
import { createRunnerSnapshot, startRunner } from './RunnerSimulation';
import type { HazardDefinition } from './hazardTypes';

const ground: HazardDefinition = { id: 'spikes', kind: 'ground', offsetMeters: 0,
  width: 46, height: 48, warningColor: '#ffcf6b' };
const overhead: HazardDefinition = { id: 'bar', kind: 'overhead', offsetMeters: 0,
  width: 64, height: 36, warningColor: '#8fe5f8' };

describe('hazard collision', () => {
  it('uses boxes aligned to standing and sliding silhouettes', () => {
    expect(getHazardGeometry(ground, 100)).toEqual({ x: 100, y: 422, width: 46, height: 48 });
    expect(getHazardGeometry(overhead, 100)).toEqual({ x: 100, y: 392, width: 64, height: 36 });
    expect(getHazardGeometry(overhead, 100).y + overhead.height).toBeLessThan(430);
  });

  it('applies one penalty then ignores overlaps during protection', () => {
    const initial = startRunner(createRunnerSnapshot('player-default', new Date('2026-10-26T00:00:00Z')));
    const first = tryResolveHazardHit(initial);
    expect(first.hit).toBe(true);
    expect(first.state.remainingMs).toBe(85_000);
    expect(first.state.protectionRemainingMs).toBe(800);
    expect(tryResolveHazardHit(first.state)).toEqual({ state: first.state, hit: false, result: null });
    const lize = startRunner(createRunnerSnapshot('akane-lize'));
    expect(tryResolveHazardHit(lize).state.remainingMs).toBe(86_000);
  });

  it('finishes once when a collision depletes the remaining timer', () => {
    const initial = startRunner(createRunnerSnapshot('player-default'));
    const hit = tryResolveHazardHit({ ...initial, remainingMs: 4_000 });
    expect(hit.state.phase).toBe('finished');
    expect(hit.result?.distanceMeters).toBe(0);
    expect(tryResolveHazardHit(hit.state).hit).toBe(false);
  });
});
