import type Phaser from 'phaser';
import type { HazardDefinition } from '../runner/hazardTypes';
import type { RunnerBiomeDefinition } from './runnerBiomes';

// Decorative art stays inside the unchanged Arcade overlap rectangle.
export function drawRunnerHazard(
  graphics: Phaser.GameObjects.Graphics,
  definition: HazardDefinition,
  biome: RunnerBiomeDefinition,
): void {
  const { width, height, kind } = definition;
  const p = biome.palette;
  graphics.fillStyle(p.groundFace, 0.97).fillRoundedRect(1, 1, width - 2, height - 2, 7);
  graphics.lineStyle(2, p.hazardContrast, 0.9)
    .strokeRoundedRect(1, 1, width - 2, height - 2, 7);

  if (kind === 'ground') {
    switch (biome.id) {
      case 'dawn-city':
        graphics.fillStyle(p.gate, 0.86).fillRoundedRect(10, 9, 26, 30, 5);
        graphics.fillStyle(p.accent).fillRect(10, 18, 26, 5).fillRect(10, 29, 26, 5);
        graphics.fillStyle(0xffffff, 0.65).fillCircle(23, 13, 3);
        break;
      case 'moonlit-forest':
        graphics.fillStyle(p.middle, 0.7).fillRoundedRect(17, 22, 12, 19, 5);
        graphics.fillStyle(p.gate, 0.83).fillEllipse(23, 22, 32, 21);
        graphics.fillStyle(p.accent, 0.92).fillCircle(16, 18, 3).fillCircle(28, 17, 3);
        break;
      case 'crystal-mine':
        graphics.fillStyle(p.gate, 0.77).fillTriangle(7, 40, 17, 11, 27, 40);
        graphics.fillStyle(p.pickupTime, 0.8).fillTriangle(20, 40, 31, 7, 40, 40);
        graphics.fillStyle(0xffffff, 0.5).fillTriangle(29, 16, 31, 7, 34, 28);
        break;
      case 'cloud-skyway':
        graphics.fillStyle(p.gate, 0.75).fillRoundedRect(8, 8, 30, 31, 5);
        graphics.fillStyle(0xffffff, 0.92).fillTriangle(23, 13, 28, 23, 23, 32)
          .fillTriangle(13, 23, 23, 18, 33, 23);
        graphics.fillStyle(p.pickupCoin, 0.82).fillCircle(23, 23, 3);
        break;
    }
  } else {
    graphics.fillStyle(p.hazardContrast, 0.18).fillRoundedRect(5, 5, width - 10, 26, 5);
    switch (biome.id) {
      case 'dawn-city':
        graphics.fillStyle(p.accent).fillRoundedRect(9, 9, width - 18, 8, 3);
        for (const x of [15, 31, 47]) graphics.fillStyle(p.gate).fillCircle(x, 24, 3);
        break;
      case 'moonlit-forest':
        graphics.fillStyle(p.middle, 0.8).fillRoundedRect(8, 8, width - 16, 6, 3);
        for (const x of [17, 34, 51]) {
          graphics.fillStyle(p.middle, 0.7).fillEllipse(x, 24, 10, 13);
          graphics.fillStyle(p.accent, 0.8).fillCircle(x, 20, 2);
        }
        break;
      case 'crystal-mine':
        graphics.fillStyle(p.middle, 0.8).fillRoundedRect(7, 7, width - 14, 7, 3);
        for (const x of [17, 33, 49]) {
          graphics.fillStyle(p.pickupTime, 0.9).fillTriangle(x - 6, 15, x + 6, 15, x, 30);
        }
        break;
      case 'cloud-skyway':
        graphics.fillStyle(0xffffff, 0.86).fillEllipse(21, 20, 22, 14)
          .fillEllipse(39, 20, 24, 15);
        graphics.fillStyle(p.gate, 0.92).fillRoundedRect(8, 24, width - 16, 5, 2);
        break;
    }
  }
}
