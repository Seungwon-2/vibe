import { describe, expect, it } from 'vitest';
import { getPickupBodySize, PICKUP_HAZARD_CLEARANCE_METERS, PICKUP_SCHEDULE } from './CollectibleSpawner';
import { RUNNER_GROUND_Y, STANDING_BODY_HEIGHT } from './runnerPose';
import { RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import { getHazardDistance, getPatternForDistance, PATTERN_SPACING_METERS,
  PATTERN_START_METERS } from './hazardPatterns';

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
    const patternCount = Math.ceil((maxDistance - PATTERN_START_METERS) / PATTERN_SPACING_METERS) + 1;
    const groundHazards: number[] = [];
    for (let patternIndex = 0; patternIndex < patternCount; patternIndex += 1) {
      const start = PATTERN_START_METERS + patternIndex * PATTERN_SPACING_METERS;
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

  it('keeps the three milestone gates separate from pickups', () => {
    expect(RUNNER_GATE_DISTANCES_M).toEqual([2500, 5000, 7500]);
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
