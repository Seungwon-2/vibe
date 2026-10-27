import type Phaser from 'phaser';
import type { RunnerBiomeDefinition } from './runnerBiomes';

/** Draws a decorative gate inside x=[-28, 28], y=[-168, 0]. */
export function drawRunnerGate(
  graphics: Phaser.GameObjects.Graphics,
  biome: RunnerBiomeDefinition,
): void {
  const p = biome.palette;
  switch (biome.id) {
    case 'dawn-city': {
      // A transit arch with a route sign and station lights.
      graphics.lineStyle(7, p.gate, 0.96).lineBetween(-22, -5, -22, -126)
        .lineBetween(22, -5, 22, -126).lineBetween(-22, -143, 22, -143);
      graphics.lineStyle(2, p.hazardContrast, 0.9).lineBetween(-18, -8, -18, -124)
        .lineBetween(18, -8, 18, -124).lineBetween(-18, -138, 18, -138);
      graphics.fillStyle(p.middle, 0.98).fillRoundedRect(-16, -164, 32, 22, 7);
      graphics.lineStyle(2, p.hazardContrast, 0.95).strokeRoundedRect(-16, -164, 32, 22, 7);
      graphics.fillStyle(p.accent, 0.98).fillCircle(0, -153, 5)
        .fillCircle(-22, -127, 4).fillCircle(22, -127, 4);
      graphics.lineStyle(2, p.hazardContrast, 0.92).lineBetween(-7, -145, 7, -145);
      break;
    }
    case 'moonlit-forest': {
      // Rooted trunks and a moon framed by overlapping tree crowns.
      graphics.lineStyle(8, p.middle, 0.98).lineBetween(-23, -5, -19, -110)
        .lineBetween(23, -5, 19, -110);
      graphics.lineStyle(2, p.hazardContrast, 0.85).lineBetween(-23, -8, -19, -108)
        .lineBetween(23, -8, 19, -108);
      graphics.fillStyle(p.gate, 0.96).fillEllipse(0, -136, 45, 38)
        .fillEllipse(-15, -128, 23, 27).fillEllipse(15, -128, 23, 27);
      graphics.fillStyle(p.groundFace, 0.98).fillCircle(0, -133, 13);
      graphics.lineStyle(2, p.accent, 0.98).strokeCircle(0, -133, 9);
      graphics.fillStyle(p.accent, 0.98).fillCircle(-11, -148, 3).fillCircle(12, -150, 2.5);
      graphics.lineStyle(3, p.gate, 0.98).lineBetween(-19, -92, -10, -80)
        .lineBetween(19, -88, 10, -74);
      break;
    }
    case 'crystal-mine': {
      // Faceted crystal pillars rise toward a floating crown crystal.
      graphics.fillStyle(p.gate, 0.98).fillTriangle(-27, 0, -22, -128, -10, 0)
        .fillTriangle(27, 0, 22, -128, 10, 0);
      graphics.fillStyle(p.middle, 0.98).fillTriangle(-22, -128, -15, -151, -7, -128)
        .fillTriangle(22, -128, 15, -151, 7, -128);
      graphics.fillStyle(p.accent, 0.98).fillTriangle(-10, -146, 0, -168, 10, -146)
        .fillTriangle(-10, -146, 0, -128, 10, -146);
      graphics.fillStyle(p.groundFace, 0.9).fillTriangle(-19, -126, -14, -29, -12, -126)
        .fillTriangle(19, -126, 14, -29, 12, -126);
      graphics.lineStyle(2, p.hazardContrast, 0.82).lineBetween(-25, -110, -22, -30)
        .lineBetween(25, -110, 22, -30);
      break;
    }
    case 'cloud-skyway': {
      // A rainbow path framed by bright cloud banks.
      const archSegments: ReadonlyArray<readonly [number, number, number, number]> = [
        [-24, -12, -24, -110], [-24, -110, -20, -137], [-20, -137, 0, -160],
        [0, -160, 20, -137], [20, -137, 24, -110], [24, -110, 24, -12],
      ];
      graphics.lineStyle(8, p.gate, 0.96);
      for (const [x1, y1, x2, y2] of archSegments) graphics.lineBetween(x1, y1, x2, y2);
      graphics.lineStyle(3, p.groundFace, 0.96);
      for (const [x1, y1, x2, y2] of archSegments) graphics.lineBetween(x1, y1, x2, y2);
      graphics.fillStyle(0xffffff, 0.98).fillEllipse(-18, -7, 19, 14)
        .fillEllipse(-8, -7, 18, 14).fillEllipse(18, -7, 19, 14).fillEllipse(8, -7, 18, 14);
      graphics.fillStyle(p.accent, 0.98).fillCircle(0, -158, 4);
      graphics.lineStyle(2, p.hazardContrast, 0.82).lineBetween(-17, -22, -10, -22)
        .lineBetween(10, -22, 17, -22);
      break;
    }
  }
}

