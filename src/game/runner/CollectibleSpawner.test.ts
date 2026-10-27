import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { drawPickupArt, generatePickupSchedule, getPickupBodySize, PICKUP_HAZARD_CLEARANCE_METERS, PICKUP_SCHEDULE } from './CollectibleSpawner';
import { RUNNER_GROUND_Y, STANDING_BODY_HEIGHT } from './runnerPose';
import { RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import { getHazardDistance, getPatternForDistance, getPatternStartDistance } from './hazardPatterns';
import { getPitDefinitions, isPitClearance } from './PitSpawner';
import { RUNNER_BIOMES } from '../visuals/runnerBiomes';

function makeGraphics() {
  const graphics = {
    fillStyle: vi.fn(() => graphics), lineStyle: vi.fn(() => graphics),
    fillCircle: vi.fn(() => graphics), strokeCircle: vi.fn(() => graphics),
    fillRoundedRect: vi.fn(() => graphics), strokeRoundedRect: vi.fn(() => graphics),
    fillEllipse: vi.fn(() => graphics), fillTriangle: vi.fn(() => graphics),
    lineBetween: vi.fn(() => graphics),
  };
  return graphics;
}

describe('authored collectible schedule', () => {
  it('uses unique stable IDs and increasing absolute distances', () => {
    expect(new Set(PICKUP_SCHEDULE.map((pickup) => pickup.id)).size).toBe(PICKUP_SCHEDULE.length);
    const sorted = [...PICKUP_SCHEDULE].sort((a, b) => a.distanceMeters - b.distanceMeters);
    expect(PICKUP_SCHEDULE).toEqual(sorted);
    expect(PICKUP_SCHEDULE[0].distanceMeters).toBe(160);
    expect(PICKUP_SCHEDULE.at(-1)?.distanceMeters).toBeLessThanOrEqual(15_000);
    expect(PICKUP_SCHEDULE.length).toBeGreaterThan(70);
  });

  it('generates a stable safe-route stream with 100–150m spacing and time items replacing coins', () => {
    const generated = generatePickupSchedule(15_000);
    expect(generated).toEqual(PICKUP_SCHEDULE);
    const safe = generated.filter((item) => !item.optionalJump);
    expect(safe[0]).toMatchObject({ distanceMeters: 160, heightUnits: 52, optionalJump: false });
    const knownHazards: number[] = [];
    for (let patternIndex = 0; ; patternIndex += 1) {
      const start = getPatternStartDistance(patternIndex);
      if (start > 15_000) break;
      for (const hazard of getPatternForDistance(start).obstacles) {
        if (hazard.kind === 'ground') knownHazards.push(getHazardDistance(patternIndex, hazard));
      }
    }
    const knownPits = getPitDefinitions(15_000);
    for (let index = 1; index < safe.length; index += 1) {
      const previous = safe[index - 1].distanceMeters;
      const current = safe[index].distanceMeters;
      const gap = current - previous;
      expect(gap).toBeGreaterThanOrEqual(100);
      if (gap > 150) {
        const blocked = knownHazards.some((hazard) => hazard >= previous + 100 && hazard <= current - 100) ||
          knownPits.some((pit) => pit.distanceMeters >= previous + 100 && pit.distanceMeters <= current - 100) ||
          RUNNER_GATE_DISTANCES_M.some((gate) => gate >= previous + 100 && gate <= current - 100);
        expect(blocked, `the ${gap}m safe-pickup gap has no hazard or course landmark`).toBe(true);
      }
    }
    expect(Math.max(...safe.slice(1).map((item, index) => item.distanceMeters - safe[index].distanceMeters)))
      .toBeLessThanOrEqual(250); // larger gaps are allowed only when the intervening slot is blocked.
    const timeItems = safe.filter((item) => item.kind === 'time');
    expect(timeItems.length).toBeGreaterThan(0);
    for (const [index, item] of timeItems.entries()) {
      const target = 1_360 + index * 2_400;
      expect(Math.abs(item.distanceMeters - target)).toBeLessThanOrEqual(75);
    }
  });

  it('keeps optional coins elevated and omits unsafe positions', () => {
    const optional = PICKUP_SCHEDULE.filter((pickup) => pickup.optionalJump);
    expect(optional.length).toBeGreaterThan(0);
    expect(optional.every((pickup) => pickup.kind === 'coin' && pickup.heightUnits === 116)).toBe(true);
    expect(optional.length).toBeLessThan(25); // unsafe authored slots are omitted
  });

  it('keeps pickups outside the collision window of every ground hazard', () => {
    const maxDistance = PICKUP_SCHEDULE.at(-1)!.distanceMeters;
    const groundHazards: number[] = [];
    for (let patternIndex = 0; ; patternIndex += 1) {
      const start = getPatternStartDistance(patternIndex);
      if (start > maxDistance) break;
      for (const hazard of getPatternForDistance(start).obstacles) {
        if (hazard.kind === 'ground') groundHazards.push(getHazardDistance(patternIndex, hazard));
      }
    }

    const pits = getPitDefinitions(maxDistance + PICKUP_HAZARD_CLEARANCE_METERS);
    for (const pickup of PICKUP_SCHEDULE) {
      for (const hazardDistance of groundHazards) {
        expect(Math.abs(pickup.distanceMeters - hazardDistance),
          `${pickup.id} overlaps a ground hazard at ${hazardDistance}m`,
        ).toBeGreaterThanOrEqual(PICKUP_HAZARD_CLEARANCE_METERS);
      }
      for (const pit of pits) {
        expect(isPitClearance(pickup.distanceMeters, pit, PICKUP_HAZARD_CLEARANCE_METERS),
          `${pickup.id} overlaps pit clearance at ${pit.distanceMeters}m`).toBe(false);
      }
      for (const gate of RUNNER_GATE_DISTANCES_M) {
        expect(Math.abs(pickup.distanceMeters - gate), `${pickup.id} overlaps gate at ${gate}m`)
          .toBeGreaterThanOrEqual(PICKUP_HAZARD_CLEARANCE_METERS);
      }
    }
  });

  it('keeps five milestone gates separate from pickups', () => {
    expect(RUNNER_GATE_DISTANCES_M).toEqual([2000, 4000, 6000, 8000, 10000]);
    for (const distance of RUNNER_GATE_DISTANCES_M) {
      expect(PICKUP_SCHEDULE.every((pickup) =>
        Math.abs(pickup.distanceMeters - distance) >= PICKUP_HAZARD_CLEARANCE_METERS)).toBe(true);
    }
  });
});

describe('pickup collision radius', () => {
  it('reserves pickup-radius expansion for Mary without catching upper coins on the ground', () => {
    expect(getPickupBodySize('player-default')).toBe(24);
    expect(getPickupBodySize('hanayo-hiyori')).toBe(24);
    expect(getPickupBodySize('tokino-mary')).toBe(84);
    const upper = PICKUP_SCHEDULE.find((pickup) => pickup.optionalJump);
    expect(upper).toBeDefined();
    const upperBottom = RUNNER_GROUND_Y - upper!.heightUnits + getPickupBodySize('hanayo-hiyori') / 2;
    const standingTop = RUNNER_GROUND_Y - STANDING_BODY_HEIGHT;
    expect(upperBottom).toBeLessThan(standingTop);
  });
});

describe('themed pickup art', () => {
  it('keeps coin and clock silhouettes distinct and outlined in every biome', () => {
    for (const biome of RUNNER_BIOMES) {
      const coin = makeGraphics();
      drawPickupArt(coin as unknown as Phaser.GameObjects.Graphics, 'coin', biome);
      expect(coin.fillCircle).toHaveBeenCalledWith(0, 0, 11);
      expect(coin.strokeCircle).toHaveBeenCalledWith(0, 0, 11);
      expect(coin.lineStyle).toHaveBeenCalledWith(2, biome.palette.hazardContrast, 0.96);

      const time = makeGraphics();
      drawPickupArt(time as unknown as Phaser.GameObjects.Graphics, 'time', biome);
      expect(time.fillRoundedRect).toHaveBeenCalledWith(-11, -11, 22, 22, 6);
      expect(time.strokeRoundedRect).toHaveBeenCalledWith(-11, -11, 22, 22, 6);
      expect(time.lineBetween).toHaveBeenCalledWith(0, -4, 0, 0);
      expect(time.lineBetween).toHaveBeenCalledWith(0, 0, 3, 2);
      expect(time.fillStyle).toHaveBeenCalledWith(biome.palette.pickupTime);
      expect(time.fillStyle).not.toHaveBeenCalledWith(biome.palette.pickupCoin);
    }
  });
});
