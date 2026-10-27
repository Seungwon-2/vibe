import { describe, expect, it, vi } from 'vitest';
import type { RunnerResult } from './runnerTypes';
import { createRunnerSnapshot, startRunner } from './RunnerSimulation';

const record = vi.hoisted(() => vi.fn());
vi.mock('phaser', () => ({ default: { Scene: class {} } }));
vi.mock('../../services/PersonalBestStore', () => ({
  browserPersonalBestStore: { record },
}));

import { RunnerScene } from './RunnerScene';

describe('RunnerScene finish boundary', () => {
  it('records and plays the first terminal action only once across finish paths', () => {
    record.mockReset().mockReturnValue({ isNewBest: true });
    const scene = new RunnerScene();
    const clear = vi.fn();
    const finishPlayer = vi.fn();
    const finishEvent = vi.fn();
    const harness = scene as unknown as {
      inputBridge: { clear(): void };
      player: { finish(outcome: string): void };
      eventEmitter: { finish(result: RunnerResult, outcome: string): void };
      emitFinished(result: RunnerResult): void;
    };
    harness.inputBridge = { clear };
    harness.player = { finish: finishPlayer };
    harness.eventEmitter = { finish: finishEvent };
    const result: RunnerResult = { characterId: 'player-default', distanceMeters: 10,
      coins: 0, durationMs: 1000, finishedAtIso: '2026-10-27T00:00:00.000Z', finishReason: 'timeout' };

    harness.emitFinished(result);
    harness.emitFinished(result);

    expect(record).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(finishPlayer).toHaveBeenCalledExactlyOnceWith('victory');
    expect(finishEvent).toHaveBeenCalledExactlyOnceWith(result, 'personal-best');
  });

  it('uses the crying action for a completed run below the saved best', () => {
    record.mockReset().mockReturnValue({ isNewBest: false });
    const scene = new RunnerScene();
    const finishPlayer = vi.fn();
    const finishEvent = vi.fn();
    const harness = scene as unknown as {
      inputBridge: { clear(): void };
      player: { finish(outcome: string): void };
      eventEmitter: { finish(result: RunnerResult, outcome: string): void };
      emitFinished(result: RunnerResult): void;
    };
    harness.inputBridge = { clear: vi.fn() };
    harness.player = { finish: finishPlayer };
    harness.eventEmitter = { finish: finishEvent };
    const result: RunnerResult = { characterId: 'tokino-mary', distanceMeters: 50,
      coins: 0, durationMs: 1000, finishedAtIso: '2026-10-27T00:00:00.000Z', finishReason: 'timeout' };
    harness.emitFinished(result);
    expect(finishPlayer).toHaveBeenCalledExactlyOnceWith('gameOver');
    expect(finishEvent).toHaveBeenCalledExactlyOnceWith(result, 'completed');
  });

  it('keeps pit falls as game over even when the distance sets a personal best', () => {
    record.mockReset().mockReturnValue({ isNewBest: true });
    const scene = new RunnerScene();
    const finishPlayer = vi.fn();
    const finishEvent = vi.fn();
    const snapshotEvent = vi.fn();
    const clear = vi.fn();
    const harness = scene as unknown as {
      snapshot: ReturnType<typeof createRunnerSnapshot>;
      finishEmitted: boolean;
      inputBridge: { clear(): void };
      heldKeyboardActions: Set<string>;
      player: { finish(outcome: string): void };
      eventEmitter: {
        snapshot(snapshot: unknown, now: number, force: boolean): void;
        finish(result: RunnerResult, outcome: string): void;
      };
      time: { now: number };
      handlePitFall(pit: { id: string; distanceMeters: number; widthMeters: number; tutorialWarning: boolean }): void;
    };
    harness.snapshot = { ...startRunner(createRunnerSnapshot('player-default')),
      distanceMeters: 845, worldDistance: 2_535, coins: 7 };
    harness.finishEmitted = false;
    harness.inputBridge = { clear };
    harness.heldKeyboardActions = new Set(['Space']);
    harness.player = { finish: finishPlayer };
    harness.eventEmitter = { snapshot: snapshotEvent, finish: finishEvent };
    harness.time = { now: 123 };

    const pit = { id: 'pit-850', distanceMeters: 850, widthMeters: 30, tutorialWarning: true };
    harness.handlePitFall(pit);
    harness.handlePitFall(pit);

    expect(harness.snapshot).toMatchObject({ phase: 'finished', distanceMeters: 845,
      coins: 7, remainingMs: 0, finishReason: 'pit' });
    expect(snapshotEvent).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledOnce();
    expect(harness.heldKeyboardActions.size).toBe(0);
    expect(finishPlayer).toHaveBeenCalledExactlyOnceWith('gameOver');
    expect(finishEvent).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ finishReason: 'pit', distanceMeters: 845, coins: 7 }), 'personal-best',
    );
  });
});