/** Draws the visible pit inside x=[-width/2, width/2], y=[0, 36]. */
export function drawRunnerPit(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  biome: RunnerBiomeDefinition,
): void {
  if (!Number.isFinite(width) || width <= 0) return;
  const p = biome.palette;
  const half = width / 2;
  const edge = Math.min(width * 0.28, 22);

  // Preserve the dark open center. Only the rim and nearby details vary by biome.
  graphics.fillStyle(p.hazardContrast, 0.96).fillRect(-half, 2, width, 34);
  switch (biome.id) {
    case 'dawn-city': {
      graphics.fillStyle(p.groundFace, 0.98).fillRect(-half, 2, width * 0.24, 3)
        .fillRect(half - width * 0.22, 2, width * 0.22, 3);
      graphics.fillStyle(p.groundTop, 0.98).fillRect(-half, 0, width * 0.19, 5)
        .fillRect(half - width * 0.2, 0, width * 0.2, 5);
      graphics.lineStyle(2, p.accent, 0.98).lineBetween(-half + width * 0.19, 1, -half + width * 0.26, 8)
        .lineBetween(half - width * 0.2, 1, half - width * 0.3, 9);
      graphics.lineStyle(1.5, p.groundFace, 0.88).lineBetween(-half + 4, 18, -half + 10, 25)
        .lineBetween(half - 5, 17, half - 12, 23);
      break;
    }
    case 'moonlit-forest': {
      graphics.fillStyle(p.middle, 0.98).fillRect(-half, 1, width * 0.22, 5)
        .fillRect(half - width * 0.22, 1, width * 0.22, 5);
      graphics.lineStyle(3, p.groundTop, 0.98).lineBetween(-half + 5, 3, -half + edge, 4)
        .lineBetween(half - 5, 3, half - edge, 4);
      graphics.lineStyle(3, p.accent, 0.96).lineBetween(-half + 8, 4, -half + edge * 0.65, 20)
        .lineBetween(-half + edge * 0.65, 20, -half + edge * 0.9, 31)
        .lineBetween(half - 8, 4, half - edge * 0.65, 18)
        .lineBetween(half - edge * 0.65, 18, half - edge * 0.95, 30);
      graphics.lineStyle(1.5, p.groundFace, 0.8).lineBetween(-half + 4, 9, -half + edge * 0.8, 12)
        .lineBetween(half - 4, 10, half - edge * 0.8, 13);
      break;
    }
    case 'crystal-mine': {
      graphics.fillStyle(p.middle, 0.98).fillTriangle(-half, 0, -half + edge, 0, -half, 15)
        .fillTriangle(half, 0, half - edge, 0, half, 15);
      graphics.fillStyle(p.gate, 0.98).fillTriangle(-half, 15, -half + edge * 0.75, 4, -half + edge * 0.8, 31)
        .fillTriangle(half, 15, half - edge * 0.75, 4, half - edge * 0.8, 31);
      graphics.fillStyle(p.accent, 0.98).fillTriangle(-half + 3, 4, -half + edge * 0.5, 8, -half + 4, 16)
        .fillTriangle(half - 3, 4, half - edge * 0.5, 8, half - 4, 16);
      graphics.lineStyle(2, p.groundFace, 0.8).lineBetween(-half + edge, 2, -half + edge * 0.8, 14)
        .lineBetween(half - edge, 2, half - edge * 0.8, 14);
      break;
    }
    case 'cloud-skyway': {
      const bankWidth = Math.min(width * 0.32, 26);
      graphics.fillStyle(0xffffff, 0.98).fillEllipse(-half + bankWidth / 2, 8, bankWidth, 16)
        .fillEllipse(-half + bankWidth * 0.65, 17, bankWidth * 0.78, 15)
        .fillEllipse(half - bankWidth / 2, 8, bankWidth, 16)
        .fillEllipse(half - bankWidth * 0.65, 17, bankWidth * 0.78, 15);
      graphics.lineStyle(2, p.groundTop, 0.94).lineBetween(-half, 2, -half + bankWidth * 0.9, 2)
        .lineBetween(half, 2, half - bankWidth * 0.9, 2);
      graphics.fillStyle(p.middle, 0.9).fillEllipse(-half + bankWidth * 0.52, 28, bankWidth * 0.75, 7)
        .fillEllipse(half - bankWidth * 0.52, 28, bankWidth * 0.75, 7);
      break;
    }
  }
}
