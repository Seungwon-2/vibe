import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';

vi.mock('phaser', () => ({ default: { Textures: { FilterMode: { LINEAR: 1 } } } }));

import { BIOME_CROSSFADE_MS, getParallaxOffsets, RunnerBackdrop } from './RunnerBackdrop';
import { RUNNER_BIOMES } from './runnerBiomes';

const ENDLESS_TEXTURE_COUNT = RUNNER_BIOMES.length * 3;

function createScene() {
  const tileSprites: { tilePositionX: number; key: string }[] = [];
  const containers: { alpha: number; destroyed: boolean; children: unknown[] }[] = [];
  const textureKeys: string[] = [];
  const removed: string[] = [];
  const textureFilters: number[] = [];
  const scene = {
    add: {
      graphics: vi.fn(() => {
        const graphics = {
          fillStyle: vi.fn(() => graphics), fillRect: vi.fn(() => graphics),
          fillRoundedRect: vi.fn(() => graphics), fillEllipse: vi.fn(() => graphics),
          fillCircle: vi.fn(() => graphics), fillTriangle: vi.fn(() => graphics),
          lineStyle: vi.fn(() => graphics), lineBetween: vi.fn(() => graphics),
          generateTexture: vi.fn((key: string) => { textureKeys.push(key); }),
          destroy: vi.fn(),
        };
        return graphics;
      }),
      tileSprite: vi.fn((_x: number, _y: number, _w: number, _h: number, key: string) => {
        const sprite = { key, tilePositionX: 0, setOrigin: vi.fn(() => sprite) };
        tileSprites.push(sprite);
        return sprite;
      }),
      rectangle: vi.fn(() => {
        const rectangle = { setOrigin: vi.fn(() => rectangle) };
        return rectangle;
      }),
      container: vi.fn((_x: number, _y: number, children: unknown[]) => {
        const container = { alpha: 1, destroyed: false, children,
          setDepth: vi.fn(() => container),
          destroy: vi.fn(() => { container.destroyed = true; }) };
        containers.push(container);
        return container;
      }),
    },
    textures: {
      get: vi.fn(() => ({ setFilter: vi.fn((filter: number) => { textureFilters.push(filter); }) })),
      remove: vi.fn((key: string) => { removed.push(key); }),
    },
  };
  return { scene: scene as unknown as Phaser.Scene, tileSprites, containers, textureKeys,
    removed, textureFilters };
}

