import { describe, expect, it, vi } from 'vitest';
import type { RunnerResult, RunnerSnapshot } from './runnerTypes';
import type { PitDefinition, PitFallContactResult } from './PitSpawner';
import { createRunnerSnapshot, startRunner } from './RunnerSimulation';
import { RUNNER_CONFIG } from './runnerConfig';

const record = vi.hoisted(() => vi.fn());
vi.mock('phaser', () => ({ default: { Scene: class {}, Loader: { Events: { FILE_LOAD_ERROR: 'fileloaderror' } } } }));
vi.mock('../../services/PersonalBestStore', () => ({
  browserPersonalBestStore: { record },
}));

import { RunnerScene } from './RunnerScene';

describe('RunnerScene finish boundary', () => {
  it('passes frame delta to the collectible magnet update', () => {
    const scene = new RunnerScene();
    const state = startRunner(createRunnerSnapshot('tokino-mary'));
    const sprite = { x: 170, y: 470 };
    const collectiblesUpdate = vi.fn();
    const harness = scene as unknown as {
      snapshot: RunnerSnapshot;
      inputBridge: { consumeFrame(): { slideHeld: boolean; jumpPressed: boolean } };
      player: {
        gameObject: typeof sprite;
        isGrounded: boolean;
        setSliding(held: boolean): boolean;
        jump(): boolean;
        update(deltaMs: number): void;
        setHurt(active: boolean): void;
        setProtected(durationMs: number): void;
        setPassiveEffect(durationMs: number): void;
        setGiant(active: boolean): void;
      };
      backdrop: { update(snapshot: RunnerSnapshot, deltaMs: number): void };
      trailEffect: { update(...args: unknown[]): void };
      eventEmitter: { gate(...args: unknown[]): void };
      spawner: { update(snapshot: RunnerSnapshot): void };
      collectibles: { update(snapshot: RunnerSnapshot, deltaMs: number): void };
      pits: { update(snapshot: RunnerSnapshot): void };
      time: { now: number };
      drawPassiveEffect(...args: unknown[]): void;
      publish(snapshot: RunnerSnapshot, force: boolean): void;
      update(time: number, deltaMs: number): void;
    };
    harness.snapshot = state;
    harness.inputBridge = { consumeFrame: () => ({ slideHeld: false, jumpPressed: false }) };
    harness.player = {
      gameObject: sprite,
      isGrounded: true,
      setSliding: () => false,
      jump: () => false,
      update: vi.fn(),
      setHurt: vi.fn(),
      setProtected: vi.fn(),
      setPassiveEffect: vi.fn(),
      setGiant: vi.fn(),
    };
    harness.backdrop = { update: vi.fn() };
    harness.trailEffect = { update: vi.fn() };
    harness.eventEmitter = { gate: vi.fn() };
    harness.spawner = { update: vi.fn() };
    harness.collectibles = { update: collectiblesUpdate };
    harness.pits = { update: vi.fn() };
    harness.time = { now: 16 };
    harness.drawPassiveEffect = vi.fn();
    harness.publish = (next) => { harness.snapshot = next; };

    harness.update(0, 16);

    expect(collectiblesUpdate).toHaveBeenCalledWith(expect.objectContaining({ phase: 'running' }), 16);
  });

  it('loads only the selected character quality frames for gameplay', () => {
    const scene = new RunnerScene();
    const images: [string, string][] = [];
    const harness = scene as unknown as {
      registry: { get(key: string): string };
      load: { image(key: string, url: string): void; on(): void };
      preload(): void;
    };
    harness.registry = { get: () => 'player-default' };
    harness.load = { image: (key, url) => images.push([key, url]), on: vi.fn() };
    harness.preload();
    expect(images).toHaveLength(12 + 6 * 6);
    expect(images.every(([, url]) => url.includes('/assets/character/'))).toBe(true);
    expect(images.some(([key]) => key.startsWith('player-default:quality:run:'))).toBe(true);
    expect(images.some(([, url]) => url.includes('/runtime/'))).toBe(false);
  });

  it('disables the floor collision while the player body overlaps a pit opening', () => {
    const scene = new RunnerScene();
    const harness = scene as unknown as {
      player: { body: { left: number; right: number } };
      pits: { isPlayerFootInPitOpening(footX: number): boolean };
      shouldCollideWithFloor(): boolean;
    };
    harness.player = { body: { left: 150, right: 190 } };
    harness.pits = { isPlayerFootInPitOpening: (footX) => footX >= 125 && footX <= 215 };

    expect(harness.shouldCollideWithFloor()).toBe(false);
    harness.player.body.left = 80;
    harness.player.body.right = 120;
    expect(harness.shouldCollideWithFloor()).toBe(true);
  });

  it('records and plays the first terminal action only once across finish paths', () => {
    record.mockReset().mockReturnValue({ isNewBest: true });
    const scene = new RunnerScene();
    const clear = vi.fn();
    const finishPlayer = vi.fn();
    const finishEvent = vi.fn();
    const harness = scene as unknown as {
      inputBridge: { clear(): void };
      trailEffect: { clear(): void };
      player: { finish(outcome: string): void };
      eventEmitter: { finish(result: RunnerResult, outcome: string): void };
      emitFinished(result: RunnerResult): void;
    };
    harness.inputBridge = { clear };
    harness.trailEffect = { clear: vi.fn() };
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
      trailEffect: { clear(): void };
      player: { finish(outcome: string): void };
      eventEmitter: { finish(result: RunnerResult, outcome: string): void };
      emitFinished(result: RunnerResult): void;
    };
    harness.inputBridge = { clear: vi.fn() };
    harness.trailEffect = { clear: vi.fn() };
    harness.player = { finish: finishPlayer };
    harness.eventEmitter = { finish: finishEvent };
    const result: RunnerResult = { characterId: 'tokino-mary', distanceMeters: 50,
      coins: 0, durationMs: 1000, finishedAtIso: '2026-10-27T00:00:00.000Z', finishReason: 'timeout' };
    harness.emitFinished(result);
    expect(finishPlayer).toHaveBeenCalledExactlyOnceWith('gameOver');
    expect(finishEvent).toHaveBeenCalledExactlyOnceWith(result, 'completed');
  });

  it('holds the Story game-over pose for one second after the last life is lost', () => {
    record.mockReset();
    const scene = new RunnerScene();
    const clearInput = vi.fn();
    const clearTrail = vi.fn();
    const finishPlayer = vi.fn();
    const finishEvent = vi.fn();
    let finishAfterHold: (() => void) | undefined;
    const harness = scene as unknown as {
      finishEmitted: boolean;
      finishPending: boolean;
      inputBridge: { clear(): void };
      heldKeyboardActions: Set<string>;
      trailEffect: { clear(): void };
      player: { finish(outcome: string): void };
      eventEmitter: { finish(result: RunnerResult, outcome: string): void };
      time: { delayedCall(delay: number, callback: () => void): unknown };
      beginStoryDefeat(result: RunnerResult): void;
    };
    const result: RunnerResult = { characterId: 'hanayo-hiyori', mode: 'story', storyStageId: 'dawn-city',
      hitsTaken: 3, livesRemaining: 0, nearMissScore: 0, passedGateCount: 0, completedStage: false,
      distanceMeters: 1_200, coins: 4, durationMs: 15_000,
      finishedAtIso: '2026-11-02T00:00:00.000Z', finishReason: 'lives-exhausted' };
    harness.finishEmitted = false;
    harness.finishPending = false;
    harness.inputBridge = { clear: clearInput };
    harness.heldKeyboardActions = new Set(['Space']);
    harness.trailEffect = { clear: clearTrail };
    harness.player = { finish: finishPlayer };
    harness.eventEmitter = { finish: finishEvent };
    harness.time = { delayedCall: (delay, callback) => {
      expect(delay).toBe(RUNNER_CONFIG.storyDefeatHoldMs);
      finishAfterHold = callback;
      return {} as never;
    } };

    harness.beginStoryDefeat(result);

    expect(harness.finishPending).toBe(true);
    expect(clearInput).toHaveBeenCalledOnce();
    expect(clearTrail).toHaveBeenCalledOnce();
    expect(harness.heldKeyboardActions.size).toBe(0);
    expect(finishPlayer).toHaveBeenCalledExactlyOnceWith('gameOver');
    expect(finishEvent).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();

    finishAfterHold?.();

    expect(harness.finishPending).toBe(false);
    expect(finishEvent).toHaveBeenCalledExactlyOnceWith(result, 'completed');
    expect(record).not.toHaveBeenCalled();
  });

  it('delays a fatal pit result until after the fall and camera shake, preserving contact-time data', () => {
    record.mockReset().mockReturnValue({ isNewBest: true });
    const scene = new RunnerScene();
    const finishPlayer = vi.fn();
    const finishEvent = vi.fn();
    const snapshotEvent = vi.fn();
    const clear = vi.fn();
    const fallTweens: { targets: typeof sprite; y: number; duration: number; onComplete(): void }[] = [];
    const shake = vi.fn();
    let finalize: (() => void) | undefined;
    const sprite = { y: 474 };
    const harness = scene as unknown as {
      snapshot: ReturnType<typeof createRunnerSnapshot>;
      finishEmitted: boolean;
      pitFallCinematicActive: boolean;
      inputBridge: { clear(): void };
      trailEffect: { clear(): void };
      heldKeyboardActions: Set<string>;
      player: { gameObject: typeof sprite; beginPitFall(): void; setGiant(active: boolean): void; finish(outcome: string): void; update(delta: number): void };
      passiveEffectArt: { clear(): void };
      eventEmitter: {
        snapshot(snapshot: unknown, now: number, force: boolean): void;
        pitFallStarted(): void;
        finish(result: RunnerResult, outcome: string): void;
      };
      time: { now: number };
      tweens: { add(config: { targets: typeof sprite; y: number; duration: number; ease: string; onComplete(): void }): unknown };
      cameras: { main: { shake(duration: number, intensity: number): void } };
      finalizePitFall(): void;
      update(time: number, delta: number): void;
      handlePitFall(pit: PitDefinition): PitFallContactResult;
    };
    const contactSnapshot = { ...startRunner(createRunnerSnapshot('player-default')),
      distanceMeters: 845, worldDistance: 2_535, coins: 7, elapsedMs: 31_000, remainingMs: 59_000 };
    harness.snapshot = contactSnapshot;
    harness.finishEmitted = false;
    harness.inputBridge = { clear };
    harness.trailEffect = { clear: vi.fn() };
    harness.heldKeyboardActions = new Set(['Space']);
    harness.player = { gameObject: sprite, beginPitFall: vi.fn(), setGiant: vi.fn(), finish: finishPlayer, update: vi.fn() };
    harness.passiveEffectArt = { clear: vi.fn() };
    const pitFallStarted = vi.fn();
    harness.eventEmitter = { snapshot: snapshotEvent, pitFallStarted, finish: finishEvent };
    harness.time = { now: 123 };
    harness.tweens = { add: (config) => { fallTweens.push(config); return {} as never; } };
    harness.cameras = { main: { shake } };
    (harness as unknown as { time: { now: number; delayedCall(delay: number, callback: () => void): unknown } }).time = {
      now: 123,
      delayedCall: (delay, callback) => { expect(delay).toBe(250); finalize = callback; return {} as never; },
    };

    const pit = { id: 'pit-850', distanceMeters: 850, widthMeters: 30, tutorialWarning: true };
    expect(harness.handlePitFall(pit)).toBe('fatal');
    expect(harness.handlePitFall(pit)).toBe('ignored');

    expect(harness.snapshot).toBe(contactSnapshot);
    expect(harness.snapshot).toMatchObject({ phase: 'running', distanceMeters: 845, coins: 7, remainingMs: 59_000 });
    expect(harness.pitFallCinematicActive).toBe(true);
    expect(pitFallStarted).toHaveBeenCalledOnce();
    expect(fallTweens).toHaveLength(1);
    expect(fallTweens[0]).toMatchObject({ y: 620, duration: 700, ease: 'Cubic.In' });
    expect(snapshotEvent).not.toHaveBeenCalled();
    expect(clear).toHaveBeenCalledOnce();
    expect(harness.heldKeyboardActions.size).toBe(0);
    expect(record).not.toHaveBeenCalled();
    expect(finishPlayer).not.toHaveBeenCalled();
    expect(fallTweens[0].targets).toBe(sprite);

    // The normal update loop cannot advance any simulation systems during the cinematic.
    const updatePlayer = vi.fn();
    harness.player.update = updatePlayer;
    harness.update(456, 16);
    expect(harness.snapshot).toBe(contactSnapshot);
    expect(updatePlayer).not.toHaveBeenCalled();

    fallTweens[0].onComplete();
    expect(shake).toHaveBeenCalledExactlyOnceWith(250, 0.012);
    expect(finalize).toBeTypeOf('function');
    expect(record).not.toHaveBeenCalled();
    finalize?.();
    expect(harness.snapshot).toMatchObject({ phase: 'finished', distanceMeters: 845,
      coins: 7, remainingMs: 0, finishReason: 'pit', elapsedMs: 31_000 });
    expect(snapshotEvent).toHaveBeenCalledOnce();
    expect(record).toHaveBeenCalledOnce();
    expect(finishPlayer).toHaveBeenCalledExactlyOnceWith('gameOver');
    expect(finishEvent).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ finishReason: 'pit', distanceMeters: 845, coins: 7 }), 'personal-best',
    );
  });

  it('plays Hiyori\'s brief near-fall bounce and continues without ending the run', () => {
    const scene = new RunnerScene();
    const sceneTweens: { y: number; duration: number; onComplete(): void }[] = [];
    const snapshotEvent = vi.fn();
    const triggerEvent = vi.fn();
    const beginRescue = vi.fn();
    const endRescue = vi.fn();
    const setEffect = vi.fn();
    const clear = vi.fn();
    const sprite = { y: 474 };
    const harness = scene as unknown as {
      snapshot: ReturnType<typeof createRunnerSnapshot>;
      finishEmitted: boolean;
      inputBridge: { clear(): void };
      trailEffect: { clear(): void };
      heldKeyboardActions: Set<string>;
      player: {
        gameObject: typeof sprite;
        setPassiveEffect(remainingMs: number): void;
        setProtected(remainingMs: number): void;
        setGiant(active: boolean): void;
        beginPitRescue(): void;
        endPitRescue(): void;
        finish(outcome: string): void;
      };
      eventEmitter: {
        snapshot(snapshot: unknown, now: number, force: boolean): void;
        passiveTriggered(remainingCharges: number, trigger: 'pit' | 'obstacle'): void;
        finish(result: RunnerResult, outcome: string): void;
      };
      time: { now: number };
      tweens: { add(config: { y: number; duration: number; onComplete(): void }): unknown };
      handlePitFall(pit: PitDefinition): PitFallContactResult;
    };
    harness.snapshot = startRunner(createRunnerSnapshot('hanayo-hiyori'));
    harness.finishEmitted = false;
    harness.inputBridge = { clear };
    harness.trailEffect = { clear: vi.fn() };
    harness.heldKeyboardActions = new Set(['Space']);
    harness.player = { gameObject: sprite, setPassiveEffect: setEffect, setProtected: vi.fn(), setGiant: vi.fn(), beginPitRescue: beginRescue,
      endPitRescue: endRescue, finish: vi.fn() };
    harness.eventEmitter = { snapshot: snapshotEvent, passiveTriggered: triggerEvent, finish: vi.fn() };
    harness.time = { now: 50 };
    harness.tweens = { add: (config) => { sceneTweens.push(config); return {}; } };

    expect(harness.handlePitFall({ id: 'pit-850', distanceMeters: 850, widthMeters: 30,
      tutorialWarning: true })).toBe('rescued');

    expect(harness.snapshot).toMatchObject({ phase: 'running', passiveChargesRemaining: 1,
      passiveEffectRemainingMs: 700, remainingMs: 90_000 });
    expect(beginRescue).toHaveBeenCalledOnce();
    expect(setEffect).toHaveBeenCalledWith(700);
    expect(triggerEvent).toHaveBeenCalledExactlyOnceWith(1, 'pit');
    expect(sceneTweens[0]).toMatchObject({ y: 510, duration: 180 });
    expect(harness.heldKeyboardActions.size).toBe(0);
    expect(clear).toHaveBeenCalledOnce();
    expect(record).not.toHaveBeenCalled();

    sceneTweens[0].onComplete();
    expect(sceneTweens[1]).toMatchObject({ y: 474, duration: 320 });
    sceneTweens[1].onComplete();
    expect(endRescue).toHaveBeenCalledOnce();
    expect(record).not.toHaveBeenCalled();
  });
});
