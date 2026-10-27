import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { createRunnerSnapshot, startRunner } from './RunnerSimulation';
import { PitSpawner, getPitDefinitions, isPitClearance } from './PitSpawner';
import { RUNNER_GROUND_Y } from './RunnerPlayer';
import { RUNNER_CONFIG } from './runnerConfig';

function makeScene() {
  const overlaps: (() => void)[] = [];
  const graphicsObjects: ReturnType<typeof makeGraphics>[] = [];
  const textObjects: ReturnType<typeof makeText>[] = [];
  const zones: ReturnType<typeof makeZone>[] = [];
  const scene = {
    add: {
      rectangle: vi.fn(() => {
        const zone = makeZone();
        zones.push(zone);
        return zone;
      }),
      graphics: vi.fn(() => {
        const graphics = makeGraphics();
        graphicsObjects.push(graphics);
        return graphics;
      }),
      text: vi.fn(() => {
        const text = makeText();
        textObjects.push(text);
        return text;
      }),
    },
    physics: { add: {
      existing: vi.fn(),
      overlap: vi.fn((_player: unknown, _zone: unknown, callback: () => void) => overlaps.push(callback)),
    } },
    time: { delayedCall: vi.fn((_delay: number, callback: () => void) => callback()) },
  };
  return { scene: scene as unknown as Phaser.Scene, overlaps, graphicsObjects, textObjects, zones };
}

function makeZone() {
  const zone = {
    body: { setAllowGravity: vi.fn(), setImmovable: vi.fn() },
    setOrigin: vi.fn(() => zone), setPosition: vi.fn(() => zone), destroy: vi.fn(),
  };
  return zone;
}

function makeGraphics() {
  const graphics = {
    fillStyle: vi.fn(() => graphics), fillRect: vi.fn(() => graphics), lineStyle: vi.fn(() => graphics),
    fillTriangle: vi.fn(() => graphics), fillEllipse: vi.fn(() => graphics),
    lineBetween: vi.fn(() => graphics), setDepth: vi.fn(() => graphics),
    setPosition: vi.fn(() => graphics), destroy: vi.fn(),
  };
  return graphics;
}

function makeText() {
  const text = {
    setOrigin: vi.fn(() => text), setDepth: vi.fn(() => text), setVisible: vi.fn(() => text),
    setPosition: vi.fn(() => text), destroy: vi.fn(),
  };
  return text;
}

describe('pit schedule and clearance', () => {
  it('creates stable first and recurring pits and clips at the requested distance', () => {
    expect(getPitDefinitions(849)).toEqual([]);
    expect(getPitDefinitions(4_350)).toEqual([
      { id: 'pit-850', distanceMeters: 850, widthMeters: 30, tutorialWarning: true },
      { id: 'pit-2600', distanceMeters: 2_600, widthMeters: 30, tutorialWarning: false },
      { id: 'pit-4350', distanceMeters: 4_350, widthMeters: 30, tutorialWarning: false },
    ]);
    expect(new Set(getPitDefinitions(20_000).map((pit) => pit.id)).size)
      .toBe(getPitDefinitions(20_000).length);
  });

  it('treats the pit width and configured clearance as one exclusion radius', () => {
    const pit = getPitDefinitions(850)[0];
    expect(isPitClearance(850 + 215, pit)).toBe(true);
    expect(isPitClearance(850 + 215.01, pit)).toBe(false);
    expect(isPitClearance(850 + 20, pit, 0)).toBe(false);
  });
});

