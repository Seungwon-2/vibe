import Phaser from 'phaser';
import type { RunnerSnapshot, StoryStageId } from '../runner/runnerTypes';
import { getStoryStage } from '../runner/storyConfig';
import { getBiomeById, getBiomeForDistance, type RunnerBiomeDefinition } from './runnerBiomes';
import type { RunnerVisualMode } from '../runner/runnerVisualPreferences';

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
    case 'dawn-city': {
      ellipse(graphics, p.accent, 744, 166, 166, 166, 0.18);
      ellipse(graphics, 0xfff9eb, 744, 166, 92, 92, 0.92);
      cloud(graphics, 0xffffff, 222, 193, 0.78, 0.78);
      cloud(graphics, 0xffffff, 788, 224, 0.62, 0.7);
      break;
    }
    case 'moonlit-forest': {
      ellipse(graphics, p.accent, 756, 160, 142, 142, 0.18);
      ellipse(graphics, 0xfff8dc, 756, 160, 82, 82, 0.9);
      ellipse(graphics, p.sky, 780, 145, 74, 74, 0.28);
      for (const [x, y] of [[92, 238], [302, 177], [518, 248], [874, 214]]) {
        glint(graphics, 0xfff5c6, x, y, 0.58);
      }
      break;
    }
    case 'crystal-mine': {
      ellipse(graphics, p.accent, 720, 150, 340, 118, 0.13);
      ellipse(graphics, 0xf9f6ff, 720, 150, 230, 68, 0.34);
      for (const [x, y] of [[82, 194], [220, 152], [506, 218], [692, 126], [862, 205]]) {
        glint(graphics, p.accent, x, y, 0.58);
      }
      break;
    }
    case 'cloud-skyway': {
      ellipse(graphics, p.accent, 752, 160, 144, 144, 0.18);
      ellipse(graphics, 0xfff9e5, 752, 160, 88, 88, 0.96);
      cloud(graphics, 0xffffff, 148, 220, 0.82, 0.9);
      cloud(graphics, 0xffffff, 475, 180, 0.66, 0.78);
      for (const [x, y] of [[68, 152], [394, 262], [922, 246]]) {
        glint(graphics, p.middle, x, y, 0.42);
      }
      break;
    }
  }
}

// Cached into the existing far texture, rather than creating moving objects.
// Pale silhouettes occupy the empty upper horizon; foreground hazards retain
// their stronger outlines and the running lane stays visually uncluttered.
function drawHorizon(graphics: Phaser.GameObjects.Graphics, biome: RunnerBiomeDefinition): void {
  const { palette: p } = biome;
  switch (biome.id) {
    case 'dawn-city':
      for (const [x, top, width] of [[8, 218, 75], [106, 175, 64], [219, 232, 90], [360, 192, 76]]) {
        graphics.fillStyle(p.middle, .2).fillRoundedRect(x, top, width, 420 - top, 5);
        graphics.fillStyle(p.middle, .2).fillTriangle(x - 7, top, x + width / 2, top - 24, x + width + 7, top);
        for (let y = top + 22; y < 330; y += 27) {
          for (let wx = x + 14; wx < x + width - 8; wx += 23) rect(graphics, 0xffffff, wx, y, 7, 11, .38);
        }
      }
      graphics.lineStyle(3, p.middle, .17).lineBetween(0, 280, TILE_WIDTH, 280);
      break;
    case 'moonlit-forest':
      for (const [x, top] of [[28, 175], [208, 138], [412, 192]]) {
        rect(graphics, p.middle, x, top + 22, 14, 420 - top, .15);
        ellipse(graphics, p.middle, x + 6, top, 172, 124, .18);
        ellipse(graphics, p.far, x + 48, top + 25, 124, 90, .24);
        graphics.lineStyle(5, p.middle, .13).lineBetween(x + 7, top + 114, x + 52, top + 66);
      }
      break;
    case 'crystal-mine':
      for (const [x, depth, width] of [[-12, 164, 105], [145, 216, 92], [330, 178, 136]]) {
        graphics.fillStyle(p.middle, .19).fillTriangle(x, 40, x + width, 40, x + width * .45, depth);
        graphics.fillStyle(p.accent, .16).fillTriangle(x + width * .45, depth, x + width, 40, x + width * .7, 60);
      }
      for (const x of [66, 374]) rect(graphics, p.middle, x, 176, 12, 265, .16);
      rect(graphics, p.middle, 58, 174, 338, 12, .16);
      break;
    case 'cloud-skyway':
      for (const [x, y] of [[22, 222], [299, 189]]) {
        ellipse(graphics, p.middle, x + 60, y + 28, 154, 28, .26);
        graphics.fillStyle(p.middle, .22).fillTriangle(x - 15, y + 30, x + 126, y + 30, x + 60, y + 100);
        cloud(graphics, 0xffffff, x + 4, y - 18, .8, .8);
        graphics.lineStyle(2, p.middle, .25).lineBetween(x + 40, y - 12, x + 60, y - 48)
          .lineBetween(x + 60, y - 48, x + 80, y - 12);
      }
      graphics.lineStyle(3, p.middle, .22).lineBetween(80, 254, 350, 221);
      break;
  }
}

