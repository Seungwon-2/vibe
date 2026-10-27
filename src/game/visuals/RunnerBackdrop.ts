import Phaser from 'phaser';
import type { RunnerSnapshot } from '../runner/runnerTypes';
import { getBiomeForDistance, type RunnerBiomeDefinition } from './runnerBiomes';

const WIDTH = 960;
const HEIGHT = 540;
const TILE_WIDTH = 480;
const GROUND_Y = 470;
export const BIOME_CROSSFADE_MS = 750;
export const PARALLAX_RATIOS = Object.freeze({ far: 0.15, middle: 0.4, near: 1 });

type Layer = 'far' | 'middle' | 'near';
type BackdropSet = {
  biome: RunnerBiomeDefinition;
  container: Phaser.GameObjects.Container;
  layers: Record<Layer, Phaser.GameObjects.TileSprite>;
  textureKeys: string[];
};

function rect(graphics: Phaser.GameObjects.Graphics, color: number,
  x: number, y: number, width: number, height: number, alpha = 1): void {
  graphics.fillStyle(color, alpha).fillRect(x, y, width, height);
}

function ellipse(graphics: Phaser.GameObjects.Graphics, color: number,
  x: number, y: number, width: number, height: number, alpha = 1): void {
  graphics.fillStyle(color, alpha).fillEllipse(x, y, width, height);
}

function cloud(graphics: Phaser.GameObjects.Graphics, color: number,
  x: number, y: number, scale = 1, alpha = 0.75): void {
  ellipse(graphics, color, x + 38 * scale, y + 24 * scale, 96 * scale, 26 * scale, alpha);
  ellipse(graphics, color, x + 18 * scale, y + 16 * scale, 42 * scale, 34 * scale, alpha);
  ellipse(graphics, color, x + 55 * scale, y + 8 * scale, 55 * scale, 44 * scale, alpha);
}

function glint(graphics: Phaser.GameObjects.Graphics, color: number,
  x: number, y: number, alpha = 0.55): void {
  rect(graphics, color, x - 1, y - 5, 2, 10, alpha);
  rect(graphics, color, x - 5, y - 1, 10, 2, alpha);
}

function drawSkyDetail(graphics: Phaser.GameObjects.Graphics,
  biome: RunnerBiomeDefinition): void {
  const { palette: p } = biome;
  switch (biome.id) {
    case 'dawn-city':
      ellipse(graphics, p.accent, 744, 174, 120, 120, 0.23);
      ellipse(graphics, 0xfffaf2, 744, 174, 79, 79, 0.78);
      break;
    case 'moonlit-forest':
      ellipse(graphics, p.accent, 759, 161, 112, 112, 0.2);
      ellipse(graphics, p.accent, 759, 161, 61, 61, 0.83);
      break;
    case 'crystal-mine':
      ellipse(graphics, p.accent, 733, 193, 142, 78, 0.13);
      for (const [x, y] of [[665, 164], [774, 144], [820, 241]]) {
        glint(graphics, p.accent, x, y, 0.48);
      }
      break;
    case 'cloud-skyway':
      ellipse(graphics, p.accent, 748, 173, 92, 92, 0.9);
      break;
  }
}