describe('PitSpawner', () => {
  it('draws a biome-aware gap and shows a warning only for the first pit near its lead distance', () => {
    const mock = makeScene();
    const spawner = new PitSpawner(mock.scene, {} as Phaser.Physics.Arcade.Sprite, () => true,
      vi.fn(() => 'ignored' as const));
    const running = { ...startRunner(createRunnerSnapshot('player-default')),
      distanceMeters: 600, worldDistance: 1_800 };
    spawner.update(running);
    expect(mock.zones).toHaveLength(1);
    expect(mock.scene.add.rectangle).toHaveBeenCalledWith(0, RUNNER_GROUND_Y - 1,
      RUNNER_CONFIG.pitWidthMeters / RUNNER_CONFIG.metersPerWorldUnit, 4, 0xffffff, 0);
    expect(mock.zones[0].setOrigin).toHaveBeenCalledWith(0.5);
    expect(mock.graphicsObjects[0].setDepth).toHaveBeenCalledWith(-1);
    expect(mock.graphicsObjects[0].fillRect).toHaveBeenCalled();
    expect(mock.textObjects).toHaveLength(1);
    expect(mock.textObjects[0].setVisible).toHaveBeenCalledWith(true);

    spawner.update({ ...running, distanceMeters: 2_350, worldDistance: 7_050 });
    expect(mock.textObjects).toHaveLength(1);
    expect(mock.zones).toHaveLength(2);
    spawner.destroy();
    expect(mock.zones.every((zone) => zone.destroy.mock.calls.length === 1)).toBe(true);
    expect(mock.graphicsObjects.every((graphics) => graphics.destroy.mock.calls.length === 1)).toBe(true);
  });

  it('ends only grounded contacts and ignores duplicate overlap callbacks', () => {
    const mock = makeScene();
    const onPitFall = vi.fn(() => 'fatal' as const);
    const spawner = new PitSpawner(mock.scene, {} as Phaser.Physics.Arcade.Sprite, () => true, onPitFall);
    const running = { ...startRunner(createRunnerSnapshot('player-default')),
      distanceMeters: 600, worldDistance: 1_800 };
    spawner.update(running);
    spawner.update({ ...running, distanceMeters: 850, worldDistance: 2_550 });
    mock.overlaps[0]();
    mock.overlaps[0]();
    expect(onPitFall).toHaveBeenCalledTimes(1);
    expect(onPitFall).toHaveBeenCalledWith(expect.objectContaining({ id: 'pit-850' }));
    expect(mock.zones[0].destroy).toHaveBeenCalledOnce();
    expect(mock.graphicsObjects[0].destroy).not.toHaveBeenCalled();
    const artPositionCalls = mock.graphicsObjects[0].setPosition.mock.calls.length;

    spawner.update({ ...running, distanceMeters: 900, worldDistance: 2_700 });
    expect(mock.graphicsObjects[0].setPosition).toHaveBeenCalledTimes(artPositionCalls);
    expect(mock.graphicsObjects[0].destroy).not.toHaveBeenCalled();

    spawner.destroy();
    expect(mock.graphicsObjects[0].destroy).toHaveBeenCalledOnce();
    expect(mock.zones[0].destroy).toHaveBeenCalledOnce();
  });

  it('removes an airborne pit overlap without calling the fall handler', () => {
    const mock = makeScene();
    const onPitFall = vi.fn(() => 'fatal' as const);
    const spawner = new PitSpawner(mock.scene, {} as Phaser.Physics.Arcade.Sprite, () => false, onPitFall);
    const running = { ...startRunner(createRunnerSnapshot('player-default')),
      distanceMeters: 600, worldDistance: 1_800 };
    spawner.update(running);
    spawner.update({ ...running, distanceMeters: 850, worldDistance: 2_550 });
    mock.overlaps[0]();
    expect(onPitFall).not.toHaveBeenCalled();
    expect(mock.zones[0].destroy).toHaveBeenCalledOnce();
  });

  it('removes pit art after a guarded contact instead of retaining it for a fatal fall', () => {
    const mock = makeScene();
    const onPitFall = vi.fn(() => 'rescued' as const);
    const spawner = new PitSpawner(mock.scene, {} as Phaser.Physics.Arcade.Sprite, () => true, onPitFall);
    const running = { ...startRunner(createRunnerSnapshot('hanayo-hiyori')),
      distanceMeters: 600, worldDistance: 1_800 };
    spawner.update(running);
    spawner.update({ ...running, distanceMeters: 850, worldDistance: 2_550 });

    mock.overlaps[0]();

    expect(onPitFall).toHaveBeenCalledOnce();
    expect(mock.zones[0].destroy).toHaveBeenCalledOnce();
    expect(mock.graphicsObjects[0].destroy).toHaveBeenCalledOnce();
    expect(mock.textObjects[0].destroy).toHaveBeenCalledOnce();
  });
});
