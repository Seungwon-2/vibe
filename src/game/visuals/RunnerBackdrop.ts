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

function drawFar(graphics: Phaser.GameObjects.Graphics, biome: RunnerBiomeDefinition): void {
  const { palette: p } = biome;
  switch (biome.id) {
    case 'dawn-city':
      rect(graphics, p.accent, 326, 166, 40, 4, 0.2);
      rect(graphics, p.accent, 318, 170, 56, 12, 0.18);
      rect(graphics, p.accent, 310, 182, 72, 8, 0.12);
      for (const [x, height, width] of [[0, 130, 72], [80, 95, 44], [138, 145, 68],
        [220, 102, 78], [314, 118, 50], [374, 156, 106]]) {
        rect(graphics, p.far, x, 454 - height, width, height);
        rect(graphics, p.middle, x + 8, 454 - height - 8, 4, 8, 0.4);
      }
      break;
    case 'moonlit-forest':
      rect(graphics, p.accent, 336, 142, 20, 4, 0.48);
      rect(graphics, p.accent, 330, 146, 10, 28, 0.48);
      rect(graphics, p.accent, 336, 174, 20, 4, 0.48);
      for (const [x, y] of [[70, 142], [166, 190], [428, 126]]) {
        rect(graphics, p.accent, x, y, 4, 4, 0.4);
      }
      for (const [x, height] of [[14, 148], [108, 112], [212, 166], [322, 134], [426, 158]]) {
        rect(graphics, p.far, x + 16, 454 - height, 28, height);
        rect(graphics, p.far, x, 454 - height - 20, 60, 28);
        rect(graphics, p.far, x + 8, 454 - height - 34, 44, 20);
      }
      break;
    case 'crystal-mine':
      for (const [x, height] of [[10, 78], [94, 46], [194, 94], [284, 66], [402, 86]]) {
        rect(graphics, p.far, x, 88, 48, height);
        rect(graphics, p.far, x + 12, 88 + height, 24, 22);
      }
      for (const [x, height] of [[0, 92], [100, 136], [246, 104], [364, 152]]) {
        rect(graphics, p.far, x, 454 - height, 86, height);
      }
      break;
    case 'cloud-skyway':
      for (const [x, y] of [[12, 210], [176, 264], [348, 190]]) {
        rect(graphics, p.far, x, y + 16, 112, 20, 0.72);
        rect(graphics, p.far, x + 20, y, 42, 20, 0.72);
        rect(graphics, p.far, x + 58, y + 8, 42, 16, 0.72);
      }
      rect(graphics, p.far, 0, 438, TILE_WIDTH, 22, 0.75);
      break;
  }
}

function drawMiddle(graphics: Phaser.GameObjects.Graphics, biome: RunnerBiomeDefinition): void {
  const { palette: p } = biome;
  switch (biome.id) {
    case 'dawn-city':
      for (const x of [30, 166, 308, 446]) {
        rect(graphics, p.middle, x, 384, 14, 76, 0.56);
        rect(graphics, p.middle, x - 24, 382, 62, 6, 0.56);
        rect(graphics, p.accent, x + 8, 392, 4, 12, 0.38);
      }
      rect(graphics, p.middle, 0, 448, TILE_WIDTH, 14, 0.48);
      break;
    case 'moonlit-forest':
      for (const x of [30, 178, 326, 464]) {
        rect(graphics, p.middle, x, 370, 18, 92, 0.68);
        rect(graphics, p.middle, x - 22, 366, 64, 16, 0.58);
        rect(graphics, p.accent, x + 34, 408, 6, 8, 0.52);
        rect(graphics, p.middle, x + 35, 416, 4, 30, 0.64);
      }
      break;
    case 'crystal-mine':
      for (const x of [26, 196, 366]) {
        rect(graphics, p.middle, x, 364, 16, 98, 0.72);
        rect(graphics, p.middle, x - 12, 358, 98, 12, 0.6);
        rect(graphics, p.accent, x + 44, 414, 8, 26, 0.42);
        rect(graphics, p.accent, x + 36, 424, 8, 16, 0.3);
        rect(graphics, p.accent, x + 52, 422, 6, 18, 0.28);
      }
      break;
    case 'cloud-skyway':
      // A muted lane behind the pale character art, below the action-cue area.
      rect(graphics, p.groundFace, 0, 398, TILE_WIDTH, 72, 0.24);
      for (const x of [36, 236, 436]) {
        rect(graphics, p.middle, x, 392, 12, 68, 0.52);
        rect(graphics, p.middle, x + 76, 392, 12, 68, 0.52);
        rect(graphics, p.middle, x + 10, 390, 78, 8, 0.52);
        rect(graphics, p.accent, x + 24, 424, 40, 6, 0.48);
      }
      break;
  }
}

function drawNear(graphics: Phaser.GameObjects.Graphics, biome: RunnerBiomeDefinition): void {
  const { palette: p } = biome;
  rect(graphics, p.ground, 0, GROUND_Y, TILE_WIDTH, HEIGHT - GROUND_Y);
  rect(graphics, p.groundTop, 0, GROUND_Y, TILE_WIDTH, 8);
  rect(graphics, p.groundFace, 0, GROUND_Y + 8, TILE_WIDTH, HEIGHT - GROUND_Y - 8);
  for (let x = 0; x < TILE_WIDTH; x += 48) {
    rect(graphics, p.ground, x + 2, GROUND_Y + 12, 3, 10, 0.65);
    rect(graphics, p.groundTop, x + 20, GROUND_Y + 30, 14, 3, 0.36);
    rect(graphics, p.ground, x + 40, GROUND_Y + 52, 24, 4, 0.42);
  }
  rect(graphics, p.accent, 0, GROUND_Y + 5, TILE_WIDTH, 2, 0.32);
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
      this.scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      textureKeys.push(key);
      layers[layer] = this.scene.add.tileSprite(0, 0, WIDTH, HEIGHT, key).setOrigin(0, 0);
    }
    const sky = this.scene.add.rectangle(0, 0, WIDTH, HEIGHT, biome.palette.sky).setOrigin(0, 0);
    const container = this.scene.add.container(0, 0,
      [sky, layers.far, layers.middle, layers.near]).setDepth(-40);
    return { biome, container, layers, textureKeys };
  }

  private destroySet(set: BackdropSet): void {
    set.container.destroy(true);
    for (const key of set.textureKeys) this.scene.textures.remove(key);
  }
}
