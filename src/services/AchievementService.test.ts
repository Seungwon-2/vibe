import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../game/characters/characterCatalog';
import { STORY_STAGES } from '../game/runner/storyConfig';
import type { RunnerResult } from '../game/runner/runnerTypes';
import { ACHIEVEMENTS } from './AchievementCatalog';
import { recordRunAndUnlock } from './AchievementService';
import { LocalPlayerProfileStore, PLAYER_PROFILE_STORAGE_KEY } from './LocalPlayerProfileStore';

function createStore(): LocalPlayerProfileStore {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  return new LocalPlayerProfileStore(storage);
}

function result(overrides: Partial<RunnerResult> = {}): RunnerResult {
  return {
    characterId: 'player-default', mode: 'endless', storyStageId: null, hitsTaken: 0,
    livesRemaining: 0, nearMissScore: 0, passedGateCount: 0, completedStage: false,
    distanceMeters: 0, coins: 0, durationMs: 1_000, finishedAtIso: new Date().toISOString(),
    finishReason: 'timeout', ...overrides,
  };
}

describe('achievement consolidation', () => {
  it('has one roster-distance milestone and one Story tour goal without repeated character cards', () => {
    const runnerAchievements = ACHIEVEMENTS.filter((achievement) => achievement.id.startsWith('runner-'));
    expect(runnerAchievements).toHaveLength(0);
    expect(ACHIEVEMENTS.map(({ id }) => id)).toContain('all-runners-1000');
    expect(ACHIEVEMENTS.map(({ id }) => id)).toContain('story-grand-tour');
    expect(ACHIEVEMENTS.some(({ id }) => id === 'story-no-hit')).toBe(false);
  });

  it('unlocks the roster goal only after all five characters each reach 1,000m', () => {
    const store = createStore();
    for (const [index, character] of CHARACTERS.entries()) {
      const update = recordRunAndUnlock(store, `runner-${index}`, result({
        characterId: character.id, distanceMeters: 1_000,
      }));
      expect(update.profile.achievementProgress['all-runners-distance']).toBe(index + 1);
      expect(update.newlyUnlockedAchievementIds.includes('all-runners-1000')).toBe(index === CHARACTERS.length - 1);
    }
    expect(store.load().walletCoins).toBe(50);
  });

  it('counts unique completed Story stages and grants its reward once', () => {
    const store = createStore();
    const stages = STORY_STAGES;
    for (const [index, stage] of stages.entries()) {
      const update = recordRunAndUnlock(store, `story-${index}`, result({
        mode: 'story', storyStageId: stage.id, completedStage: true, finishReason: 'stage-complete',
      }));
      expect(update.profile.achievementProgress['story-courses-cleared']).toBe(index + 1);
      expect(update.newlyUnlockedAchievementIds.includes('story-grand-tour')).toBe(index === stages.length - 1);
    }
    const replay = recordRunAndUnlock(store, 'story-replay', result({
      mode: 'story', storyStageId: stages[0].id, completedStage: true, finishReason: 'stage-complete',
    }));
    const failure = recordRunAndUnlock(store, 'story-failure', result({
      mode: 'story', storyStageId: stages[0].id, completedStage: false, finishReason: 'lives-exhausted',
    }));
    expect(replay.profile.achievementProgress['story-courses-cleared']).toBe(4);
    expect(failure.profile.achievementProgress['story-courses-cleared']).toBe(4);
    expect(replay.bonusCoins).toBe(0);
    expect(store.load().walletCoins).toBe(100);
  });

  it('keeps existing distance, coin, and gate milestones', () => {
    const store = createStore();
    const update = recordRunAndUnlock(store, 'retained-milestones', result({
      distanceMeters: 10_000, coins: 500, passedGateCount: 5,
    }));
    expect(update.newlyUnlockedAchievementIds).toEqual(expect.arrayContaining([
      'distance-2500', 'distance-5000', 'distance-10000', 'wallet-coins-100', 'wallet-coins-500', 'gates-5',
    ]));
  });

  it('does not lose existing stored profile data while updating progress', () => {
    const store = createStore();
    store.update((profile) => ({ ...profile, unlockedAchievementIds: ['legacy-runner-id'], walletCoins: 12 }));
    const update = recordRunAndUnlock(store, 'preserve-profile', result({ distanceMeters: 300 }));
    expect(update.profile.unlockedAchievementIds).toContain('legacy-runner-id');
    expect(update.profile.walletCoins).toBe(12);
    expect(PLAYER_PROFILE_STORAGE_KEY).toBe('running-action:profile:v1');
  });
});
