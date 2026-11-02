import type Phaser from 'phaser';
import type { HazardDefinition } from '../runner/hazardTypes';
import type { RunnerBiomeDefinition } from './runnerBiomes';

// All decorative shapes fit within the unchanged Arcade overlap rectangle.
export function drawRunnerHazard(
  graphics: Phaser.GameObjects.Graphics,
  definition: HazardDefinition,
  biome: RunnerBiomeDefinition,
  visualHeight = definition.height,
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

  if (kind === 'double-jump') {
    const top = 0;
    const bottom = visualHeight;
    switch (biome.id) {
      case 'dawn-city': {
        graphics.fillStyle(p.middle, 0.98).fillRect(4, top, width - 8, bottom);
        graphics.fillStyle(p.gate, 0.98).fillRect(9, top + 5, width - 18, bottom - 10);
        for (let y = 18; y < bottom - 12; y += 34) {
          graphics.fillStyle(p.accent, 0.98).fillRect(13, y, width - 26, 8);
          graphics.fillStyle(p.hazardContrast, 0.95).fillTriangle(15, y + 8, 26, y, 26, y + 8)
            .fillTriangle(width - 15, y + 8, width - 26, y, width - 26, y + 8);
        }
        graphics.fillStyle(p.groundFace, 0.98).fillRect(0, bottom - 10, width, 10);
        graphics.lineStyle(2, p.hazardContrast, 0.95).lineBetween(2, 1, 2, bottom - 1)
          .lineBetween(width - 2, 1, width - 2, bottom - 1);
        break;
      }
      case 'moonlit-forest': {
        graphics.fillStyle(p.middle, 0.96).fillRoundedRect(7, 0, width - 14, bottom, 12);
        graphics.fillStyle(p.gate, 0.98).fillRoundedRect(13, 4, width - 26, bottom - 8, 9);
        for (let y = 12; y < bottom - 5; y += 25) {
          graphics.fillStyle(p.accent, 0.98).fillTriangle(9, y + 9, 26, y - 2, 25, y + 10)
            .fillTriangle(width - 9, y + 9, width - 26, y - 2, width - 25, y + 10);
          graphics.fillStyle(p.hazardContrast, 0.9).fillCircle(width / 2, y + 4, 2);
        }
        graphics.fillStyle(p.groundFace, 0.98).fillEllipse(width / 2, bottom - 8, width - 4, 14);
        break;
      }
      case 'crystal-mine': {
        graphics.fillStyle(p.middle, 0.97).fillRect(5, 0, width - 10, bottom);
        graphics.fillStyle(p.gate, 0.98).fillTriangle(5, bottom, 18, 18, 29, bottom)
          .fillTriangle(19, bottom, 39, 0, 59, bottom)
          .fillTriangle(37, bottom, 50, 25, width - 5, bottom);
        for (let y = 14; y < bottom - 30; y += 38) {
          graphics.fillStyle(p.pickupTime, 0.98).fillTriangle(17, y, 26, y + 15, 17, y + 30);
          graphics.lineStyle(2, 0xffffff, 0.88).lineBetween(39, y + 3, 44, y + 24);
        }
        graphics.fillStyle(p.groundFace, 0.98).fillRect(1, bottom - 8, width - 2, 8);
        break;
      }
      case 'cloud-skyway': {
        graphics.fillStyle(p.middle, 0.95).fillRoundedRect(5, 2, width - 10, bottom - 2, 18);
        graphics.fillStyle(p.gate, 0.98).fillEllipse(width / 2, 17, width - 6, 32)
          .fillEllipse(width / 2, bottom - 24, width - 4, 48);
        graphics.fillStyle(0xffffff, 0.98).fillRect(13, 14, width - 26, bottom - 28);
        for (let y = 28; y < bottom - 12; y += 31) {
          graphics.lineStyle(4, p.accent, 0.96).lineBetween(12, y, width - 12, y + 5);
          graphics.fillStyle(p.hazardContrast, 0.92).fillCircle(width / 2, y + 7, 2.5);
        }
        graphics.lineStyle(3, p.hazardContrast, 0.94).lineBetween(2, bottom - 1, width - 2, bottom - 1);
        break;
      }
    }
    return;
  }

  // A themed overhead barrier fills the jump-blocking lane and leaves the same low crawl gap
  // as the slide collision pose. It is drawn independently of the collider dimensions.
  const barrierBottom = Math.max(0, visualHeight - 54);
  switch (biome.id) {
    case 'dawn-city': {
      // A roadworks barricade wall with a lit warning stripe and steel supports.
      graphics.fillStyle(p.middle, 0.96).fillRect(2, 0, width - 4, barrierBottom);
      graphics.fillStyle(p.gate, 0.98).fillRect(7, 0, width - 14, barrierBottom - 5);
      graphics.fillStyle(p.accent, 0.98).fillRect(12, 10, width - 24, 9)
        .fillRect(12, 32, width - 24, 9);
      for (let y = 12; y < barrierBottom - 12; y += 44) {
        graphics.fillStyle(p.hazardContrast, 0.9).fillTriangle(14, y + 12, 27, y, 27, y + 12)
          .fillTriangle(width - 14, y + 12, width - 27, y, width - 27, y + 12);
      }
      graphics.lineStyle(2, p.hazardContrast, 0.92).lineBetween(3, barrierBottom - 2, width - 3, barrierBottom - 2);
      graphics.fillStyle(p.groundFace, 0.98).fillRect(2, barrierBottom - 8, 6, 8)
        .fillRect(width - 8, barrierBottom - 8, 6, 8);
      break;
    }
    case 'moonlit-forest': {
      // Dense thorny vines and leaf clusters form an unmistakable low arch.
      graphics.fillStyle(p.middle, 0.94).fillRoundedRect(2, 0, width - 4, barrierBottom, 9);
      graphics.fillStyle(p.gate, 0.98).fillRoundedRect(7, 0, width - 14, barrierBottom - 7, 7);
      for (let y = 18; y < barrierBottom - 12; y += 38) {
        graphics.lineStyle(4, p.middle, 0.96).lineBetween(12, y, width - 12, y + 5);
        graphics.lineStyle(2, p.hazardContrast, 0.85).lineBetween(12, y, width - 12, y + 5);
        graphics.fillStyle(p.accent, 0.96).fillEllipse(17, y + 2, 12, 8)
          .fillEllipse(width - 17, y + 7, 12, 8);
        graphics.fillStyle(p.hazardContrast, 0.9).fillTriangle(26, y + 4, 34, y - 4, 33, y + 6)
          .fillTriangle(width - 26, y + 9, width - 34, y + 17, width - 33, y + 7);
      }
      graphics.fillStyle(p.middle, 0.98).fillEllipse(width / 2, barrierBottom - 5, width - 6, 16);
      break;
    }
    case 'crystal-mine': {
      // A solid crystal seam with large faceted shards reaching toward the slide opening.
      graphics.fillStyle(p.middle, 0.96).fillRect(1, 0, width - 2, barrierBottom - 4);
      graphics.fillStyle(p.gate, 0.98).fillRect(5, 0, width - 10, barrierBottom - 9);
      for (let y = 8; y < barrierBottom - 20; y += 56) {
        graphics.fillStyle(p.pickupTime, 0.98).fillTriangle(7, y, 22, y, 15, Math.min(y + 48, barrierBottom - 3))
          .fillTriangle(width - 7, y + 6, width - 22, y + 6, width - 15, Math.min(y + 54, barrierBottom - 3));
        graphics.fillStyle(p.groundFace, 0.94).fillTriangle(23, y, 42, y, 33, Math.min(y + 36, barrierBottom - 3));
        graphics.lineStyle(1.5, 0xffffff, 0.78).lineBetween(15, y + 5, 15, Math.min(y + 36, barrierBottom - 4))
          .lineBetween(33, y + 4, 33, Math.min(y + 27, barrierBottom - 4));
      }
      graphics.lineStyle(3, p.hazardContrast, 0.94).lineBetween(2, barrierBottom - 2, width - 2, barrierBottom - 2);
      break;
    }
    case 'cloud-skyway': {
      // A packed wall of storm clouds with wind bands; the underside opens as a low tunnel.
      graphics.fillStyle(p.middle, 0.95).fillRect(2, 0, width - 4, barrierBottom - 4);
      graphics.fillStyle(p.gate, 0.97).fillEllipse(width / 2, 13, width - 4, 24)
        .fillEllipse(13, 20, 26, 26).fillEllipse(width - 13, 20, 26, 26);
      graphics.fillStyle(0xffffff, 0.98).fillEllipse(width / 2, 17, width - 12, 20)
        .fillEllipse(14, 21, 18, 18).fillEllipse(width - 14, 21, 18, 18);
      for (let y = 34; y < barrierBottom - 8; y += 42) {
        graphics.lineStyle(5, p.gate, 0.96).lineBetween(8, y, width - 8, y + 4);
        graphics.lineStyle(2, p.accent, 0.94).lineBetween(13, y + 9, width - 13, y + 13);
        graphics.fillStyle(0xffffff, 0.86).fillCircle(width / 2, y + 4, 3);
      }
      graphics.lineStyle(3, p.hazardContrast, 0.88).lineBetween(3, barrierBottom - 2, width - 3, barrierBottom - 2);
      break;
    }
  }

}