function drawFar(graphics: Phaser.GameObjects.Graphics, biome: RunnerBiomeDefinition): void {
  const { palette: p } = biome;
  switch (biome.id) {
    case 'dawn-city': {
      rect(graphics, p.accent, 0, 145, TILE_WIDTH, 86, 0.1);
      cloud(graphics, 0xffffff, 18, 164, 0.85);
      cloud(graphics, 0xffffff, 242, 207, 0.72);
      for (const [x, height, width] of [[-8, 107, 64], [64, 144, 64], [140, 115, 82],
        [234, 164, 74], [322, 124, 60], [392, 151, 96]]) {
        graphics.fillStyle(p.far, 0.78).fillRoundedRect(x, 466 - height, width, height, 6);
        rect(graphics, p.middle, x + 8, 466 - height - 5, width - 16, 5, 0.3);
        for (let windowY = 466 - height + 28; windowY < 440; windowY += 27) {
          rect(graphics, 0xffffff, x + 12, windowY, 7, 12, 0.47);
          rect(graphics, p.accent, x + width - 20, windowY, 7, 12, 0.42);
        }
      }
      break;
    }
    case 'moonlit-forest': {
      cloud(graphics, p.far, 34, 197, 0.95, 0.42);
      cloud(graphics, p.far, 284, 233, 0.75, 0.36);
      ellipse(graphics, p.far, 95, 472, 315, 156, 0.48);
      ellipse(graphics, p.far, 359, 476, 315, 141, 0.48);
      for (const [x, height] of [[12, 117], [106, 145], [232, 127], [348, 154], [448, 119]]) {
        rect(graphics, p.far, x + 18, 464 - height, 15, height, 0.67);
        ellipse(graphics, p.far, x + 25, 464 - height, 82, 70, 0.67);
        ellipse(graphics, p.far, x + 48, 464 - height + 20, 64, 56, 0.67);
      }
      for (const [x, y] of [[65, 145], [182, 194], [429, 127]]) glint(graphics, p.accent, x, y, 0.42);
      break;
    }
    case 'crystal-mine': {
      ellipse(graphics, p.far, 228, 58, 620, 210, 0.34);
      for (const [x, height] of [[28, 66], [126, 104], [274, 76], [404, 92]]) {
        graphics.fillStyle(p.far, 0.56).fillTriangle(x, 94, x + 42, 94, x + 20, 94 + height);
      }
      ellipse(graphics, p.far, 86, 474, 290, 160, 0.52);
      ellipse(graphics, p.far, 373, 474, 348, 176, 0.52);
      for (const [x, y] of [[80, 223], [233, 174], [394, 246]]) glint(graphics, p.accent, x, y, 0.62);
      break;
    }
    case 'cloud-skyway': {
      cloud(graphics, p.far, -24, 184, 1.25, 0.92);
      cloud(graphics, p.far, 170, 229, 0.83, 0.9);
      cloud(graphics, p.far, 359, 193, 1.1, 0.92);
      ellipse(graphics, p.middle, 104, 476, 308, 110, 0.26);
      ellipse(graphics, p.middle, 374, 470, 345, 125, 0.23);
      for (const [x, y] of [[122, 190], [282, 163], [445, 222]]) glint(graphics, p.middle, x, y, 0.35);
      break;
    }
  }
}

function drawMiddle(graphics: Phaser.GameObjects.Graphics, biome: RunnerBiomeDefinition): void {
  const { palette: p } = biome;
  switch (biome.id) {
    case 'dawn-city': {
      ellipse(graphics, p.middle, 104, 469, 320, 88, 0.22);
      ellipse(graphics, p.middle, 390, 462, 300, 82, 0.22);
      for (const x of [58, 226, 412]) {
        rect(graphics, p.middle, x, 368, 6, 99, 0.55);
        ellipse(graphics, p.accent, x + 3, 365, 20, 20, 0.82);
        ellipse(graphics, 0xffffff, x + 3, 365, 9, 9, 0.9);
        rect(graphics, p.middle, x - 12, 455, 30, 6, 0.42);
      }
      break;
    }
    case 'moonlit-forest': {
      for (const x of [26, 181, 344]) {
        rect(graphics, p.middle, x + 28, 365, 15, 103, 0.64);
        ellipse(graphics, p.middle, x + 33, 358, 79, 77, 0.58);
        ellipse(graphics, p.middle, x + 2, 379, 56, 63, 0.44);
        ellipse(graphics, p.accent, x + 84, 414, 10, 10, 0.73);
        rect(graphics, p.middle, x + 82, 420, 4, 33, 0.55);
      }
      ellipse(graphics, p.middle, 125, 470, 258, 47, 0.2);
      ellipse(graphics, p.middle, 385, 471, 245, 45, 0.2);
      break;
    }
    case 'crystal-mine': {
      for (const x of [48, 214, 396]) {
        rect(graphics, p.middle, x, 350, 12, 118, 0.49);
        rect(graphics, p.middle, x - 15, 351, 91, 10, 0.49);
        graphics.fillStyle(p.accent, 0.55).fillTriangle(x + 32, 458, x + 45, 395, x + 57, 458);
        graphics.fillStyle(0xffffff, 0.41).fillTriangle(x + 44, 446, x + 45, 395, x + 50, 447);
        graphics.fillStyle(p.accent, 0.33).fillTriangle(x + 61, 462, x + 73, 422, x + 82, 462);
      }
      break;
    }
    case 'cloud-skyway': {
      ellipse(graphics, p.middle, 92, 463, 270, 67, 0.39);
      ellipse(graphics, p.middle, 361, 466, 312, 70, 0.36);
      for (const x of [22, 258]) {
        const left = x;
        graphics.lineStyle(2, p.middle, 0.58).lineBetween(left, 358, left + 68, 313)
          .lineBetween(left + 68, 313, left + 136, 358).lineBetween(left, 358, left + 136, 358);
        rect(graphics, p.far, left + 5, 362, 126, 86, 0.47);
        for (const offset of [18, 48, 78, 108]) {
          rect(graphics, p.middle, left + offset, 372, 6, 76, 0.32);
          ellipse(graphics, p.middle, left + offset + 2, 408, 15, 33, 0.3);
        }
        rect(graphics, p.middle, left + 1, 447, 136, 7, 0.3);
      }
      break;
    }
  }
}

