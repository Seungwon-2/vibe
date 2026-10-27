import { describe, expect, it } from 'vitest';
import { getPitDefinitions, isPitClearance } from './PitSpawner';
import { RUNNER_CONFIG } from './runnerConfig';
import { getHazardDistance, getPatternForDistance, getPatternStartDistance,
  HAZARD_BANDS, HAZARD_PATTERNS, MAX_RUN_SPEED_UNITS_PER_SECOND, METERS_PER_WORLD_UNIT } from './hazardPatterns';

describe('authored hazard patterns', () => {
  it('uses the shortened tutorial and practice bands and deterministic early starts', () => {
    expect(HAZARD_BANDS.map(({ id, minDistanceMeters, maxDistanceMeters }) =>
      [id, minDistanceMeters, maxDistanceMeters])).toEqual([
      ['tutorial', 0, 1_000], ['practice', 1_000, 2_000],
      ['combination', 2_000, 6_000], ['advanced', 6_000, null],
    ]);
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(getPatternStartDistance))
      .toEqual([360, 900, 1_440, 2_000, 2_300, 2_600, 3_150, 3_450, 3_750]);
    expect(getPatternForDistance(360).id).toBe('tutorial-jump');
    expect(getPatternForDistance(900).id).toBe('tutorial-slide');
    expect(getPatternForDistance(1_440).id).toBe('practice-jump');
    expect(getPatternForDistance(1_999).maxDistanceMeters).toBe(2_000);
    expect(getPatternForDistance(2_000).id).toBe('combo-jump');
    expect(getPatternForDistance(2_300).id).toBe('combo-slide');
    expect(getPatternForDistance(2_600).id).toBe('combo-jump');
    expect(getPatternForDistance(3_150).id).toBe('combo-slide');
    expect(getPatternForDistance(5_999).maxDistanceMeters).toBe(6_000);
    expect(getPatternForDistance(6_000).id).toBe('advanced-jump');
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

  it('alternates three-action waves and leaves a 550m recovery span', () => {
    expect(RUNNER_CONFIG.densePatternsPerSection).toBe(3);
    expect(RUNNER_CONFIG.densePatternSpacingMeters).toBe(300);
    expect(RUNNER_CONFIG.denseRecoveryGapMeters).toBe(550);
    const period = (RUNNER_CONFIG.densePatternsPerSection - 1) *
      RUNNER_CONFIG.densePatternSpacingMeters + RUNNER_CONFIG.denseRecoveryGapMeters;
    expect(period).toBe(1_150);
    const starts = Array.from({ length: 18 }, (_, index) => getPatternStartDistance(index + 3));
    for (let wave = 0; wave < 6; wave += 1) {
      const start = wave * 3;
      expect(starts.slice(start, start + 3)).toEqual([
        2_000 + wave * period,
        2_000 + wave * period + 300,
        2_000 + wave * period + 600,
      ]);
      if (wave < 5) expect(starts[start + 3] - starts[start + 2]).toBe(550);
      const kinds = starts.slice(start, start + 3).map((distance) =>
        getPatternForDistance(distance).obstacles[0].kind,
      );
      expect(kinds).toEqual(wave % 2 === 0
        ? ['ground', 'overhead', 'ground'] : ['overhead', 'ground', 'overhead']);
    }
    expect(starts[3] - starts[0]).toBe(1_150);
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
      if (candidate.some(({ at }) => pits.some((pit) => isPitClearance(at, pit)))) continue;
      scheduled.push(...candidate);
    }

    for (const hazard of scheduled) {
      for (const pit of getPitDefinitions(12_500)) expect(isPitClearance(hazard.at, pit)).toBe(false);
    }
    for (let index = 1; index < scheduled.length; index += 1) {
      const gapSeconds = (scheduled[index].at - scheduled[index - 1].at) /
        METERS_PER_WORLD_UNIT / MAX_RUN_SPEED_UNITS_PER_SECOND;
      const precedingActionSeconds = scheduled[index - 1].kind === 'ground' ? 0.95 : 0.6;
      expect(gapSeconds - precedingActionSeconds).toBeGreaterThanOrEqual(1);
    }
  });
});
