import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import type { HazardDefinition } from '../runner/hazardTypes';
import { RUNNER_BIOMES } from './runnerBiomes';
import { drawRunnerHazard } from './runnerHazards';

function makeGraphics() {
  const graphics = {
    fillStyle: vi.fn(() => graphics), lineStyle: vi.fn(() => graphics),
    fillRoundedRect: vi.fn(() => graphics), strokeRoundedRect: vi.fn(() => graphics),
    fillRect: vi.fn(() => graphics), fillCircle: vi.fn(() => graphics),
    fillEllipse: vi.fn(() => graphics), fillTriangle: vi.fn(() => graphics),
    lineBetween: vi.fn(() => graphics),
  };
  return graphics;
}

function calls(graphics: ReturnType<typeof makeGraphics>, method: keyof ReturnType<typeof makeGraphics>) {
  return (graphics[method] as unknown as { mock: { calls: number[][] } }).mock.calls;
}

function expectPrimitivesInside(graphics: ReturnType<typeof makeGraphics>, width: number, height: number) {
  for (const [x, y, w, h] of calls(graphics, 'fillRect')) {
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + w).toBeLessThanOrEqual(width);
    expect(y + h).toBeLessThanOrEqual(height);
  }
  for (const [x, y, w, h] of [...calls(graphics, 'fillRoundedRect'),
    ...calls(graphics, 'strokeRoundedRect')]) {
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + w).toBeLessThanOrEqual(width);
    expect(y + h).toBeLessThanOrEqual(height);
  }
  for (const [x, y, radius] of calls(graphics, 'fillCircle')) {
    expect(x - radius).toBeGreaterThanOrEqual(0);
    expect(y - radius).toBeGreaterThanOrEqual(0);
    expect(x + radius).toBeLessThanOrEqual(width);
    expect(y + radius).toBeLessThanOrEqual(height);
  }
  for (const [x, y, w, h] of calls(graphics, 'fillEllipse')) {
    expect(x - w / 2).toBeGreaterThanOrEqual(0);
    expect(y - h / 2).toBeGreaterThanOrEqual(0);
    expect(x + w / 2).toBeLessThanOrEqual(width);
    expect(y + h / 2).toBeLessThanOrEqual(height);
  }
  for (const [x1, y1, x2, y2] of calls(graphics, 'lineBetween')) {
    expect(x1).toBeGreaterThanOrEqual(0);
    expect(y1).toBeGreaterThanOrEqual(0);
    expect(x1).toBeLessThanOrEqual(width);
    expect(y1).toBeLessThanOrEqual(height);
    expect(x2).toBeGreaterThanOrEqual(0);
    expect(y2).toBeGreaterThanOrEqual(0);
    expect(x2).toBeLessThanOrEqual(width);
    expect(y2).toBeLessThanOrEqual(height);
  }
  for (const [x1, y1, x2, y2, x3, y3] of calls(graphics, 'fillTriangle')) {
    for (const x of [x1, x2, x3]) expect(x).toBeGreaterThanOrEqual(0);
    for (const y of [y1, y2, y3]) expect(y).toBeGreaterThanOrEqual(0);
    for (const x of [x1, x2, x3]) expect(x).toBeLessThanOrEqual(width);
    for (const y of [y1, y2, y3]) expect(y).toBeLessThanOrEqual(height);
  }
}

describe('themed hazard art', () => {
  it('keeps themed artwork inside its visual canvas and leaves the crawl-through opening', () => {
    for (const biome of RUNNER_BIOMES) {
      for (const kind of ['ground', 'overhead', 'double-jump'] as const) {
        const definition: HazardDefinition = {
          id: `${biome.id}-${kind}`, kind, offsetMeters: 0,
          width: kind === 'ground' ? 46 : 64,
          height: kind === 'ground' ? 48 : kind === 'double-jump' ? 156 : 36,
          warningColor: '#ffffff',
        };
        const graphics = makeGraphics();
        const visualHeight = kind === 'overhead' ? 470 : definition.height;
        drawRunnerHazard(graphics as unknown as Phaser.GameObjects.Graphics, definition, biome, visualHeight);
        expectPrimitivesInside(graphics, definition.width, visualHeight);

        for (const method of ['fillRect', 'fillRoundedRect', 'strokeRoundedRect'] as const) {
          const fullFootprintDrawn = calls(graphics, method).some(([x, y, w, h]) =>
            x <= 0 && y <= 0 && x + w >= definition.width && y + h >= definition.height,
          );
          expect(fullFootprintDrawn, `${biome.id}/${kind} draws a full hitbox panel`).toBe(false);
        }
        if (kind === 'overhead') {
          const lowerEdge = Math.max(...[
            ...calls(graphics, 'fillRect').map(([, y, , h]) => y + h),
            ...calls(graphics, 'fillRoundedRect').map(([, y, , h]) => y + h),
            ...calls(graphics, 'lineBetween').map(([, y1, , y2]) => Math.max(y1, y2)),
          ]);
          expect(lowerEdge).toBeGreaterThanOrEqual(visualHeight - 60);
          expect(lowerEdge).toBeLessThanOrEqual(visualHeight - 54);
        }
      }
    }
  });

  it('uses different silhouettes for both lanes and all four biomes', () => {
    const signature = (biomeId: (typeof RUNNER_BIOMES)[number]['id'], kind: HazardDefinition['kind']) => {
      const biome = RUNNER_BIOMES.find((candidate) => candidate.id === biomeId)!;
      const graphics = makeGraphics();
      const definition: HazardDefinition = {
        id: `${biome.id}-${kind}`, kind, offsetMeters: 0,
        width: kind === 'ground' ? 46 : 64,
        height: kind === 'ground' ? 48 : kind === 'double-jump' ? 156 : 36,
        warningColor: '#ffffff',
      };
      drawRunnerHazard(graphics as unknown as Phaser.GameObjects.Graphics, definition, biome);
      return JSON.stringify({
        rectangles: graphics.fillRect.mock.calls,
        rounded: graphics.fillRoundedRect.mock.calls,
        circles: graphics.fillCircle.mock.calls,
        ellipses: graphics.fillEllipse.mock.calls,
        triangles: graphics.fillTriangle.mock.calls,
        lines: graphics.lineBetween.mock.calls,
      });
    };

    for (const biome of RUNNER_BIOMES) {
      expect(signature(biome.id, 'ground')).not.toBe(signature(biome.id, 'overhead'));
      expect(signature(biome.id, 'double-jump')).not.toBe(signature(biome.id, 'overhead'));
    }
    for (const kind of ['ground', 'overhead', 'double-jump'] as const) {
      expect(new Set(RUNNER_BIOMES.map(({ id }) => signature(id, kind))).size).toBe(RUNNER_BIOMES.length);
    }
  });
});
