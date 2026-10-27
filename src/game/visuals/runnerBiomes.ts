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
      sky: 0xe8ecfa, far: 0xc6d4ed, middle: 0x91add0, ground: 0xd2e2f7,
      accent: 0xffd19a, hazardContrast: 0x263d73, groundTop: 0xa2bbdb,
      groundFace: 0xe5eefb, pickupCoin: 0xb9852e, pickupTime: 0x638cbd,
      gate: 0x889ed0,
    },
  },
  {
    id: 'moonlit-forest', startDistanceMeters: RUNNER_GATE_DISTANCES_M[0],
    landmark: '달빛 숲길',
    palette: {
      sky: 0xb8c9dd, far: 0x8cacbe, middle: 0x648b90, ground: 0xc8d9d7,
      accent: 0xf8f0cf, hazardContrast: 0x233b55, groundTop: 0x92b4b0,
      groundFace: 0xe2e9e1, pickupCoin: 0xb58235, pickupTime: 0x4b8e9e,
      gate: 0x7796ac,
    },
  },
  {
    id: 'crystal-mine', startDistanceMeters: RUNNER_GATE_DISTANCES_M[1],
    landmark: '수정 광산',
    palette: {
      sky: 0xc9c0df, far: 0xaaa1cf, middle: 0x8c7db2, ground: 0xd2cbed,
      accent: 0xa2f3ef, hazardContrast: 0x322659, groundTop: 0xb2a7d4,
      groundFace: 0xe5def4, pickupCoin: 0xb58543, pickupTime: 0x5b95aa,
      gate: 0x8c78ba,
    },
  },
  {
    id: 'cloud-skyway', startDistanceMeters: RUNNER_GATE_DISTANCES_M[2],
    landmark: '구름 위 하늘길',
    palette: {
      sky: 0xe7f1ff, far: 0xf8fbff, middle: 0xbfd4ed, ground: 0xe0ebfb,
      accent: 0xfff5d4, hazardContrast: 0x2f4a7c, groundTop: 0xb6cce8,
      groundFace: 0xedf5ff, pickupCoin: 0xba8332, pickupTime: 0x739acc,
      gate: 0x9ebce5,
    },
  },
]);

export function getBiomeForDistance(distanceMeters: number): RunnerBiomeDefinition {
  let biome = RUNNER_BIOMES[0];
  for (const candidate of RUNNER_BIOMES) {
    if (distanceMeters < candidate.startDistanceMeters) break;
    biome = candidate;
  }
  return biome;
}
