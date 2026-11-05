import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createRunnerSnapshot, startRunner } from './RunnerSimulation';
import { ObstacleSpawner } from './ObstacleSpawner';
import { getHazardDistance, getPatternForDistance, getPatternStartDistance, isGateClearance,
  METERS_PER_WORLD_UNIT } from './hazardPatterns';
import { getPitDefinitions, isPitClearance } from './PitSpawner';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import { RUNNER_GROUND_Y } from './runnerPose';
import type { HazardDefinition } from './hazardTypes';

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
  const textLabels: string[] = [];
  const overlaps: (() => void)[] = [];
  const tweens: { onComplete?: () => void; [key: string]: unknown }[] = [];
  const scene = {
    add: {
      rectangle: vi.fn(() => { const item = makeChainObject(); rectangles.push(item); return item; }),
      graphics: vi.fn(() => { const item = makeChainObject(); graphics.push(item); return item; }),
      text: vi.fn((_x: number, _y: number, value: string) => {
        textLabels.push(value); const item = makeChainObject(); texts.push(item); return item;
      }),
    },
    physics: { add: {
      existing: vi.fn(),
      overlap: vi.fn((_player: unknown, _box: unknown, callback: () => void) => overlaps.push(callback)),
    } },
    tweens: { add: vi.fn((config: { onComplete?: () => void; [key: string]: unknown }) => tweens.push(config)) },
  };
  return { scene: scene as unknown as Phaser.Scene, rectangles, graphics, texts, textLabels, overlaps, tweens };
}

function snapshotAt(distanceMeters: number, phase: 'running' | 'paused' = 'running') {
  return { ...startRunner(createRunnerSnapshot('player-default')),
    phase, distanceMeters, worldDistance: distanceMeters * 3 };
}

