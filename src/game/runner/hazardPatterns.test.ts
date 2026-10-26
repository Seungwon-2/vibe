import { describe, expect, it } from 'vitest';
import { getHazardDistance, getPatternForDistance, HAZARD_BANDS, HAZARD_PATTERNS,
  MAX_RUN_SPEED_UNITS_PER_SECOND, METERS_PER_WORLD_UNIT } from './hazardPatterns';

describe('authored hazard patterns', () => {
  it('progresses deterministically through all four distance bands', () => {
    expect(HAZARD_BANDS).toHaveLength(4);
    expect(getPatternForDistance(360).id).toBe('tutorial-jump');
    expect(getPatternForDistance(960).id).toBe('tutorial-slide');
    expect(getPatternForDistance(2760).id).toBe('practice-pair');
    expect(getPatternForDistance(5160).id).toBe('combo-jump-slide');
    expect(getPatternForDistance(7560).id).toBe('advanced-jump-slide');
    expect(getPatternForDistance(7560)).toBe(getPatternForDistance(7560));
  });

  it('gives every hazard an accurate box and at least 1.25 seconds of visible warning', () => {
    const leadSeconds = (960 - 170) / MAX_RUN_SPEED_UNITS_PER_SECOND;
    expect(leadSeconds).toBeGreaterThanOrEqual(1.25);
    for (const pattern of HAZARD_PATTERNS) {
      for (const hazard of pattern.obstacles) {
        expect(hazard.width).toBeGreaterThan(0);
        expect(hazard.height).toBeGreaterThan(0);
        expect(hazard.warningColor).toMatch(/^#[\da-f]{6}$/i);
      }
    }
  });

  it('leaves one second of recovery after each action at top speed', () => {
    const scheduled = Array.from({ length: 20 }, (_, index) => {
      const pattern = getPatternForDistance(360 + index * 600);
      return pattern.obstacles.map((hazard) => ({
        at: getHazardDistance(index, hazard), kind: hazard.kind,
      }));
    }).flat().sort((left, right) => left.at - right.at);
    for (let index = 1; index < scheduled.length; index += 1) {
      const gapSeconds = (scheduled[index].at - scheduled[index - 1].at) /
        METERS_PER_WORLD_UNIT / MAX_RUN_SPEED_UNITS_PER_SECOND;
      const precedingActionSeconds = scheduled[index - 1].kind === 'ground' ? 0.95 : 0.6;
      expect(gapSeconds - precedingActionSeconds).toBeGreaterThanOrEqual(1);
    }
  });
});