function drawFar(graphics: Phaser.GameObjects.Graphics, biome: RunnerBiomeDefinition): void {
  const { palette: p } = biome;
  drawHorizon(graphics, biome);
  switch (biome.id) {
    case 'dawn-city': {
      ellipse(graphics, p.far, 148, 444, 430, 110, 0.24);
      ellipse(graphics, p.middle, 384, 452, 360, 84, 0.2);
      for (const [x, height, width] of [[-12, 108, 54], [48, 136, 48], [104, 118, 64],
        [180, 151, 58], [247, 112, 52], [307, 139, 67], [385, 122, 58], [451, 145, 54]]) {
        const roofY = 462 - height;
        graphics.fillStyle(p.far, 0.42).fillRoundedRect(x, roofY, width, height, 8);
        graphics.fillStyle(p.middle, 0.28).fillRoundedRect(x + 7, roofY - 6, width - 14, 7, 4);
        for (let windowY = roofY + 21; windowY < 340; windowY += 34) {
          rect(graphics, 0xffffff, x + 12, windowY, 5, 8, 0.28);
          if (width > 58) rect(graphics, p.accent, x + width - 18, windowY + 9, 5, 7, 0.25);
        }
      }
      break;
    }
    case 'moonlit-forest': {
      cloud(graphics, 0xf7fff4, 35, 205, 0.95, 0.56);
      cloud(graphics, 0xf7fff4, 285, 244, 0.72, 0.46);
      ellipse(graphics, p.far, 104, 458, 300, 92, 0.32);
      ellipse(graphics, p.middle, 388, 465, 330, 76, 0.23);
      for (const [x, y, width, height] of [[-28, 302, 156, 114], [93, 276, 174, 132],
        [248, 310, 152, 104], [378, 284, 150, 126]]) {
        rect(graphics, p.far, x + Math.round(width * 0.43), y + 48, 19, 462 - y - 48, 0.28);
        ellipse(graphics, p.far, x + width * 0.2, y + 18, width * 0.62, height * 0.72, 0.48);
        ellipse(graphics, p.middle, x + width * 0.05, y + 42, width * 0.5, height * 0.55, 0.28);
        ellipse(graphics, p.far, x + width * 0.48, y + 38, width * 0.5, height * 0.58, 0.38);
      }
      for (const [x, y] of [[65, 278], [208, 246], [364, 268], [454, 231]]) glint(graphics, 0xf8e8a6, x, y, 0.55);
      break;
    }
    case 'crystal-mine': {
      ellipse(graphics, p.accent, 252, 120, 480, 230, 0.12);
      ellipse(graphics, p.far, 174, 324, 300, 92, 0.28);
      ellipse(graphics, p.middle, 404, 340, 300, 76, 0.2);
      for (const [x, height, width] of [[8, 126, 56], [76, 158, 62], [160, 105, 52],
        [245, 145, 60], [327, 119, 54], [407, 160, 64], [469, 106, 54]]) {
        const peak = 352 - height;
        graphics.fillStyle(p.far, 0.5).fillTriangle(x, 352, x + width * 0.48, peak, x + width, 352);
        graphics.fillStyle(p.middle, 0.26).fillTriangle(x + width * 0.48, peak + 22,
          x + width, 352, x + width * 0.83, 352);
      }
      for (const [x, y] of [[92, 248], [282, 216], [434, 259]]) glint(graphics, p.accent, x, y, 0.5);
      break;
    }
    case 'cloud-skyway': {
      cloud(graphics, 0xffffff, -32, 196, 1.28, 0.92);
      cloud(graphics, 0xf7fbff, 164, 237, 0.84, 0.82);
      cloud(graphics, 0xffffff, 360, 187, 1.08, 0.9);
      ellipse(graphics, p.middle, 124, 456, 310, 82, 0.22);
      ellipse(graphics, p.far, 376, 465, 340, 68, 0.25);
      for (const [x, y] of [[122, 214], [282, 177], [445, 239]]) glint(graphics, p.middle, x, y, 0.4);
      break;
    }
  }
}

