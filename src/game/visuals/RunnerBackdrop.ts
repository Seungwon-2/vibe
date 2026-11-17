import Phaser from 'phaser';
import type { RunnerSnapshot, StoryStageId } from '../runner/runnerTypes';
import { getStoryStage } from '../runner/storyConfig';
import { getBiomeById, getBiomeForDistance, RUNNER_BIOMES, type RunnerBiomeDefinition } from './runnerBiomes';
import type { RunnerVisualMode } from '../runner/runnerVisualPreferences';
import { drawSceneryLayer, drawScenerySky, getScenerySkyColor } from './runnerSceneryArt';

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

function drawNear(graphics: Phaser.GameObjects.Graphics, biome: RunnerBiomeDefinition): void {
  const { palette: p } = biome;
  rect(graphics, p.groundTop, 0, GROUND_Y, TILE_WIDTH, 13);
  rect(graphics, 0xffffff, 0, GROUND_Y, TILE_WIDTH, 5, 0.88);
  rect(graphics, p.groundFace, 0, GROUND_Y + 13, TILE_WIDTH, HEIGHT - GROUND_Y - 13);
  rect(graphics, p.ground, 0, GROUND_Y + 14, TILE_WIDTH, 1, 0.45);
  // Broad upright seams repeat exactly at the texture edge. Dense diagonal
  // grids can appear to reverse direction during fast scrolling.
  for (let x = 0; x <= TILE_WIDTH; x += 120) {
    graphics.lineStyle(1, p.groundTop, 0.28)
      .lineBetween(x, GROUND_Y + 15, x, HEIGHT);
  }
  graphics.lineStyle(1, p.groundTop, 0.2).lineBetween(0, 518, TILE_WIDTH, 518);
}

export function getParallaxOffsets(worldDistance: number, mode: RunnerVisualMode = 'standard'): Record<Layer, number> {
  const distance = Math.max(0, worldDistance);
  return {
    far: mode === 'calm' ? 0 : Math.floor(distance * PARALLAX_RATIOS.far),
    middle: mode === 'calm' ? 0 : Math.floor(distance * PARALLAX_RATIOS.middle),
    // Keep fractional scroll in calm mode; rounding a slow layer to whole
    // pixels creates alternating stopped/one-pixel frames despite steady FPS.
    near: mode === 'calm' ? distance : Math.floor(distance * PARALLAX_RATIOS.near),
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
  private readonly ownedTextureKeys = new Set<string>();
  private destroyed = false;

  constructor(private readonly scene: Phaser.Scene, initialDistanceMeters = 0,
    private readonly storyStageId: StoryStageId | null = null,
    private visualMode: RunnerVisualMode = 'calm') {
    this.lastFrame = { distanceMeters: initialDistanceMeters, worldDistance: initialDistanceMeters * 3 };
    // Prepare the finite theme set before countdown; never rasterize new
    // background layers during a moving gate transition.
    this.prepareTextures();
    this.active = this.createSet(this.resolveBiome(initialDistanceMeters));
    this.update(this.lastFrame, 0);
  }

  get biomeId(): RunnerBiomeDefinition['id'] {
    return this.active.biome.id;
  }

  setVisualMode(mode: RunnerVisualMode): void {
    if (this.destroyed || this.visualMode === mode) return;
    this.visualMode = mode;
    this.prepareTextures();
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
    if (this.destroyed) return;
    this.destroyed = true;
    this.destroySet(this.active);
    if (this.outgoing) this.destroySet(this.outgoing);
    this.outgoing = null;
    for (const key of this.ownedTextureKeys) this.scene.textures.remove(key);
    this.ownedTextureKeys.clear();
  }

  private prepareTextures(): void {
    const biomes = this.storyStageId ? [this.resolveBiome(0)] : RUNNER_BIOMES;
    const draw: Record<Layer, (graphics: Phaser.GameObjects.Graphics,
      biome: RunnerBiomeDefinition) => void> = {
      far: (g, biome) => drawSceneryLayer(g, biome, 'far'),
      middle: (g, biome) => drawSceneryLayer(g, biome, 'middle'), near: drawNear,
    };
    for (const biome of biomes) {
      const artBiome = backdropPalette(biome, this.visualMode);
      for (const layer of ['far', 'middle', 'near'] as const) {
        const key = `runner-biome-${biome.id}-${this.visualMode}-${layer}`;
        if (this.ownedTextureKeys.has(key)) continue;
        const graphics = this.scene.add.graphics();
        draw[layer](graphics, artBiome);
        graphics.generateTexture(key, TILE_WIDTH, HEIGHT);
        graphics.destroy();
        this.scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
        this.ownedTextureKeys.add(key);
      }
    }
  }

  private createSet(biome: RunnerBiomeDefinition): BackdropSet {
    const textureKeys: string[] = [];
    const layers = {} as Record<Layer, Phaser.GameObjects.TileSprite>;
    for (const layer of ['far', 'middle', 'near'] as const) {
      const key = `runner-biome-${biome.id}-${this.visualMode}-${layer}`;
      textureKeys.push(key);
      layers[layer] = this.scene.add.tileSprite(0, 0, WIDTH, HEIGHT, key).setOrigin(0, 0);
    }
    const sky = this.scene.add.rectangle(0, 0, WIDTH, HEIGHT, getScenerySkyColor(biome.id)).setOrigin(0, 0);
    const skyDetail = this.scene.add.graphics();
    drawScenerySky(skyDetail, biome);
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
    // Textures are shared across active/outgoing sets and live until teardown.
  }
}