describe('ObstacleSpawner schedule', () => {
  it('keeps complete hazard footprints outside pit and gate clearance zones', () => {
    for (let patternIndex = 0; ; patternIndex += 1) {
      const start = getPatternStartDistance(patternIndex);
      if (start > 12_500) break;
      const definitions = getPatternForDistance(start).obstacles;
      const candidate = definitions.map((definition) => ({
        atMeters: getHazardDistance(patternIndex, definition), definition,
      }));
      const pits = getPitDefinitions(Math.max(...candidate.map(({ atMeters }) => atMeters)) + 250);
      const conflictsWithPit = candidate.some(({ atMeters, definition }) => pits.some((pit) =>
        isPitClearance(atMeters, pit, RUNNER_CONFIG.pitHazardClearanceMeters +
          definition.width / 2 * METERS_PER_WORLD_UNIT),
      ));
      const conflictsWithGate = candidate.some(({ atMeters, definition }) =>
        RUNNER_GATE_DISTANCES_M.some((gate) => isGateClearance(
          atMeters, gate, definition.width / 2 * METERS_PER_WORLD_UNIT,
        )),
      );
      if (conflictsWithPit || conflictsWithGate) continue;

      for (const { atMeters, definition } of candidate) {
        for (const pit of pits) {
          expect(isPitClearance(atMeters, pit, RUNNER_CONFIG.pitHazardClearanceMeters +
            definition.width / 2 * METERS_PER_WORLD_UNIT)).toBe(false);
        }
        for (const gate of RUNNER_GATE_DISTANCES_M) {
          expect(isGateClearance(atMeters, gate, definition.width / 2 * METERS_PER_WORLD_UNIT)).toBe(false);
        }
      }
    }
  });

  it('skips whole patterns in pit zones, freezes while paused, and cleans up spawned objects', () => {
    const mock = makeScene();
    const spawner = new ObstacleSpawner(mock.scene, {} as Phaser.Physics.Arcade.Sprite, vi.fn(), false);

    spawner.update(snapshotAt(1_000));
    // 360m jump and 600m slide both clear pit-850's exclusion radius.
    expect(mock.overlaps).toHaveLength(2);
    spawner.update(snapshotAt(1_500));
    expect(mock.overlaps).toHaveLength(3); // the 1,440m pattern is outside the pit zone

    spawner.update(snapshotAt(1_750));
    expect(mock.overlaps).toHaveLength(3); // the 2,000m gate pattern is skipped whole.

    spawner.update(snapshotAt(2_300));
    expect(mock.overlaps).toHaveLength(4); // 2,300m is outside the gate clear zone.

    spawner.update(snapshotAt(4_000, 'paused'));
    expect(mock.overlaps).toHaveLength(4);

    spawner.destroy();
    expect(mock.rectangles.every((item) => item.destroy.mock.calls.length === 1))
      .toBe(true);
    expect(mock.graphics.every((item) => item.destroy.mock.calls.length === 1))
      .toBe(true);
    expect(mock.texts.every((item) => item.destroy.mock.calls.length === 1))
      .toBe(true);
  });

  it('shows one first-run warning per hazard kind and keeps colliders without tutorial labels', () => {
    const tutorialMock = makeScene();
    const tutorialSpawner = new ObstacleSpawner(tutorialMock.scene,
      {} as Phaser.Physics.Arcade.Sprite, vi.fn(), true);
    tutorialSpawner.update(snapshotAt(1_000));
    expect(tutorialMock.texts).toHaveLength(2);
    tutorialSpawner.update(snapshotAt(6_000));
    expect(tutorialMock.texts).toHaveLength(3);
    expect(tutorialMock.overlaps.length).toBeGreaterThan(2);
    tutorialSpawner.destroy();

    const regularMock = makeScene();
    const regularSpawner = new ObstacleSpawner(regularMock.scene,
      {} as Phaser.Physics.Arcade.Sprite, vi.fn(), false);
    regularSpawner.update(snapshotAt(1_000));
    expect(regularMock.texts).toHaveLength(0);
    expect(regularMock.overlaps).toHaveLength(2);
    regularSpawner.destroy();
  });

  it('uses a full-lane collision box for overhead art and forwards its kind once', () => {
    const mock = makeScene();
    const onOverlap = vi.fn<(definition: HazardDefinition) => void>();
    const spawner = new ObstacleSpawner(mock.scene, {} as Phaser.Physics.Arcade.Sprite, onOverlap, false);
    spawner.update(snapshotAt(400));

    expect(mock.rectangles[0].body.setSize).toHaveBeenCalledWith(46, 48);
    expect(mock.rectangles[1].body.setSize).toHaveBeenCalledWith(64, RUNNER_GROUND_Y);
    mock.overlaps[1]();
    mock.overlaps[1]();
    expect(onOverlap).toHaveBeenCalledOnce();
    expect(onOverlap).toHaveBeenCalledWith(expect.objectContaining({ kind: 'overhead' }));
    spawner.destroy();
  });

  it('resolves a ground hazard crossed between high-speed updates exactly once', () => {
    const mock = makeScene();
    const player = { x: 170, y: RUNNER_GROUND_Y - 38,
      body: { left: 150, right: 190, top: RUNNER_GROUND_Y - 76, bottom: RUNNER_GROUND_Y } };
    const onOverlap = vi.fn();
    const spawner = new ObstacleSpawner(mock.scene, player as unknown as Phaser.Physics.Arcade.Sprite,
      onOverlap, false);

    spawner.update(snapshotAt(300));
    spawner.update(snapshotAt(420)); // The first ground hazard is at 360m.

    expect(onOverlap).toHaveBeenCalledOnce();
    expect(onOverlap).toHaveBeenCalledWith(expect.objectContaining({ kind: 'ground' }));
    mock.overlaps[0]?.();
    expect(onOverlap).toHaveBeenCalledOnce();
    spawner.destroy();
  });

  it('consumes an overhead hazard as a safe pass only during grounded sliding', () => {
    const mock = makeScene();
    const onOverlap = vi.fn();
    const spawner = new ObstacleSpawner(mock.scene, {} as Phaser.Physics.Arcade.Sprite,
      onOverlap, false, () => true);
    spawner.update(snapshotAt(400));

    mock.overlaps[1]();
    expect(onOverlap).not.toHaveBeenCalled();
    expect(mock.rectangles[1].body.enable).toBe(false);
    expect(mock.tweens).toHaveLength(0);
    expect(mock.graphics[1].destroy).not.toHaveBeenCalled();
    mock.overlaps[1]();
    expect(onOverlap).not.toHaveBeenCalled();
    expect(mock.tweens).toHaveLength(0);
    spawner.update(snapshotAt(1_300));
    expect(mock.graphics[1].destroy).toHaveBeenCalledOnce();
    spawner.destroy();
  });

  it('places a tall non-slideable barrier after the 2,000m practice band', () => {
    const mock = makeScene();
    const spawner = new ObstacleSpawner(mock.scene, {} as Phaser.Physics.Arcade.Sprite, vi.fn(), true);
    spawner.update(snapshotAt(5_350));
    expect(mock.textLabels).toContain('DOUBLE JUMP');
    const doubleJumpOverlap = mock.overlaps.find((_callback, index) =>
      Number((mock.rectangles[index]?.body.setSize as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]) ===
        RUNNER_CONFIG.doubleJumpBarrierHeightPx,
    );
    expect(doubleJumpOverlap).toBeDefined();
    spawner.destroy();
  });
});
