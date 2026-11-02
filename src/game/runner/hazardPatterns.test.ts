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
      .toEqual([360, 600, 1_440, 2_000, 2_250, 2_550, 3_050, 3_350, 3_700]);
    expect(getPatternForDistance(360).id).toBe('tutorial-jump');
    expect(getPatternForDistance(600).id).toBe('tutorial-slide');
    expect(getPatternForDistance(1_440).id).toBe('practice-jump');
    expect(getPatternForDistance(1_999).maxDistanceMeters).toBe(2_000);
    expect(getPatternForDistance(2_000).id).toBe('combo-jump');
    expect(getPatternForDistance(2_250).id).toBe('combo-slide');
    expect(getPatternForDistance(2_550).id).toBe('combo-jump');
    expect(getPatternForDistance(5_450).id).toBe('combo-double-jump');
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

  it('alternates three-action waves, introduces high barriers, and leaves recovery spans', () => {
    expect(RUNNER_CONFIG.densePatternsPerSection).toBe(3);
    expect(RUNNER_CONFIG.densePatternSpacingMeters).toBe(300);
    expect(RUNNER_CONFIG.denseRecoveryGapMeters).toBe(550);
    const starts = Array.from({ length: 18 }, (_, index) => getPatternStartDistance(index + 3));
    const expectedWaves = [
      [2_000, 2_250, 2_550], [3_050, 3_350, 3_700],
      [4_250, 4_600, 4_850], [5_450, 5_700, 6_000],
    ];
    for (let wave = 0; wave < expectedWaves.length; wave += 1) {
      const start = wave * 3;
      expect(starts.slice(start, start + 3)).toEqual(expectedWaves[wave]);
      if (wave < expectedWaves.length - 1) {
        expect(starts[start + 3] - starts[start + 2]).toBeGreaterThanOrEqual(500);
        expect(starts[start + 3] - starts[start + 2]).toBeLessThanOrEqual(600);
      }
      const kinds = starts.slice(start, start + 3).map((distance) =>
        getPatternForDistance(distance).obstacles[0].kind,
      );
      expect(kinds).toEqual(wave === 3
        ? ['double-jump', 'ground', 'overhead']
        : wave % 2 === 0 ? ['ground', 'overhead', 'ground'] : ['overhead', 'ground', 'overhead']);
    }
    const fastestMetersPerSecond = MAX_RUN_SPEED_UNITS_PER_SECOND * METERS_PER_WORLD_UNIT;
    expect(RUNNER_CONFIG.endlessDensePatternSpacingMinMeters / fastestMetersPerSecond).toBeGreaterThanOrEqual(1.5);
    expect(RUNNER_CONFIG.endlessDenseRecoveryGapMaxMeters / fastestMetersPerSecond).toBeGreaterThanOrEqual(3.5);
  });

  it('keeps generated hazards outside pit zones and preserves one second of action recovery at fastest speed', () => {
    const scheduled: { at: number; kind: string }[] = [];
    let skipNextPattern = false;
    for (let index = 0; ; index += 1) {
      const start = getPatternStartDistance(index);
      if (start > 12_500) break;
      const pattern = getPatternForDistance(start);
      const wasSkippedForRecovery = skipNextPattern;
      skipNextPattern = false;
      const candidate = pattern.obstacles.map((hazard) => ({
        at: getHazardDistance(index, hazard), kind: hazard.kind,
      }));
      const pits = getPitDefinitions(Math.max(...candidate.map(({ at }) => at)) + 215);
      if (candidate.some(({ at, kind }) => pits.some((pit) =>
        isPitClearance(at, pit, RUNNER_CONFIG.pitHazardClearanceMeters +
          (kind === 'ground' ? 46 : 64) / 2 * METERS_PER_WORLD_UNIT)))) continue;
      if (candidate.some(({ at, kind }) => RUNNER_GATE_DISTANCES_M.some((gate) =>
        isGateClearance(at, gate, (kind === 'ground' ? 46 : 64) / 2 * METERS_PER_WORLD_UNIT)))) continue;
      if (!wasSkippedForRecovery) scheduled.push(...candidate);
      if (!wasSkippedForRecovery && pattern.obstacles.some(({ kind }) => kind === 'double-jump')) {
        skipNextPattern = true;
      }
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
      const precedingActionSeconds = scheduled[index - 1].kind === 'ground' ? 0.95
        : scheduled[index - 1].kind === 'double-jump' ? 1.4 : 0.6;
      const minimumRecoverySeconds = scheduled[index - 1].at === 360 && scheduled[index].at === 600
        ? 0.55 // the first tutorial jump is intentionally followed by the slide lesson at 600m
        : 0.5;
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
