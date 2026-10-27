import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';

vi.mock('phaser', () => ({ default: { Textures: { FilterMode: { LINEAR: 1 } } } }));

import { BIOME_CROSSFADE_MS, getParallaxOffsets, RunnerBackdrop } from './RunnerBackdrop';

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
  it('builds three pixel-filtered layers behind a continuous decorative ground', () => {
    const mock = createScene();
    const backdrop = new RunnerBackdrop(mock.scene);
    expect(backdrop.biomeId).toBe('dawn-city');
    expect(mock.tileSprites.map((sprite) => sprite.key)).toEqual([
      'runner-biome-dawn-city-far', 'runner-biome-dawn-city-middle',
      'runner-biome-dawn-city-near',
    ]);
    expect(mock.textureKeys).toHaveLength(3);
    expect(mock.containers[0].children).toHaveLength(5); // sky detail and three depths
    expect(mock.scene.textures.get).toHaveBeenCalledTimes(3);
    expect(mock.textureFilters).toEqual([1, 1, 1]);
    backdrop.destroy();
    expect(mock.removed).toHaveLength(3);
  });

  it('scrolls at 0.15x, 0.4x, and 1x and crossfades at exact gates', () => {
    const mock = createScene();
    const backdrop = new RunnerBackdrop(mock.scene);
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
    expect(mock.removed).toHaveLength(3);

    backdrop.update({ distanceMeters: 4000, worldDistance: 12000 }, BIOME_CROSSFADE_MS);
    expect(backdrop.biomeId).toBe('crystal-mine');
    backdrop.update({ distanceMeters: 6000, worldDistance: 18000 }, BIOME_CROSSFADE_MS);
    expect(backdrop.biomeId).toBe('cloud-skyway');
    backdrop.destroy();
    expect(mock.removed).toHaveLength(12);
  });
});
