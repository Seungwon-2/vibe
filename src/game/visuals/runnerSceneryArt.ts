import type Phaser from 'phaser';
import type { RunnerBiomeId } from '../runner/runnerTypes';
import type { RunnerBiomeDefinition } from './runnerBiomes';

// Illustration colors are deliberately separate from interactive hazard colors.
// Large, opaque forms retain clear edges without outlining every small detail.
const THEMES = {
  'dawn-city': { sky: 0xeee4e2, far: 0xcac1cf, face: 0xaaa3ba, edge: 0x8a849e, light: 0xf8e2bb, accent: 0xe2bba0 },
  'moonlit-forest': { sky: 0xdce6e1, far: 0xbbcfc5, face: 0x96b4a6, edge: 0x739589, light: 0xf1eacb, accent: 0xc4d7c0 },
  'crystal-mine': { sky: 0xe2deeb, far: 0xc7bdd5, face: 0xa99bbd, edge: 0x897b9f, light: 0xe1efeb, accent: 0xa6c7c6 },
  'cloud-skyway': { sky: 0xdfeaf0, far: 0xc2d5df, face: 0xa2bac9, edge: 0x7f9baa, light: 0xf6f1de, accent: 0xd3c9dc },
} as const;

type Art = Phaser.GameObjects.Graphics;
type Colors = (typeof THEMES)[RunnerBiomeId];

export function getScenerySkyColor(id: RunnerBiomeId): number { return THEMES[id].sky; }

function cloud(g: Art, x: number, y: number, scale: number, color: number): void {
  g.fillStyle(color).fillEllipse(x, y + 10 * scale, 108 * scale, 24 * scale)
    .fillEllipse(x - 24 * scale, y, 42 * scale, 34 * scale)
    .fillEllipse(x + 9 * scale, y - 7 * scale, 56 * scale, 46 * scale);
}

export function drawScenerySky(g: Art, biome: RunnerBiomeDefinition): void {
  const p = THEMES[biome.id];
  // Still landmarks; no particle shimmer, blur filters or competing movement.
  if (biome.id === 'moonlit-forest') {
    g.fillStyle(p.light, 0.24).fillCircle(758, 158, 73);
    g.fillStyle(p.light).fillCircle(758, 158, 43);
    g.fillStyle(p.sky).fillCircle(774, 146, 36);
    return;
  }
  if (biome.id === 'crystal-mine') {
    g.fillStyle(p.light, 0.3).fillEllipse(660, 220, 390, 230);
    return;
  }
  g.fillStyle(p.light, 0.3).fillCircle(760, 157, 76);
  g.fillStyle(p.light).fillCircle(760, 157, 44);
  cloud(g, 194, 180, 0.86, 0xf5f5f0);
  if (biome.id === 'cloud-skyway') cloud(g, 515, 138, 0.65, 0xf5f5f0);
}

function city(g: Art, p: Colors, layer: 'far' | 'middle'): void {
  if (layer === 'middle') {
    // Low distant terrace: a single broad band, away from the running lane.
    g.fillStyle(p.far, 0.65).fillEllipse(240, 376, 600, 42);
    g.lineStyle(2, p.face, 0.6).lineBetween(0, 371, 480, 371);
    return;
  }
  const buildings = [[14, 236, 73], [103, 205, 82], [203, 250, 70], [383, 222, 80]];
  for (const [x, y, w] of buildings) {
    g.fillStyle(p.far).fillRoundedRect(x, y, w, 350 - y, 3);
    g.fillStyle(p.face).fillTriangle(x - 5, y, x + w / 2, y - 28, x + w + 5, y);
    g.lineStyle(2, p.edge, 0.65).lineBetween(x - 5, y, x + w + 5, y);
    g.fillStyle(p.face, 0.4).fillRect(x + w - 12, y + 3, 12, 347 - y);
    for (const wx of [x + 14, x + w - 27]) {
      g.fillStyle(p.light).fillRoundedRect(wx, y + 24, 13, 23, 5);
      g.fillStyle(p.face).fillRect(wx + 6, y + 24, 1, 23);
      if (y < 240) g.fillStyle(p.light).fillRoundedRect(wx, y + 67, 13, 20, 4);
    }
  }
  // An unmistakable clock-tower landmark, rather than another building box.
  g.fillStyle(p.face).fillRect(298, 187, 62, 163);
  g.fillStyle(p.far).fillRect(303, 193, 45, 157);
  g.fillStyle(p.edge).fillTriangle(291, 188, 329, 136, 367, 188);
  g.fillStyle(p.face).fillTriangle(300, 182, 329, 145, 329, 182);
  g.lineStyle(3, p.edge, 0.8).lineBetween(294, 192, 364, 192);
  g.fillStyle(p.light).fillCircle(329, 224, 20);
  g.lineStyle(2, p.edge, 0.8).lineBetween(329, 210, 329, 224).lineBetween(329, 224, 341, 230);
  g.fillStyle(p.face).fillRoundedRect(319, 275, 20, 45, 9);
  g.fillStyle(p.edge, 0.5).fillRect(294, 344, 70, 6);
}

