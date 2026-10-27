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
      sky: 0x101a39, far: 0x26345e, middle: 0x31476a, ground: 0x18233f,
      accent: 0xffb870, hazardContrast: 0xfff0be, groundTop: 0x59bcc9,
      groundFace: 0x23334d, pickupCoin: 0xffd166, pickupTime: 0x5be0ef,
      gate: 0xffa777,
    },
  },
  {
    id: 'moonlit-forest', startDistanceMeters: RUNNER_GATE_DISTANCES_M[0],
    landmark: '달빛 숲길',
    palette: {
      sky: 0x0b1830, far: 0x15364b, middle: 0x1d4d58, ground: 0x123344,
      accent: 0xb7d0ff, hazardContrast: 0xf5f9d0, groundTop: 0x5fbaa6,
      groundFace: 0x194254, pickupCoin: 0xffe07c, pickupTime: 0x75e7ee,
      gate: 0xbdc8ff,
    },
  },
  {
    id: 'crystal-mine', startDistanceMeters: RUNNER_GATE_DISTANCES_M[1],
    landmark: '수정 광산',
    palette: {
      sky: 0x171536, far: 0x33295b, middle: 0x473568, ground: 0x242045,
      accent: 0x85f2f8, hazardContrast: 0xfff6ce, groundTop: 0x78dce8,
      groundFace: 0x3b325d, pickupCoin: 0xffe18a, pickupTime: 0x91efff,
      gate: 0xbfa6ff,
    },
  },
  {
    id: 'cloud-skyway', startDistanceMeters: RUNNER_GATE_DISTANCES_M[2],
    landmark: '구름 위 하늘길',
    palette: {
      sky: 0x9bcae9, far: 0xc5d5ef, middle: 0x8da8d3, ground: 0x566c9e,
      accent: 0xfff6d2, hazardContrast: 0xffffff, groundTop: 0xf5e8ff,
      groundFace: 0x526492, pickupCoin: 0x795000, pickupTime: 0x0d5f76,
      gate: 0x60428f,
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
