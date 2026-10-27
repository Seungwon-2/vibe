import { describe, expect, it } from 'vitest';
import { RUNNER_GATE_DISTANCES_M } from '../runner/runnerConfig';
import { getBiomeForDistance, RUNNER_BIOMES } from './runnerBiomes';

function luminance(color: number): number {
  const channel = (shift: number) => {
    const value = ((color >> shift) & 0xff) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return channel(16) * 0.2126 + channel(8) * 0.7152 + channel(0) * 0.0722;
}

function contrastRatio(left: number, right: number): number {
  const a = luminance(left);
  const b = luminance(right);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('runner biome catalog', () => {
  it('uses the three gate thresholds as exact scenery transitions', () => {
    expect(RUNNER_BIOMES.map((biome) => biome.startDistanceMeters))
      .toEqual([0, ...RUNNER_GATE_DISTANCES_M]);
    expect(RUNNER_BIOMES.map((biome) => biome.landmark))
      .toEqual(['새벽 도심', '달빛 숲길', '수정 광산', '구름 위 하늘길']);
    expect(getBiomeForDistance(-10).id).toBe('dawn-city');
    for (const [index, distance] of RUNNER_GATE_DISTANCES_M.entries()) {
      expect(getBiomeForDistance(distance - 0.01).id).toBe(RUNNER_BIOMES[index].id);
      expect(getBiomeForDistance(distance).id).toBe(RUNNER_BIOMES[index + 1].id);
    }
  });

  it('provides distinct editable colors with legible hazard outlines', () => {
    expect(new Set(RUNNER_BIOMES.map((biome) => biome.palette.sky)).size).toBe(4);
    for (const { palette } of RUNNER_BIOMES) {
      expect(contrastRatio(palette.hazardContrast, palette.ground)).toBeGreaterThanOrEqual(4.5);
      expect(palette.groundTop).not.toBe(palette.pickupCoin);
      expect(palette.pickupTime).not.toBe(palette.pickupCoin);
      for (const color of Object.values(palette)) {
        expect(Number.isInteger(color) && color >= 0 && color <= 0xffffff).toBe(true);
      }
    }
  });
});
