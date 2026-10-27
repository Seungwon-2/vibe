import type Phaser from 'phaser';
import type { HazardDefinition } from '../runner/hazardTypes';
import type { RunnerBiomeDefinition } from './runnerBiomes';

// All decorative shapes fit within the unchanged Arcade overlap rectangle.
export function drawRunnerHazard(
  graphics: Phaser.GameObjects.Graphics,
  definition: HazardDefinition,
  biome: RunnerBiomeDefinition,
): void {
  const { width, kind } = definition;
  const p = biome.palette;

  if (kind === 'ground') {
    switch (biome.id) {
      case 'dawn-city': {
        // A striped street parcel with a weighted base.
        graphics.fillStyle(p.middle, 0.98).fillRoundedRect(5, 14, 36, 27, 5);
        graphics.lineStyle(2, p.hazardContrast, 0.92).strokeRoundedRect(5, 14, 36, 27, 5);
        graphics.fillStyle(p.gate, 0.98).fillRect(9, 18, 28, 6);
        graphics.fillStyle(p.accent, 0.98).fillRect(9, 29, 28, 6);
        graphics.fillStyle(p.groundTop, 0.98).fillRoundedRect(2, 38, 42, 7, 3);
        graphics.lineStyle(2, p.hazardContrast, 0.86).lineBetween(14, 18, 19, 24)
          .lineBetween(28, 24, 33, 18).lineBetween(14, 29, 19, 35)
          .lineBetween(28, 35, 33, 29);
        break;
      }
      case 'moonlit-forest': {
        // A mushroom stump, with cap spots as its readable forest cue.
        graphics.fillStyle(p.middle, 0.98).fillRoundedRect(15, 26, 16, 19, 4);
        graphics.lineStyle(2, p.hazardContrast, 0.86).lineBetween(19, 30, 19, 41)
          .lineBetween(26, 29, 26, 42);
        graphics.fillStyle(p.gate, 0.98).fillEllipse(23, 19, 36, 20);
        graphics.lineStyle(2, p.hazardContrast, 0.9).lineBetween(6, 20, 40, 20);
        graphics.fillStyle(p.accent, 0.98).fillCircle(15, 17, 2.5)
          .fillCircle(25, 14, 2.5).fillCircle(33, 18, 2.5);
        break;
      }
      case 'crystal-mine': {
        // A cluster of angular crystals; the bright facets separate from the mine palette.
        graphics.fillStyle(p.gate, 0.98).fillTriangle(2, 46, 11, 17, 21, 46)
          .fillTriangle(15, 46, 27, 5, 39, 46)
          .fillTriangle(30, 46, 37, 23, 45, 46);
        graphics.lineStyle(1.5, p.hazardContrast, 0.9).lineBetween(11, 17, 12, 43)
          .lineBetween(27, 5, 27, 42).lineBetween(37, 23, 37, 43);
        graphics.fillStyle(p.pickupTime, 0.98).fillTriangle(27, 8, 32, 29, 27, 25);
        graphics.fillStyle(0xffffff, 0.86).fillTriangle(11, 20, 14, 38, 18, 44)
          .fillTriangle(28, 10, 34, 28, 29, 24);
        break;
      }
      case 'cloud-skyway': {
        // A low cloud bank crossed by a small gust mark.
        graphics.fillStyle(p.middle, 0.9).fillEllipse(23, 38, 44, 15);
        graphics.fillStyle(0xffffff, 0.98).fillEllipse(13, 28, 21, 17)
          .fillEllipse(24, 23, 25, 22).fillEllipse(36, 29, 19, 16);
        graphics.lineStyle(2, p.gate, 0.92).lineBetween(5, 43, 41, 43);
        graphics.lineStyle(2, p.accent, 0.98).lineBetween(16, 12, 27, 12)
          .lineBetween(22, 8, 34, 8);
        break;
      }
    }
    return;
  }

  switch (biome.id) {
    case 'dawn-city': {
      // A suspended street sign on a narrow cable.
      graphics.lineStyle(2, p.hazardContrast, 0.95).lineBetween(1, 3, width - 1, 3)
        .lineBetween(13, 3, 13, 10).lineBetween(width - 13, 3, width - 13, 10);
      graphics.fillStyle(p.gate, 0.98).fillRoundedRect(7, 9, width - 14, 20, 4);
      graphics.lineStyle(2, p.hazardContrast, 0.92).strokeRoundedRect(7, 9, width - 14, 20, 4);
      graphics.fillStyle(p.accent, 0.98).fillRoundedRect(13, 13, width - 26, 4, 2);
      graphics.fillStyle(p.groundFace, 0.98).fillCircle(width / 2, 23, 3);
      break;
    }
    case 'moonlit-forest': {
      // A bent branch with dangling vines and leaves.
      graphics.lineStyle(5, p.middle, 0.98).lineBetween(4, 7, 60, 6);
      graphics.lineStyle(2, p.hazardContrast, 0.84).lineBetween(4, 7, 60, 6);
      for (const [x, endY] of [[13, 30], [31, 27], [51, 31]] as const) {
        graphics.lineStyle(2, p.gate, 0.98).lineBetween(x, 7, x + 2, endY);
        graphics.fillStyle(p.accent, 0.98).fillEllipse(x + 2, endY - 3, 11, 7);
        graphics.fillStyle(p.hazardContrast, 0.82).fillCircle(x + 2, endY - 3, 1.5);
      }
      break;
    }
    case 'crystal-mine': {
      // Hanging stalactites with pale facet highlights.
      graphics.fillStyle(p.middle, 0.95).fillRect(1, 1, width - 2, 5);
      graphics.lineStyle(2, p.hazardContrast, 0.88).lineBetween(1, 6, width - 1, 6);
      graphics.fillStyle(p.gate, 0.98).fillTriangle(7, 5, 17, 5, 12, 29)
        .fillTriangle(23, 5, 41, 5, 32, 35)
        .fillTriangle(47, 5, 59, 5, 53, 25);
      graphics.fillStyle(p.pickupTime, 0.98).fillTriangle(30, 8, 36, 8, 32, 28);
      graphics.lineStyle(1.5, 0xffffff, 0.9).lineBetween(11, 9, 13, 22)
        .lineBetween(28, 10, 31, 26).lineBetween(52, 8, 53, 19);
      break;
    }
    case 'cloud-skyway': {
      // A floating cloud streamer with wind chimes.
      graphics.fillStyle(0xffffff, 0.98).fillEllipse(15, 7, 22, 12)
        .fillEllipse(27, 5, 24, 10).fillEllipse(39, 7, 19, 11);
      graphics.lineStyle(2, p.gate, 0.98).lineBetween(8, 12, 56, 12)
        .lineBetween(16, 11, 15, 27).lineBetween(32, 11, 32, 32)
        .lineBetween(49, 11, 50, 25);
      graphics.fillStyle(p.accent, 0.98).fillTriangle(12, 23, 18, 23, 15, 30)
        .fillTriangle(28, 28, 36, 28, 32, 36)
        .fillTriangle(46, 22, 54, 22, 50, 29);
      graphics.lineStyle(1.5, p.hazardContrast, 0.82).lineBetween(12, 31, 18, 31)
        .lineBetween(28, 35, 36, 35).lineBetween(46, 30, 54, 30);
      break;
    }
  }

}
