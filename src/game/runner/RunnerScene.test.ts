import { describe, expect, it, vi } from 'vitest';
import type { RunnerResult } from './runnerTypes';

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
      coins: 0, durationMs: 1000, finishedAtIso: '2026-10-27T00:00:00.000Z' };

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
      coins: 0, durationMs: 1000, finishedAtIso: '2026-10-27T00:00:00.000Z' };
    harness.emitFinished(result);
    expect(finishPlayer).toHaveBeenCalledExactlyOnceWith('gameOver');
    expect(finishEvent).toHaveBeenCalledExactlyOnceWith(result, 'completed');
  });
});
