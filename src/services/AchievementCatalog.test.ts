import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, getAchievementDisplayName } from './AchievementCatalog';

describe('getAchievementDisplayName', () => {
  it('returns the catalog label for a known achievement', () => {
    const achievement = ACHIEVEMENTS[0];
    expect(getAchievementDisplayName(achievement.id)).toBe(achievement.name);
  });

  it('returns a localized fallback for unknown identifiers', () => {
    expect(getAchievementDisplayName('internal-secret-id')).toBe('알 수 없는 업적');
  });
});
