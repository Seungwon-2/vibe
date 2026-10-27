import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { RUNNER_BIOMES } from './runnerBiomes';
import { drawRunnerGate, drawRunnerPit } from './runnerCourseObjects';

function makeGraphics() {
  const graphics = {
    fillStyle: vi.fn((..._args: number[]) => graphics), lineStyle: vi.fn((..._args: number[]) => graphics),
    fillRect: vi.fn((..._args: number[]) => graphics), fillRoundedRect: vi.fn((..._args: number[]) => graphics),
    strokeRoundedRect: vi.fn((..._args: number[]) => graphics), fillCircle: vi.fn((..._args: number[]) => graphics),
    strokeCircle: vi.fn((..._args: number[]) => graphics), fillEllipse: vi.fn((..._args: number[]) => graphics),
    fillTriangle: vi.fn((..._args: number[]) => graphics), lineBetween: vi.fn((..._args: number[]) => graphics),
  };
  return graphics;
}

function getSignature(graphics: ReturnType<typeof makeGraphics>): string {
  return JSON.stringify({
    rectangles: graphics.fillRect.mock.calls,
    rounded: graphics.fillRoundedRect.mock.calls,
    circles: graphics.fillCircle.mock.calls,
    ellipses: graphics.fillEllipse.mock.calls,
    triangles: graphics.fillTriangle.mock.calls,
    lines: graphics.lineBetween.mock.calls,
  });
}

function expectInside(
  graphics: ReturnType<typeof makeGraphics>,
  bounds: { left: number; right: number; top: number; bottom: number },
): void {
  const rectCalls = [...graphics.fillRect.mock.calls, ...graphics.fillRoundedRect.mock.calls,
    ...graphics.strokeRoundedRect.mock.calls];
  for (const [x, y, width, height] of rectCalls) {
    expect(x).toBeGreaterThanOrEqual(bounds.left);
    expect(y).toBeGreaterThanOrEqual(bounds.top);
    expect(x + width).toBeLessThanOrEqual(bounds.right);
    expect(y + height).toBeLessThanOrEqual(bounds.bottom);
  }
  for (const [x, y, radius] of [...graphics.fillCircle.mock.calls, ...graphics.strokeCircle.mock.calls]) {
    expect(x - radius).toBeGreaterThanOrEqual(bounds.left);
    expect(y - radius).toBeGreaterThanOrEqual(bounds.top);
    expect(x + radius).toBeLessThanOrEqual(bounds.right);
    expect(y + radius).toBeLessThanOrEqual(bounds.bottom);
  }
  for (const [x, y, width, height] of graphics.fillEllipse.mock.calls) {
    expect(x - width / 2).toBeGreaterThanOrEqual(bounds.left);
    expect(y - height / 2).toBeGreaterThanOrEqual(bounds.top);
    expect(x + width / 2).toBeLessThanOrEqual(bounds.right);
    expect(y + height / 2).toBeLessThanOrEqual(bounds.bottom);
  }
  for (const [x1, y1, x2, y2] of graphics.lineBetween.mock.calls) {
    for (const x of [x1, x2]) {
      expect(x).toBeGreaterThanOrEqual(bounds.left);
      expect(x).toBeLessThanOrEqual(bounds.right);
    }
    for (const y of [y1, y2]) {
      expect(y).toBeGreaterThanOrEqual(bounds.top);
      expect(y).toBeLessThanOrEqual(bounds.bottom);
    }
  }
  for (const [x1, y1, x2, y2, x3, y3] of graphics.fillTriangle.mock.calls) {
    for (const x of [x1, x2, x3]) {
      expect(x).toBeGreaterThanOrEqual(bounds.left);
      expect(x).toBeLessThanOrEqual(bounds.right);
    }
    for (const y of [y1, y2, y3]) {
      expect(y).toBeGreaterThanOrEqual(bounds.top);
      expect(y).toBeLessThanOrEqual(bounds.bottom);
    }
  }
}

describe('biome course landmark art', () => {
  it('gives each biome a distinct gate silhouette within its fixed local extent', () => {
    const signatures = RUNNER_BIOMES.map((biome) => {
      const graphics = makeGraphics();
      drawRunnerGate(graphics as unknown as Phaser.GameObjects.Graphics, biome);
      expectInside(graphics, { left: -28, right: 28, top: -168, bottom: 0 });
      const usesGateColor = graphics.fillStyle.mock.calls.some(([color]) => color === biome.palette.gate) ||
        graphics.lineStyle.mock.calls.some(([, color]) => color === biome.palette.gate);
      expect(usesGateColor).toBe(true);
      expect(graphics.lineStyle).toHaveBeenCalledWith(expect.any(Number), biome.palette.hazardContrast, expect.any(Number));
      return getSignature(graphics);
    });
    expect(new Set(signatures).size).toBe(RUNNER_BIOMES.length);
  });

  it('gives each biome a distinct pit rim around the same dark opening footprint', () => {
    const width = 90;
    const signatures = RUNNER_BIOMES.map((biome) => {
      const graphics = makeGraphics();
      drawRunnerPit(graphics as unknown as Phaser.GameObjects.Graphics, width, biome);
      expectInside(graphics, { left: -width / 2, right: width / 2, top: 0, bottom: 36 });
      expect(graphics.fillRect).toHaveBeenCalledWith(-width / 2, 2, width, 34);
      expect(graphics.fillStyle).toHaveBeenCalledWith(biome.palette.hazardContrast, 0.96);
      return getSignature(graphics);
    });
    expect(new Set(signatures).size).toBe(RUNNER_BIOMES.length);
  });
});
