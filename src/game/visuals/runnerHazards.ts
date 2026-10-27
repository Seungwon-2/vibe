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
      case 'dawn-city': {
        graphics.fillStyle(p.gate, 0.92).fillRoundedRect(8, 8, 30, 32, 5);
        graphics.fillStyle(p.accent, 0.96).fillRect(11, 12, 24, 5).fillRect(11, 30, 24, 5);
        graphics.fillStyle(0xfff8e8).fillCircle(23, 24, 7);
        graphics.fillStyle(p.hazardContrast).fillRect(22, 20, 2, 5);
        graphics.fillStyle(p.hazardContrast).fillRect(23, 24, 4, 2);
        break;
      }
      case 'moonlit-forest': {
        graphics.fillStyle(p.middle, 0.9).fillRoundedRect(17, 24, 12, 17, 4);
        graphics.fillStyle(p.gate, 0.96).fillEllipse(23, 18, 30, 20);
        graphics.fillStyle(p.accent).fillEllipse(16, 18, 8, 5).fillEllipse(29, 16, 8, 5);
        graphics.lineStyle(1, p.hazardContrast, 0.8).lineBetween(17, 19, 30, 13);
        break;
      }
      case 'crystal-mine': {
        graphics.fillStyle(p.gate, 0.94).fillTriangle(6, 40, 17, 10, 28, 40);
        graphics.fillStyle(p.pickupTime, 0.96).fillTriangle(19, 40, 31, 6, 41, 40);
        graphics.fillStyle(0xffffff, 0.75).fillTriangle(28, 15, 31, 6, 35, 29);
        graphics.lineStyle(1, p.hazardContrast, 0.72).lineBetween(17, 11, 18, 39);
        break;
      }
      case 'cloud-skyway': {
        graphics.fillStyle(p.gate, 0.94).fillRoundedRect(8, 8, 30, 32, 5);
        graphics.fillStyle(0xffffff, 0.96).fillEllipse(23, 22, 23, 13)
          .fillEllipse(16, 24, 12, 9).fillEllipse(30, 24, 13, 9);
        graphics.fillStyle(p.accent).fillTriangle(23, 25, 27, 29, 23, 33)
          .fillTriangle(23, 25, 19, 29, 23, 33);
        graphics.lineStyle(1, p.hazardContrast, 0.75).lineBetween(14, 35, 32, 35);
        break;
      }
    }
  } else {
    graphics.fillStyle(p.groundFace, 0.98).fillRoundedRect(4, 4, width - 8, 28, 6);
    graphics.lineStyle(2, p.hazardContrast, 0.88)
      .strokeRoundedRect(4, 4, width - 8, 28, 6);
    switch (biome.id) {
      case 'dawn-city': {
        graphics.fillStyle(p.accent).fillRoundedRect(9, 8, width - 18, 9, 3);
        graphics.fillStyle(p.gate).fillRect(9, 18, width - 18, 4);
        for (const x of [17, 32, 47]) {
          graphics.fillStyle(0xfff8e8).fillRoundedRect(x - 3, 24, 6, 5, 1);
          graphics.fillStyle(p.hazardContrast).fillRect(x - 1, 25, 2, 3);
        }
        break;
      }
      case 'moonlit-forest': {
        graphics.fillStyle(p.middle).fillRoundedRect(8, 8, width - 16, 6, 3);
        for (const x of [17, 32, 47]) {
          graphics.fillStyle(p.middle, 0.94).fillEllipse(x, 23, 12, 13);
          graphics.fillStyle(p.accent).fillCircle(x, 20, 3);
          graphics.fillStyle(p.hazardContrast, 0.8).fillCircle(x, 20, 1);
        }
        break;
      }
      case 'crystal-mine': {
        graphics.fillStyle(p.middle).fillRoundedRect(8, 8, width - 16, 6, 3);
        for (const x of [17, 32, 47]) {
          graphics.fillStyle(p.pickupTime).fillTriangle(x - 6, 15, x + 6, 15, x, 29);
          graphics.fillStyle(0xffffff, 0.85).fillTriangle(x - 1, 18, x + 3, 18, x, 26);
        }
        break;
      }
      case 'cloud-skyway': {
        graphics.fillStyle(0xffffff).fillEllipse(20, 19, 20, 13)
          .fillEllipse(32, 17, 21, 17).fillEllipse(44, 20, 19, 12);
        graphics.fillStyle(p.gate).fillRoundedRect(8, 24, width - 16, 6, 3);
        graphics.fillStyle(p.accent).fillTriangle(32, 22, 35, 25, 32, 28)
          .fillTriangle(32, 22, 29, 25, 32, 28);
        break;
      }
    }
  }
}
