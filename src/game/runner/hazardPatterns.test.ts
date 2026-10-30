import { describe, expect, it } from 'vitest';
import { getPitDefinitions, isPitClearance } from './PitSpawner';
import { RUNNER_CONFIG } from './runnerConfig';
import { getHazardDistance, getPatternForDistance, getPatternStartDistance,
  HAZARD_BANDS, HAZARD_PATTERNS, isGateClearance, MAX_RUN_SPEED_UNITS_PER_SECOND,
  METERS_PER_WORLD_UNIT } from './hazardPatterns';
import { RUNNER_GATE_DISTANCES_M } from './runnerConfig';

describe('authored hazard patterns', () => {
  it('uses the shortened tutorial and practice bands and deterministic early starts', () => {
    expect(HAZARD_BANDS.map(({ id, minDistanceMeters, maxDistanceMeters }) =>
      [id, minDistanceMeters, maxDistanceMeters])).toEqual([
      ['tutorial', 0, 1_000], ['practice', 1_000, 2_000],
      ['combination', 2_000, 6_000], ['advanced', 6_000, null],
    ]);
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(getPatternStartDistance))
      .toEqual([360, 600, 1_440, 2_000, 2_360, 2_720, 3_360, 3_720, 4_080]);
    expect(getPatternForDistance(360).id).toBe('tutorial-jump');
    expect(getPatternForDistance(600).id).toBe('tutorial-slide');
    expect(getPatternForDistance(1_440).id).toBe('practice-jump');
    expect(getPatternForDistance(1_999).maxDistanceMeters).toBe(2_000);
    expect(getPatternForDistance(2_000).id).toBe('combo-jump');
    expect(getPatternForDistance(2_360).id).toBe('combo-slide');
    expect(getPatternForDistance(2_720).id).toBe('combo-jump');
    expect(getPatternForDistance(3_360).id).toBe('combo-slide');
    expect(getPatternForDistance(5_999).maxDistanceMeters).toBe(6_000);
    expect(getPatternForDistance(6_000).id).toBe('advanced-slide');
    expect(getPatternForDistance(6_000)).toBe(getPatternForDistance(6_000));
    expect(() => getPatternStartDistance(-1)).toThrow(RangeError);
  });

  it('keeps every authored slot to one jump or slide action and preserves warning lead', () => {
    expect(HAZARD_PATTERNS.every((pattern) => pattern.obstacles.length === 1)).toBe(true);
    const visibleLeadMeters = (960 - 170) * METERS_PER_WORLD_UNIT;
    const fastestMetersPerSecond = MAX_RUN_SPEED_UNITS_PER_SECOND * METERS_PER_WORLD_UNIT;
    expect(visibleLeadMeters / fastestMetersPerSecond).toBeGreaterThanOrEqual(1.25);
    for (const pattern of HAZARD_PATTERNS) {
      for (const hazard of pattern.obstacles) {
        expect(hazard.width).toBeGreaterThan(0);
        expect(hazard.height).toBeGreaterThan(0);
        expect(hazard.warningColor).toMatch(/^#[\da-f]{6}$/i);
      }
    }
  });

  it('alternates three-action waves and leaves a 640m recovery span', () => {
    expect(RUNNER_CONFIG.densePatternsPerSection).toBe(3);
    expect(RUNNER_CONFIG.densePatternSpacingMeters).toBe(360);
    expect(RUNNER_CONFIG.denseRecoveryGapMeters).toBe(640);
    const period = (RUNNER_CONFIG.densePatternsPerSection - 1) *
      RUNNER_CONFIG.densePatternSpacingMeters + RUNNER_CONFIG.denseRecoveryGapMeters;
    expect(period).toBe(1_360);
    const starts = Array.from({ length: 18 }, (_, index) => getPatternStartDistance(index + 3));
    for (let wave = 0; wave < 6; wave += 1) {
      const start = wave * 3;
      expect(starts.slice(start, start + 3)).toEqual([
        2_000 + wave * period,
        2_000 + wave * period + 360,
        2_000 + wave * period + 720,
      ]);
      if (wave < 5) expect(starts[start + 3] - starts[start + 2]).toBe(640);
      const kinds = starts.slice(start, start + 3).map((distance) =>
        getPatternForDistance(distance).obstacles[0].kind,
      );
      expect(kinds).toEqual(wave % 2 === 0
        ? ['ground', 'overhead', 'ground'] : ['overhead', 'ground', 'overhead']);
    }
    expect(starts[3] - starts[0]).toBe(1_360);
    const fastestMetersPerSecond = MAX_RUN_SPEED_UNITS_PER_SECOND * METERS_PER_WORLD_UNIT;
    expect(RUNNER_CONFIG.densePatternSpacingMeters / fastestMetersPerSecond).toBeGreaterThanOrEqual(2.5);
    expect(RUNNER_CONFIG.denseRecoveryGapMeters / fastestMetersPerSecond).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps generated hazards outside pit zones and preserves one second of action recovery at fastest speed', () => {
    const scheduled: { at: number; kind: string }[] = [];
    for (let index = 0; ; index += 1) {
      const start = getPatternStartDistance(index);
      if (start > 12_500) break;
      const pattern = getPatternForDistance(start);
      const candidate = pattern.obstacles.map((hazard) => ({
        at: getHazardDistance(index, hazard), kind: hazard.kind,
      }));
      const pits = getPitDefinitions(Math.max(...candidate.map(({ at }) => at)) + 215);
      if (candidate.some(({ at, kind }) => pits.some((pit) =>
        isPitClearance(at, pit, RUNNER_CONFIG.pitHazardClearanceMeters +
          (kind === 'ground' ? 46 : 64) / 2 * METERS_PER_WORLD_UNIT)))) continue;
      if (candidate.some(({ at, kind }) => RUNNER_GATE_DISTANCES_M.some((gate) =>
        isGateClearance(at, gate, (kind === 'ground' ? 46 : 64) / 2 * METERS_PER_WORLD_UNIT)))) continue;
      scheduled.push(...candidate);
    }

    for (const hazard of scheduled) {
      for (const pit of getPitDefinitions(12_500)) {
        const width = hazard.kind === 'ground' ? 46 : 64;
        expect(isPitClearance(hazard.at, pit,
          RUNNER_CONFIG.pitHazardClearanceMeters + width / 2 * METERS_PER_WORLD_UNIT)).toBe(false);
      }
      for (const gate of RUNNER_GATE_DISTANCES_M) {
        const width = hazard.kind === 'ground' ? 46 : 64;
        expect(isGateClearance(hazard.at, gate, width / 2 * METERS_PER_WORLD_UNIT)).toBe(false);
      }
    }
    for (let index = 1; index < scheduled.length; index += 1) {
      const gapSeconds = (scheduled[index].at - scheduled[index - 1].at) /
        METERS_PER_WORLD_UNIT / MAX_RUN_SPEED_UNITS_PER_SECOND;
      const precedingActionSeconds = scheduled[index - 1].kind === 'ground' ? 0.95 : 0.6;
      const minimumRecoverySeconds = scheduled[index - 1].at === 360 && scheduled[index].at === 600
        ? 0.7 // the first tutorial jump is intentionally followed by the slide lesson at 600m
        : 1;
      expect(gapSeconds - precedingActionSeconds).toBeGreaterThanOrEqual(minimumRecoverySeconds);
    }
  });

  it('treats gate clearance boundaries inclusively and includes the object footprint', () => {
    const gate = 2_000;
    const halfWidth = 10;
    expect(isGateClearance(gate + RUNNER_CONFIG.gateClearanceMeters + halfWidth, gate, halfWidth)).toBe(true);
    expect(isGateClearance(gate + RUNNER_CONFIG.gateClearanceMeters + halfWidth + 0.01, gate, halfWidth)).toBe(false);
    expect(isGateClearance(gate, gate, 0)).toBe(true);
  });
});
