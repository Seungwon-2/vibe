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
      .toEqual([360, 620, 1_548, 2_000, 2_280, 2_560, 3_075, 3_355, 3_635]);
    expect(getPatternForDistance(360).id).toBe('tutorial-jump');
    expect(getPatternForDistance(620).id).toBe('tutorial-slide');
    expect(getPatternForDistance(1_548).id).toBe('practice-jump');
    expect(getPatternForDistance(1_999).maxDistanceMeters).toBe(2_000);
    expect(getPatternForDistance(2_000).id).toBe('combo-jump');
    expect(getPatternForDistance(2_300).id).toBe('combo-slide');
    expect(getPatternForDistance(2_600).id).toBe('combo-jump');
    expect(getPatternForDistance(5_450).id).toBe('combo-jump');
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

  it('continues scheduling hazards well beyond the original 15,000m pickup horizon', () => {
    const starts = Array.from({ length: 80 }, (_, index) => getPatternStartDistance(index));
    expect(starts.at(-1)).toBeGreaterThan(15_000);
    expect(starts).toEqual([...starts].sort((left, right) => left - right));
    expect(getPatternForDistance(starts.at(-1)!).obstacles).toHaveLength(1);
  });

  it('alternates three-action waves, introduces high barriers, and leaves recovery spans', () => {
    expect(RUNNER_CONFIG.densePatternsPerSection).toBe(3);
    expect(RUNNER_CONFIG.densePatternSpacingMeters).toBe(280);
    expect(RUNNER_CONFIG.denseRecoveryGapMeters).toBe(515);
    const starts = Array.from({ length: 18 }, (_, index) => getPatternStartDistance(index + 3));
    const expectedWaves = [
      [2_000, 2_280, 2_560], [3_075, 3_355, 3_635],
      [4_150, 4_408, 4_666], [5_115, 5_373, 5_631],
    ];
    for (let wave = 0; wave < expectedWaves.length; wave += 1) {
      const start = wave * 3;
      expect(starts.slice(start, start + 3)).toEqual(expectedWaves[wave]);
      if (wave < expectedWaves.length - 1) {
        const waveIndex = wave;
        const tier = Math.floor(waveIndex / RUNNER_CONFIG.endlessDenseWavesPerDifficultyTier);
        const expectedRecovery = Math.max(RUNNER_CONFIG.endlessDenseRecoveryFloorMeters,
          RUNNER_CONFIG.denseRecoveryGapMeters - tier *
            RUNNER_CONFIG.endlessDenseRecoveryDecreasePerTierMeters);
        expect(starts[start + 3] - starts[start + 2]).toBe(expectedRecovery);
      }
      const kinds = starts.slice(start, start + 3).map((distance) =>
        getPatternForDistance(distance).obstacles[0].kind,
      );
      expect(kinds).toEqual(wave === 3
        ? ['double-jump', 'ground', 'overhead']
        : wave % 2 === 0 ? ['ground', 'overhead', 'ground'] : ['overhead', 'ground', 'overhead']);
    }
    const fastestMetersPerSecond = MAX_RUN_SPEED_UNITS_PER_SECOND * METERS_PER_WORLD_UNIT;
    expect(RUNNER_CONFIG.endlessDenseSpacingFloorMeters / fastestMetersPerSecond).toBeGreaterThanOrEqual(1.4);
    expect(RUNNER_CONFIG.endlessDenseRecoveryFloorMeters / fastestMetersPerSecond).toBeGreaterThanOrEqual(2);
    const spacingByWave = Array.from({ length: 12 }, (_, waveIndex) =>
      getPatternStartDistance(4 + waveIndex * RUNNER_CONFIG.densePatternsPerSection) -
      getPatternStartDistance(3 + waveIndex * RUNNER_CONFIG.densePatternsPerSection));
    const recoveryByWave = Array.from({ length: 12 }, (_, waveIndex) => {
      const last = getPatternStartDistance(3 + waveIndex * RUNNER_CONFIG.densePatternsPerSection +
        RUNNER_CONFIG.densePatternsPerSection - 1);
      const next = getPatternStartDistance(3 + (waveIndex + 1) * RUNNER_CONFIG.densePatternsPerSection);
      return next - last;
    });
    expect(spacingByWave.every((spacing, index) => index === 0 || spacing <= spacingByWave[index - 1])).toBe(true);
    const standardRecoveryGaps = recoveryByWave.filter((_, index) =>
      (index + 1) % RUNNER_CONFIG.endlessDenseWidePitRecoveryIntervalWaves !== 0);
    expect(standardRecoveryGaps.every((gap, index) => index === 0 || gap <= standardRecoveryGaps[index - 1]))
      .toBe(true);
    expect(recoveryByWave[RUNNER_CONFIG.endlessDenseWidePitRecoveryIntervalWaves - 1])
      .toBe(RUNNER_CONFIG.endlessDenseWidePitRecoveryGapMeters);
  });

  it('rotates the double-jump challenge position without changing its recovery spacing', () => {
    const expectedSlots = [0, 1, 2, 1];
    for (let rotation = 0; rotation < expectedSlots.length; rotation += 1) {
      const waveIndex = 3 + rotation * 4;
      const startPatternIndex = 3 + waveIndex * RUNNER_CONFIG.densePatternsPerSection;
      const starts = Array.from({ length: RUNNER_CONFIG.densePatternsPerSection }, (_, slot) =>
        getPatternStartDistance(startPatternIndex + slot),
      );
      const kinds = starts.map((distance) => getPatternForDistance(distance).obstacles[0].kind);
      expect(kinds.filter((kind) => kind === 'double-jump')).toHaveLength(1);
      expect(kinds.indexOf('double-jump')).toBe(expectedSlots[rotation]);
      expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(RUNNER_CONFIG.endlessDenseSpacingFloorMeters);
      expect(starts[2] - starts[1]).toBeGreaterThanOrEqual(RUNNER_CONFIG.endlessDenseSpacingFloorMeters);
    }
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
      const pits = getPitDefinitions(12_500);
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
          RUNNER_CONFIG.pitHazardClearanceMeters + width / 2 * METERS_PER_WORLD_UNIT),
        `${hazard.at}m hazard overlaps ${pit.id} at ${pit.distanceMeters}m`).toBe(false);
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
      const minimumRecoverySeconds = scheduled[index - 1].at === 360 && scheduled[index].at === 620
        ? 0.55 // first tutorial jump leads into the slide lesson before the first pit
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
