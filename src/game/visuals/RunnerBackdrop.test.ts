import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';

vi.mock('phaser', () => ({ default: { Textures: { FilterMode: { NEAREST: 0 } } } }));

import { BIOME_CROSSFADE_MS, getParallaxOffsets, RunnerBackdrop } from './RunnerBackdrop';

function createScene() {
  const tileSprites: { tilePositionX: number; key: string }[] = [];
  const containers: { alpha: number; destroyed: boolean; children: unknown[] }[] = [];
  const textureKeys: string[] = [];
  const removed: string[] = [];
  const scene = {
    add: {
      graphics: vi.fn(() => {
        const graphics = {
          fillStyle: vi.fn(() => graphics), fillRect: vi.fn(() => graphics),
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
      get: vi.fn(() => ({ setFilter: vi.fn() })),
      remove: vi.fn((key: string) => { removed.push(key); }),
    },
  };
  return { scene: scene as unknown as Phaser.Scene, tileSprites, containers, textureKeys, removed };
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
    expect(mock.containers[0].children).toHaveLength(4); // sky and three depths
    expect(mock.scene.textures.get).toHaveBeenCalledTimes(3);
    backdrop.destroy();
    expect(mock.removed).toHaveLength(3);
  });

  it('scrolls at 0.15x, 0.4x, and 1x and crossfades at exact gates', () => {
    const mock = createScene();
    const backdrop = new RunnerBackdrop(mock.scene);
    expect(getParallaxOffsets(1000)).toEqual({ far: 150, middle: 400, near: 1000 });
    backdrop.update({ distanceMeters: 2499, worldDistance: 7497 }, 16);
    expect(backdrop.biomeId).toBe('dawn-city');
    expect(mock.tileSprites.map((sprite) => sprite.tilePositionX)).toEqual([1124, 2998, 7497]);

    backdrop.update({ distanceMeters: 2500, worldDistance: 7500 }, 0);
    expect(backdrop.biomeId).toBe('moonlit-forest');
    expect(mock.containers[0].alpha).toBe(1);
    expect(mock.containers[1].alpha).toBe(0);
    expect(mock.tileSprites.slice(3).map((sprite) => sprite.tilePositionX))
      .toEqual([1125, 3000, 7500]);
    backdrop.update({ distanceMeters: 2600, worldDistance: 7800 }, BIOME_CROSSFADE_MS / 2);
    expect(mock.containers[0].alpha).toBe(0.5);
    expect(mock.containers[1].alpha).toBe(0.5);
    backdrop.update({ distanceMeters: 2600, worldDistance: 7800 }, BIOME_CROSSFADE_MS / 2);
    expect(mock.containers[0].destroyed).toBe(true);
    expect(mock.containers[1].alpha).toBe(1);
    expect(mock.removed).toHaveLength(3);

    backdrop.update({ distanceMeters: 5000, worldDistance: 15000 }, BIOME_CROSSFADE_MS);
    expect(backdrop.biomeId).toBe('crystal-mine');
    backdrop.update({ distanceMeters: 7500, worldDistance: 22500 }, BIOME_CROSSFADE_MS);
    expect(backdrop.biomeId).toBe('cloud-skyway');
    backdrop.destroy();
    expect(mock.removed).toHaveLength(12);
  });
});
