import { describe, expect, it, vi } from 'vitest';
import { advanceRunner, createRunnerSnapshot, startRunner } from './RunnerSimulation';
import { RunnerEventEmitter, type RunnerEvent } from './runnerEvents';

describe('runner event bridge', () => {
  it('bounds snapshots to 10Hz and forces state changes immediately', () => {
    const events: RunnerEvent[] = [];
    const onSnapshot = vi.fn();
    const bridge = new RunnerEventEmitter({ onSnapshot, onFinished: vi.fn(),
      onEvent: (event) => events.push(event) });
    const state = startRunner(createRunnerSnapshot('player-default'));
    bridge.snapshot(state, 0);
    bridge.snapshot(state, 16);
    bridge.snapshot(state, 99);
    bridge.snapshot(state, 100);
    bridge.snapshot(state, 116, true);
    expect(onSnapshot).toHaveBeenCalledTimes(3);
    expect(events.filter((event) => event.type === 'snapshot')).toHaveLength(3);
  });

  it('deduplicates pickup, gate, and terminal events', () => {
    const events: RunnerEvent[] = [];
    const onFinished = vi.fn();
    const bridge = new RunnerEventEmitter({ onSnapshot: vi.fn(), onFinished,
      onEvent: (event) => events.push(event) });
    const result = { characterId: 'cogane-rang' as const, distanceMeters: 300,
      coins: 2, durationMs: 3000, finishedAtIso: '2026-10-26T00:00:03.000Z' };
    bridge.pickup('coin-a', 'coin', 0);
    bridge.pickup('coin-a', 'coin', 0);
    bridge.gate('gate-2500', 20_000);
    bridge.gate('gate-2500', 20_000);
    bridge.finish(result);
    bridge.finish(result);
    expect(events.map((event) => event.type)).toEqual(['pickup', 'gate', 'run-finished']);
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('reports the actual capped gate bonus from the simulation', () => {
    const awards: number[] = [];
    const state = { ...startRunner(createRunnerSnapshot('player-default')),
      distanceMeters: 2490, worldDistance: 7470, remainingMs: 119_900 };
    const next = advanceRunner(state, 200, (_id, awardedMs) => awards.push(awardedMs));
    expect(next.state.passedGateIds).toEqual(['gate-2500']);
    expect(awards).toHaveLength(1);
    expect(awards[0]).toBeGreaterThan(0);
    expect(awards[0]).toBeLessThan(20_000);
    expect(next.state.remainingMs).toBeLessThanOrEqual(120_000);
  });
});