function forest(g: Art, p: Colors, layer: 'far' | 'middle'): void {
  if (layer === 'middle') {
    g.fillStyle(p.face, 0.38).fillEllipse(240, 375, 600, 45);
    for (const x of [54, 360]) {
      g.fillStyle(p.face, 0.5).fillEllipse(x, 362, 96, 39)
        .fillEllipse(x + 30, 350, 72, 52);
    }
    return;
  }
  // Edge canopies repeat seamlessly; the central opening keeps the lane calm.
  for (const x of [0, 166, 346, 480]) {
    const y = x === 166 ? 192 : 214;
    g.fillStyle(p.face).fillRoundedRect(x - 9, y + 35, 20, 122, 6);
    g.lineStyle(7, p.face).lineBetween(x, y + 86, x - 34, y + 48)
      .lineBetween(x + 2, y + 70, x + 35, y + 27);
    g.fillStyle(p.far).fillEllipse(x, y, 154, 104);
    g.fillStyle(p.face, 0.5).fillEllipse(x - 34, y + 15, 83, 66)
      .fillEllipse(x + 38, y + 13, 79, 71);
    g.fillStyle(p.accent).fillEllipse(x - 10, y - 16, 103, 57);
    g.lineStyle(2, p.edge, 0.4).lineBetween(x - 4, y + 68, x - 4, y + 135);
  }
  g.fillStyle(p.light, 0.5).fillEllipse(254, 277, 72, 16);
}

function crystal(g: Art, x: number, y: number, w: number, h: number, p: Colors): void {
  g.fillStyle(p.face).fillTriangle(x, y, x + w * 0.4, y - h, x + w, y);
  g.fillStyle(p.accent).fillTriangle(x + 4, y - 2, x + w * 0.4, y - h + 8, x + w * 0.48, y - 2);
  g.fillStyle(p.light, 0.7).fillTriangle(x + w * 0.4, y - h + 8, x + w * 0.62, y - h * 0.5,
    x + w * 0.48, y - h * 0.58);
}

function mine(g: Art, p: Colors, layer: 'far' | 'middle'): void {
  if (layer === 'middle') {
    g.fillStyle(p.far, 0.65).fillEllipse(240, 377, 600, 42);
    for (const x of [68, 397]) {
      g.fillStyle(p.face, 0.5).fillRect(x, 277, 10, 90).fillRect(x - 22, 274, 54, 8);
      g.lineStyle(3, p.face, 0.6).lineBetween(x, 300, x - 17, 282);
    }
    return;
  }
  g.fillStyle(p.far).fillRect(0, 0, 480, 94);
  for (const [x, y, w] of [[0, 169, 154], [154, 138, 178], [332, 182, 148]]) {
    g.fillStyle(p.far).fillTriangle(x, 90, x + w, 90, x + w * 0.4, y);
    g.fillStyle(p.face, 0.65).fillTriangle(x + w * 0.4, y, x + w, 90, x + w * 0.7, 90);
  }
  crystal(g, 20, 345, 90, 142, p);
  crystal(g, 108, 345, 62, 82, p);
  crystal(g, 283, 345, 113, 165, p);
  crystal(g, 393, 345, 63, 110, p);
  g.lineStyle(3, p.face, 0.6).lineBetween(0, 350, 480, 350);
}

function sky(g: Art, p: Colors, layer: 'far' | 'middle'): void {
  if (layer === 'middle') {
    cloud(g, 90, 350, 1.15, 0xf2f4f3);
    cloud(g, 360, 359, 0.95, 0xf2f4f3);
    return;
  }
  for (const [x, y] of [[24, 255], [282, 209]]) {
    // Floating stone island and a three-arch pavilion make this a sky route.
    g.fillStyle(p.far).fillEllipse(x + 76, y + 38, 152, 24);
    g.fillStyle(p.face).fillTriangle(x + 9, y + 43, x + 143, y + 43, x + 70, y + 104);
    g.fillStyle(p.accent).fillTriangle(x + 70, y + 104, x + 143, y + 43, x + 98, y + 57);
    g.fillStyle(p.face).fillTriangle(x + 8, y - 36, x + 75, y - 75, x + 143, y - 36);
    g.fillStyle(p.light).fillTriangle(x + 22, y - 39, x + 75, y - 68, x + 128, y - 39);
    g.fillStyle(p.face).fillRect(x + 18, y - 30, 115, 66);
    for (const offset of [28, 65, 102]) {
      g.fillStyle(p.sky).fillRoundedRect(x + offset, y - 18, 22, 54, 11);
      g.fillStyle(p.light).fillRect(x + offset - 3, y - 28, 5, 63);
    }
    g.lineStyle(3, p.edge, 0.55).lineBetween(x + 12, y + 36, x + 140, y + 36);
  }
}

export function drawSceneryLayer(g: Art, biome: RunnerBiomeDefinition, layer: 'far' | 'middle'): void {
  const draw = { 'dawn-city': city, 'moonlit-forest': forest, 'crystal-mine': mine, 'cloud-skyway': sky };
  draw[biome.id](g, THEMES[biome.id], layer);
}