describe('RunnerBackdrop', () => {
  it('prepares the finite theme set and builds three cached layers behind the ground', () => {
    const mock = createScene();
    const backdrop = new RunnerBackdrop(mock.scene, 0, null, 'standard');
    expect(backdrop.biomeId).toBe('dawn-city');
    expect(mock.tileSprites.map((sprite) => sprite.key)).toEqual([
      'runner-biome-dawn-city-standard-far', 'runner-biome-dawn-city-standard-middle',
      'runner-biome-dawn-city-standard-near',
    ]);
    expect(mock.textureKeys).toHaveLength(ENDLESS_TEXTURE_COUNT);
    expect(mock.containers[0].children).toHaveLength(5); // sky detail and three depths
    expect(mock.scene.textures.get).toHaveBeenCalledTimes(ENDLESS_TEXTURE_COUNT);
    expect(mock.textureFilters).toEqual(Array(ENDLESS_TEXTURE_COUNT).fill(1));
    backdrop.destroy();
    expect(mock.removed).toHaveLength(ENDLESS_TEXTURE_COUNT);
    backdrop.destroy();
    expect(mock.removed).toHaveLength(ENDLESS_TEXTURE_COUNT);
  });

  it('scrolls at 0.15x, 0.4x, and 1x and crossfades at exact gates', () => {
    const mock = createScene();
    const backdrop = new RunnerBackdrop(mock.scene, 0, null, 'standard');
    expect(getParallaxOffsets(1000)).toEqual({ far: 150, middle: 400, near: 1000 });
    backdrop.update({ distanceMeters: 1999, worldDistance: 5997 }, 16);
    expect(backdrop.biomeId).toBe('dawn-city');
    expect(mock.tileSprites.map((sprite) => sprite.tilePositionX)).toEqual([899, 2398, 5997]);

    backdrop.update({ distanceMeters: 2000, worldDistance: 6000 }, 0);
    expect(backdrop.biomeId).toBe('moonlit-forest');
    expect(mock.containers[0].alpha).toBe(1);
    expect(mock.containers[1].alpha).toBe(0);
    expect(mock.tileSprites.slice(3).map((sprite) => sprite.tilePositionX))
      .toEqual([900, 2400, 6000]);
    backdrop.update({ distanceMeters: 2100, worldDistance: 6300 }, BIOME_CROSSFADE_MS / 2);
    expect(mock.containers[0].alpha).toBe(0.5);
    expect(mock.containers[1].alpha).toBe(0.5);
    backdrop.update({ distanceMeters: 2100, worldDistance: 6300 }, BIOME_CROSSFADE_MS / 2);
    expect(mock.containers[0].destroyed).toBe(true);
    expect(mock.containers[1].alpha).toBe(1);
    expect(mock.removed).toHaveLength(0);
    expect(mock.textureKeys).toHaveLength(ENDLESS_TEXTURE_COUNT);

    backdrop.update({ distanceMeters: 4000, worldDistance: 12000 }, BIOME_CROSSFADE_MS);
    expect(backdrop.biomeId).toBe('crystal-mine');
    backdrop.update({ distanceMeters: 6000, worldDistance: 18000 }, BIOME_CROSSFADE_MS);
    expect(backdrop.biomeId).toBe('cloud-skyway');
    backdrop.update({ distanceMeters: 10_000, worldDistance: 30_000 }, BIOME_CROSSFADE_MS / 2);
    expect(backdrop.biomeId).toBe('starlight-rainbow');
    expect(mock.containers.slice(-2).map(({ alpha }) => alpha)).toEqual([0.5, 0.5]);
    expect(mock.textureKeys).toHaveLength(ENDLESS_TEXTURE_COUNT);
    backdrop.destroy();
    expect(mock.removed).toHaveLength(ENDLESS_TEXTURE_COUNT);
  });

  it('keeps calm far and middle scenery stationary and ground distance exact, including a paused mode switch', () => {
    expect(getParallaxOffsets(10.5, 'calm')).toEqual({ far: 0, middle: 0, near: 10.5 });
    const mock = createScene();
    const backdrop = new RunnerBackdrop(mock.scene);
    backdrop.update({ distanceMeters: 2300, worldDistance: 6900 }, BIOME_CROSSFADE_MS);
    expect(getParallaxOffsets(6900, 'calm')).toEqual({ far: 0, middle: 0, near: 6900 });
    expect(mock.tileSprites.slice(-3).map(sprite => sprite.tilePositionX)).toEqual([0, 0, 6900]);
    backdrop.setVisualMode('standard');
    expect(backdrop.biomeId).toBe('moonlit-forest');
    expect(mock.tileSprites.slice(-3).map(sprite => sprite.tilePositionX)).toEqual([1035, 2760, 6900]);
    const count = mock.textureKeys.length;
    backdrop.setVisualMode('standard');
    expect(mock.textureKeys).toHaveLength(count);
    backdrop.destroy();
    expect(new Set(mock.removed).size).toBe(ENDLESS_TEXTURE_COUNT * 2);
    expect(mock.textureKeys).toHaveLength(ENDLESS_TEXTURE_COUNT * 2);
  });

  it('only prepares the fixed story theme and reuses cached modes without allocations', () => {
    const mock = createScene();
    const backdrop = new RunnerBackdrop(mock.scene, 0, 'moonlit-forest');
    expect(mock.textureKeys).toHaveLength(3);
    backdrop.setVisualMode('standard');
    expect(mock.textureKeys).toHaveLength(6);
    backdrop.setVisualMode('calm');
    backdrop.setVisualMode('standard');
    backdrop.update({distanceMeters: 2800, worldDistance: 8400}, 16);
    expect(backdrop.biomeId).toBe('moonlit-forest');
    expect(mock.textureKeys).toHaveLength(6);
    expect(mock.removed).toHaveLength(0);
    backdrop.destroy();
    backdrop.destroy();
    expect(mock.removed).toHaveLength(6);
  });
});
