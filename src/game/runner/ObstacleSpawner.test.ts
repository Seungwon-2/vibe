import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createRunnerSnapshot, startRunner } from './RunnerSimulation';
import { ObstacleSpawner } from './ObstacleSpawner';

type MockChainObject = Record<string, unknown> & {
  destroy: ReturnType<typeof vi.fn>;
  body: Record<string, unknown>;
};

function makeChainObject(): MockChainObject {
  const target: MockChainObject = {
    body: { setAllowGravity: vi.fn(), setImmovable: vi.fn(), setSize: vi.fn() },
    destroy: vi.fn(),
  };
  const proxy: MockChainObject = new Proxy(target, {
    get: (object, property) => {
      if (typeof property !== 'string') return undefined;
      if (property in object) return object[property];
      const method = vi.fn(() => proxy);
      object[property] = method;
      return method;
    },
  });
  return proxy;
}

function makeScene() {
  const rectangles: ReturnType<typeof makeChainObject>[] = [];
  const graphics: ReturnType<typeof makeChainObject>[] = [];
  const texts: ReturnType<typeof makeChainObject>[] = [];
  const overlaps: (() => void)[] = [];
  const scene = {
    add: {
      rectangle: vi.fn(() => { const item = makeChainObject(); rectangles.push(item); return item; }),
      graphics: vi.fn(() => { const item = makeChainObject(); graphics.push(item); return item; }),
      text: vi.fn(() => { const item = makeChainObject(); texts.push(item); return item; }),
    },
    physics: { add: {
      existing: vi.fn(),
      overlap: vi.fn((_player: unknown, _box: unknown, callback: () => void) => overlaps.push(callback)),
    } },
  };
  return { scene: scene as unknown as Phaser.Scene, rectangles, graphics, texts, overlaps };
}

function snapshotAt(distanceMeters: number, phase: 'running' | 'paused' = 'running') {
  return { ...startRunner(createRunnerSnapshot('player-default')),
    phase, distanceMeters, worldDistance: distanceMeters * 3 };
}

describe('ObstacleSpawner schedule', () => {
  it('skips whole patterns in pit zones, freezes while paused, and cleans up spawned objects', () => {
    const mock = makeScene();
    const spawner = new ObstacleSpawner(mock.scene, {} as Phaser.Physics.Arcade.Sprite, vi.fn());

    spawner.update(snapshotAt(1_000));
    // 360m is safe; 900m is skipped because it falls within pit-850's exclusion zone.
    expect(mock.overlaps).toHaveLength(1);
    spawner.update(snapshotAt(1_500));
    expect(mock.overlaps).toHaveLength(2); // the 1,440m pattern is outside the pit zone

    spawner.update(snapshotAt(4_000, 'paused'));
    expect(mock.overlaps).toHaveLength(2);

    spawner.destroy();
    expect(mock.rectangles.every((item) => item.destroy.mock.calls.length === 1))
      .toBe(true);
    expect(mock.graphics.every((item) => item.destroy.mock.calls.length === 1))
      .toBe(true);
    expect(mock.texts.every((item) => item.destroy.mock.calls.length === 1))
      .toBe(true);
  });
});
