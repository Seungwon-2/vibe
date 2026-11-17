import { describe, expect, it } from 'vitest';
import type Phaser from 'phaser';
import { RUNNER_BIOMES } from './runnerBiomes';
import { drawSceneryLayer, drawScenerySky, getScenerySkyColor } from './runnerSceneryArt';

function recorder() {
  const calls: { method: string; args: number[] }[] = [];
  const g: Record<string, (...args: number[]) => typeof g> = {};
  for (const method of ['fillStyle', 'lineStyle', 'fillRect', 'fillRoundedRect',
    'fillEllipse', 'fillCircle', 'fillTriangle', 'lineBetween']) {
    g[method] = (...args: number[]) => { calls.push({ method, args }); return g; };
  }
  return { graphics: g as unknown as Phaser.GameObjects.Graphics, calls };
}

describe('theme scenery illustrations', () => {
  it('draws distinct deterministic landmarks with a bounded amount of detail', () => {
    const signatures = new Set<string>();
    for (const biome of RUNNER_BIOMES) {
      const first = recorder(), second = recorder();
      for (const layer of ['far', 'middle'] as const) {
        drawSceneryLayer(first.graphics, biome, layer);
        drawSceneryLayer(second.graphics, biome, layer);
      }
      drawScenerySky(first.graphics, biome);
      drawScenerySky(second.graphics, biome);
      expect(first.calls).toEqual(second.calls);
      expect(first.calls.length).toBeLessThan(200);
      expect(first.calls.every(({ args }) => args.every(Number.isFinite))).toBe(true);
      signatures.add(JSON.stringify(first.calls));
      expect(getScenerySkyColor(biome.id)).toBeGreaterThan(0);
    }
    expect(signatures.size).toBe(4);
  });

  it('leaves the foreground running lane below y400 free of scenery details', () => {
    for (const biome of RUNNER_BIOMES) {
      const { graphics, calls } = recorder();
      drawSceneryLayer(graphics, biome, 'far');
      drawSceneryLayer(graphics, biome, 'middle');
      drawScenerySky(graphics, biome);
      for (const { method, args } of calls) {
        const [, y, , h] = args;
        const bottom = method === 'fillRect' || method === 'fillRoundedRect' ? y + h
          : method === 'fillEllipse' ? y + h / 2
          : method === 'fillCircle' ? y + args[2]
          : method === 'fillTriangle' ? Math.max(args[1], args[3], args[5])
          : method === 'lineBetween' ? Math.max(args[1], args[3]) : 0;
        expect(bottom, biome.id + '/' + method).toBeLessThan(400);
      }
    }
  });
});