function drawNear(graphics: Phaser.GameObjects.Graphics, biome: RunnerBiomeDefinition): void {
  const { palette: p } = biome;
  rect(graphics, p.groundTop, 0, GROUND_Y, TILE_WIDTH, 13);
  rect(graphics, 0xffffff, 0, GROUND_Y, TILE_WIDTH, 5, 0.88);
  rect(graphics, p.groundFace, 0, GROUND_Y + 13, TILE_WIDTH, HEIGHT - GROUND_Y - 13);
  rect(graphics, p.ground, 0, GROUND_Y + 14, TILE_WIDTH, 1, 0.45);
  for (let x = 0; x <= TILE_WIDTH; x += 56) {
    graphics.lineStyle(1, p.groundTop, 0.34)
      .lineBetween(x, GROUND_Y + 15, x - 24, HEIGHT);
  }
  graphics.lineStyle(1, p.groundTop, 0.34).lineBetween(0, 518, TILE_WIDTH, 518);
}

export function getParallaxOffsets(worldDistance: number): Record<Layer, number> {
  const distance = Math.max(0, worldDistance);
  return {
    far: Math.floor(distance * PARALLAX_RATIOS.far),
    middle: Math.floor(distance * PARALLAX_RATIOS.middle),
    near: Math.floor(distance * PARALLAX_RATIOS.near),
  };
}

export class RunnerBackdrop {
  private active: BackdropSet;
  private outgoing: BackdropSet | null = null;
  private transitionElapsedMs = BIOME_CROSSFADE_MS;

  constructor(private readonly scene: Phaser.Scene, initialDistanceMeters = 0) {
    this.active = this.createSet(getBiomeForDistance(initialDistanceMeters));
  }

  get biomeId(): RunnerBiomeDefinition['id'] {
    return this.active.biome.id;
  }

  update(snapshot: Pick<RunnerSnapshot, 'distanceMeters' | 'worldDistance'>, deltaMs: number): void {
    const biome = getBiomeForDistance(snapshot.distanceMeters);
    if (biome.id !== this.active.biome.id) {
      if (this.outgoing) this.destroySet(this.outgoing);
      this.outgoing = this.active;
      this.active = this.createSet(biome);
      this.active.container.alpha = 0;
      this.transitionElapsedMs = 0;
    }
    const offsets = getParallaxOffsets(snapshot.worldDistance);
    for (const set of [this.active, this.outgoing]) {
      if (!set) continue;
      for (const layer of ['far', 'middle', 'near'] as const) {
        set.layers[layer].tilePositionX = offsets[layer];
      }
    }
    if (!this.outgoing) return;
    this.transitionElapsedMs = Math.min(BIOME_CROSSFADE_MS,
      this.transitionElapsedMs + Math.max(0, deltaMs));
    const progress = this.transitionElapsedMs / BIOME_CROSSFADE_MS;
    this.active.container.alpha = progress;
    this.outgoing.container.alpha = 1 - progress;
    if (progress === 1) {
      this.destroySet(this.outgoing);
      this.outgoing = null;
    }
  }

  destroy(): void {
    this.destroySet(this.active);
    if (this.outgoing) this.destroySet(this.outgoing);
    this.outgoing = null;
  }

  private createSet(biome: RunnerBiomeDefinition): BackdropSet {
    const textureKeys: string[] = [];
    const draw: Record<Layer, (graphics: Phaser.GameObjects.Graphics,
      biome: RunnerBiomeDefinition) => void> = {
      far: drawFar, middle: drawMiddle, near: drawNear,
    };
    const layers = {} as Record<Layer, Phaser.GameObjects.TileSprite>;
    for (const layer of ['far', 'middle', 'near'] as const) {
      const key = `runner-biome-${biome.id}-${layer}`;
      const graphics = this.scene.add.graphics();
      draw[layer](graphics, biome);
      graphics.generateTexture(key, TILE_WIDTH, HEIGHT);
      graphics.destroy();
      this.scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      textureKeys.push(key);
      layers[layer] = this.scene.add.tileSprite(0, 0, WIDTH, HEIGHT, key).setOrigin(0, 0);
    }
    const sky = this.scene.add.rectangle(0, 0, WIDTH, HEIGHT, biome.palette.sky).setOrigin(0, 0);
    const skyDetail = this.scene.add.graphics();
    drawSkyDetail(skyDetail, biome);
    const container = this.scene.add.container(0, 0,
      [sky, skyDetail, layers.far, layers.middle, layers.near]).setDepth(-40);
    return { biome, container, layers, textureKeys };
  }

  private destroySet(set: BackdropSet): void {
    set.container.destroy(true);
    for (const key of set.textureKeys) this.scene.textures.remove(key);
  }
}