function drawMiddle(graphics: Phaser.GameObjects.Graphics, biome: RunnerBiomeDefinition): void {
  const { palette: p } = biome;
  switch (biome.id) {
    case 'dawn-city': {
      ellipse(graphics, p.middle, 104, 469, 320, 88, 0.14);
      ellipse(graphics, p.middle, 390, 462, 300, 82, 0.14);
      for (const x of [72, 276, 438]) {
        rect(graphics, p.middle, x, 382, 5, 85, 0.28);
        ellipse(graphics, p.accent, x + 2, 378, 16, 16, 0.46);
        ellipse(graphics, 0xffffff, x + 2, 378, 7, 7, 0.62);
        rect(graphics, p.middle, x - 10, 455, 25, 5, 0.24);
      }
      break;
    }
    case 'moonlit-forest': {
      for (const x of [42, 344]) {
        rect(graphics, p.middle, x + 28, 382, 12, 86, 0.3);
        ellipse(graphics, p.middle, x + 30, 366, 72, 66, 0.28);
        ellipse(graphics, p.middle, x + 4, 388, 52, 52, 0.2);
      }
      for (const [x, y] of [[160, 346], [421, 328]]) {
        ellipse(graphics, p.accent, x, y, 11, 11, 0.72);
        ellipse(graphics, 0xfff8dc, x, y, 4, 4, 0.9);
      }
      ellipse(graphics, p.middle, 125, 470, 258, 47, 0.13);
      ellipse(graphics, p.middle, 385, 471, 245, 45, 0.13);
      break;
    }
    case 'crystal-mine': {
      for (const x of [38, 414]) {
        rect(graphics, p.middle, x, 354, 11, 114, 0.3);
        rect(graphics, p.middle, x - 12, 355, 72, 8, 0.3);
      }
      for (const [x, peak, width] of [[143, 404, 19], [292, 386, 24], [368, 423, 15]]) {
        graphics.fillStyle(p.accent, 0.28).fillTriangle(x, 466, x + width / 2, peak, x + width, 466);
        graphics.fillStyle(0xffffff, 0.32).fillTriangle(x + width / 2, peak + 12,
          x + width, 466, x + width * 0.78, 466);
      }
      break;
    }
    case 'cloud-skyway': {
      ellipse(graphics, p.middle, 92, 463, 270, 67, 0.2);
      ellipse(graphics, p.middle, 361, 466, 312, 70, 0.18);
      for (const x of [22, 258]) {
        const left = x;
        graphics.lineStyle(2, p.middle, 0.32).lineBetween(left, 358, left + 68, 319)
          .lineBetween(left + 68, 319, left + 136, 358).lineBetween(left, 358, left + 136, 358);
        rect(graphics, p.far, left + 5, 362, 126, 86, 0.24);
        for (const offset of [28, 78, 118]) {
          rect(graphics, p.middle, left + offset, 372, 4, 76, 0.18);
          ellipse(graphics, p.middle, left + offset + 2, 408, 12, 29, 0.16);
        }
        rect(graphics, p.middle, left + 1, 447, 136, 7, 0.18);
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
  for (let x = 0; x <= TILE_WIDTH; x += 72) {
    graphics.lineStyle(1, p.groundTop, 0.2)
      .lineBetween(x, GROUND_Y + 15, x - 24, HEIGHT);
  }
  graphics.lineStyle(1, p.groundTop, 0.2).lineBetween(0, 518, TILE_WIDTH, 518);
}

export function getParallaxOffsets(worldDistance: number, mode: RunnerVisualMode = 'standard'): Record<Layer, number> {
  const distance = Math.max(0, worldDistance);
  return {
    far: mode === 'calm' ? 0 : Math.floor(distance * PARALLAX_RATIOS.far),
    middle: Math.floor(distance * (mode === 'calm' ? .12 : PARALLAX_RATIOS.middle)),
    near: Math.floor(distance * PARALLAX_RATIOS.near),
  };
}

/** Backdrop-only softening: collision objects keep their original strong palette. */
function backdropPalette(biome: RunnerBiomeDefinition, mode: RunnerVisualMode): RunnerBiomeDefinition {
  if (mode === 'standard') return biome;
  const soften = (color: number): number => {
    const channels = [color >> 16 & 255, color >> 8 & 255, color & 255];
    const neutral = [184, 195, 206];
    return channels.reduce((value, channel, index) =>
      value | Math.round(channel * .78 + neutral[index] * .22) << (16 - index * 8), 0);
  };
  return { ...biome, palette: { ...biome.palette,
    sky: soften(biome.palette.sky), far: soften(biome.palette.far), middle: soften(biome.palette.middle),
    groundFace: soften(biome.palette.groundFace), ground: soften(biome.palette.ground),
  } };
}

export class RunnerBackdrop {
  private active: BackdropSet;
  private outgoing: BackdropSet | null = null;
  private transitionElapsedMs = BIOME_CROSSFADE_MS;
  private lastFrame: Pick<RunnerSnapshot, 'distanceMeters' | 'worldDistance'>;

  constructor(private readonly scene: Phaser.Scene, initialDistanceMeters = 0,
    private readonly storyStageId: StoryStageId | null = null,
    private visualMode: RunnerVisualMode = 'calm') {
    this.lastFrame = { distanceMeters: initialDistanceMeters, worldDistance: initialDistanceMeters * 3 };
    this.active = this.createSet(this.resolveBiome(initialDistanceMeters));
    this.update(this.lastFrame, 0);
  }

  get biomeId(): RunnerBiomeDefinition['id'] {
    return this.active.biome.id;
  }

  setVisualMode(mode: RunnerVisualMode): void {
    if (this.visualMode === mode) return;
    this.visualMode = mode;
    this.destroySet(this.active);
    if (this.outgoing) this.destroySet(this.outgoing);
    this.outgoing = null;
    this.active = this.createSet(this.resolveBiome(this.lastFrame.distanceMeters));
    this.update(this.lastFrame, 0);
  }

  update(snapshot: Pick<RunnerSnapshot, 'distanceMeters' | 'worldDistance'>, deltaMs: number): void {
    this.lastFrame = snapshot;
    const biome = this.resolveBiome(snapshot.distanceMeters);
    if (biome.id !== this.active.biome.id) {
      if (this.outgoing) this.destroySet(this.outgoing);
      this.outgoing = this.active;
      this.active = this.createSet(biome);
      this.active.container.alpha = 0;
      this.transitionElapsedMs = 0;
    }
    const offsets = getParallaxOffsets(snapshot.worldDistance, this.visualMode);
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
    const artBiome = backdropPalette(biome, this.visualMode);
    const textureKeys: string[] = [];
    const draw: Record<Layer, (graphics: Phaser.GameObjects.Graphics,
      biome: RunnerBiomeDefinition) => void> = {
      far: drawFar, middle: drawMiddle, near: drawNear,
    };
    const layers = {} as Record<Layer, Phaser.GameObjects.TileSprite>;
    for (const layer of ['far', 'middle', 'near'] as const) {
      const key = `runner-biome-${biome.id}-${this.visualMode}-${layer}`;
      const graphics = this.scene.add.graphics();
      draw[layer](graphics, artBiome);
      graphics.generateTexture(key, TILE_WIDTH, HEIGHT);
      graphics.destroy();
      this.scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      textureKeys.push(key);
      layers[layer] = this.scene.add.tileSprite(0, 0, WIDTH, HEIGHT, key).setOrigin(0, 0);
      if (this.visualMode === 'calm' && layer !== 'near') layers[layer].alpha = layer === 'far' ? .65 : .5;
    }
    const sky = this.scene.add.rectangle(0, 0, WIDTH, HEIGHT, artBiome.palette.sky).setOrigin(0, 0);
    const skyDetail = this.scene.add.graphics();
    drawSkyDetail(skyDetail, artBiome);
    if (this.visualMode === 'calm') skyDetail.alpha = .45;
    const container = this.scene.add.container(0, 0,
      [sky, skyDetail, layers.far, layers.middle, layers.near]).setDepth(-40);
    return { biome, container, layers, textureKeys };
  }

  private resolveBiome(distanceMeters: number): RunnerBiomeDefinition {
    return this.storyStageId
      ? getBiomeById(getStoryStage(this.storyStageId).biomeId)
      : getBiomeForDistance(distanceMeters);
  }

  private destroySet(set: BackdropSet): void {
    set.container.destroy(true);
    for (const key of set.textureKeys) this.scene.textures.remove(key);
  }
}
