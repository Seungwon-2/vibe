import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { drawPickupArt, getPickupBodySize, PICKUP_HAZARD_CLEARANCE_METERS, PICKUP_SCHEDULE } from './CollectibleSpawner';
import { RUNNER_GROUND_Y, STANDING_BODY_HEIGHT } from './runnerPose';
import { RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import { getHazardDistance, getPatternForDistance, getPatternStartDistance } from './hazardPatterns';
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
    expect(PICKUP_SCHEDULE.at(-1)?.distanceMeters).toBe(14_280);
  });

  it('offers safe-route rewards and optional upper coin lines in every cycle', () => {
    for (let index = 0; index < PICKUP_SCHEDULE.length; index += 2) {
      const safe = PICKUP_SCHEDULE[index];
      const air = PICKUP_SCHEDULE[index + 1];
      expect(safe.optionalJump).toBe(false);
      expect(safe.heightUnits).toBe(52);
      expect(air.kind).toBe('coin');
      expect(air.optionalJump).toBe(true);
      expect(air.heightUnits).toBe(116);
      expect(air.distanceMeters - safe.distanceMeters).toBeGreaterThanOrEqual(320);
    }
    expect(PICKUP_SCHEDULE.some((item) => item.kind === 'time')).toBe(true);
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

    for (const pickup of PICKUP_SCHEDULE) {
      for (const hazardDistance of groundHazards) {
        expect(Math.abs(pickup.distanceMeters - hazardDistance),
          `${pickup.id} overlaps a ground hazard at ${hazardDistance}m`,
        ).toBeGreaterThanOrEqual(PICKUP_HAZARD_CLEARANCE_METERS);
      }
    }
  });

  it('keeps five milestone gates separate from pickups', () => {
    expect(RUNNER_GATE_DISTANCES_M).toEqual([2000, 4000, 6000, 8000, 10000]);
    for (const distance of RUNNER_GATE_DISTANCES_M) {
      expect(PICKUP_SCHEDULE.every((pickup) => pickup.distanceMeters !== distance)).toBe(true);
    }
  });
});

describe('pickup collision radius', () => {
  it('extends Hiyori pickup overlap by 20px per side without catching upper coins on the ground', () => {
    expect(getPickupBodySize('player-default')).toBe(24);
    expect(getPickupBodySize('hanayo-hiyori')).toBe(64);
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
