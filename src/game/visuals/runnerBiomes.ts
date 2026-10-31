import { RUNNER_GATE_DISTANCES_M } from '../runner/runnerConfig';
import type { RunnerBiomeId } from '../runner/runnerTypes';

export type RunnerBiomeDefinition = Readonly<{
  id: RunnerBiomeId;
  startDistanceMeters: number;
  landmark: string;
  palette: Readonly<{
    sky: number;
    far: number;
    middle: number;
    ground: number;
    accent: number;
    hazardContrast: number;
    groundTop: number;
    groundFace: number;
    pickupCoin: number;
    pickupTime: number;
    gate: number;
  }>;
}>;

export const RUNNER_BIOMES: readonly RunnerBiomeDefinition[] = Object.freeze([
  {
    id: 'dawn-city', startDistanceMeters: 0, landmark: '새벽 도심',
    palette: {
      sky: 0xfff0e8, far: 0xe8d9e5, middle: 0xc9cde5, ground: 0xf1e7f1,
      accent: 0xffc58f, hazardContrast: 0x3a345c, groundTop: 0xc3afd4,
      groundFace: 0xfaf3f8, pickupCoin: 0x93601e, pickupTime: 0x4a7fa9,
      gate: 0x8c78b6,
    },
  },
  {
    id: 'moonlit-forest', startDistanceMeters: RUNNER_GATE_DISTANCES_M[0],
    landmark: '달빛 숲길',
    palette: {
      sky: 0xe6f2e8, far: 0xc6ddcf, middle: 0xa6c7b8, ground: 0xe6efe6,
      accent: 0xf1d98e, hazardContrast: 0x2d4850, groundTop: 0x9cbcae,
      groundFace: 0xf4f7ed, pickupCoin: 0x93651e, pickupTime: 0x43808a,
      gate: 0x67878a,
    },
  },
  {
    id: 'crystal-mine', startDistanceMeters: RUNNER_GATE_DISTANCES_M[1],
    landmark: '수정 광산',
    palette: {
      sky: 0xf0ebff, far: 0xd8cff2, middle: 0xb9addf, ground: 0xe9e4f5,
      accent: 0x83dcd5, hazardContrast: 0x3b315d, groundTop: 0xb7a9d9,
      groundFace: 0xf5f1fb, pickupCoin: 0x93651e, pickupTime: 0x3d8196,
      gate: 0x8069b0,
    },
  },
  {
    id: 'cloud-skyway', startDistanceMeters: RUNNER_GATE_DISTANCES_M[2],
    landmark: '구름 위 하늘길',
    palette: {
      sky: 0xeaf5ff, far: 0xf9fcff, middle: 0xd0e2f7, ground: 0xe9f1fb,
      accent: 0xffe8a8, hazardContrast: 0x344b70, groundTop: 0xa9c5e6,
      groundFace: 0xf7fbff, pickupCoin: 0x93651e, pickupTime: 0x5484b2,
      gate: 0x829fca,
    },
  },
]);

const BIOME_BY_ID = new Map(RUNNER_BIOMES.map((biome) => [biome.id, biome]));

export function getBiomeById(biomeId: RunnerBiomeId): RunnerBiomeDefinition {
  const biome = BIOME_BY_ID.get(biomeId);
  if (!biome) throw new Error('Unknown runner biome: ' + biomeId);
  return biome;
}

export function getBiomeForDistance(distanceMeters: number): RunnerBiomeDefinition {
  let biome = RUNNER_BIOMES[0];
  for (const candidate of RUNNER_BIOMES) {
    if (distanceMeters < candidate.startDistanceMeters) break;
    biome = candidate;
  }
  return biome;
}
