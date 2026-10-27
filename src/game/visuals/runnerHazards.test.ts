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
  };
  return graphics;
}

describe('themed hazard art', () => {
  it('covers the unchanged visible collision footprint in every biome', () => {
    for (const biome of RUNNER_BIOMES) {
      for (const kind of ['ground', 'overhead'] as const) {
        const definition: HazardDefinition = {
          id: `${biome.id}-${kind}`, kind, offsetMeters: 0,
          width: kind === 'ground' ? 46 : 64,
          height: kind === 'ground' ? 48 : 36,
          warningColor: '#ffffff',
        };
        const graphics = makeGraphics();
        drawRunnerHazard(graphics as unknown as Phaser.GameObjects.Graphics, definition, biome);
        expect(graphics.fillRoundedRect).toHaveBeenCalledWith(
          1, 1, definition.width - 2, definition.height - 2, 7,
        );
        expect(graphics.strokeRoundedRect).toHaveBeenCalledWith(
          1, 1, definition.width - 2, definition.height - 2, 7,
        );
        expect(graphics.fillStyle).toHaveBeenCalledWith(biome.palette.groundFace, 0.97);
      }
    }
  });
});
