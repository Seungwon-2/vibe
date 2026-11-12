import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StoryResult } from './StoryResult';
import { getAchievementDisplayName } from '../../services/AchievementCatalog';

afterEach(cleanup);

describe('StoryResult', () => {
  it('uses safe localized achievement labels and deduplicates newly unlocked ids', () => {
    render(<StoryResult
      result={{ characterId: 'player-default', mode: 'story', storyStageId: 'dawn-city', distanceMeters: 2500,
        coins: 20, durationMs: 30_000, finishedAtIso: '2026-11-12T00:00:00.000Z', finishReason: 'stage-complete', completedStage: true }}
      settlement={{ depositedCoins: 20, newlyUnlockedStageId: null, newlyUnlockedCharacterId: null,
        newlyClaimedCosmeticIds: [], challenges: [], profile: {
          version: 1, walletCoins: 20, unlockedCharacterIds: [], unlockedStageIds: [], clearedStageIds: [],
          completedChallengeKeys: [], achievementProgress: {}, unlockedAchievementIds: [], unlockedCosmeticIds: [],
          equippedCosmeticIdsByCharacter: {}, processedRunIds: [], claimedRewardKeys: [],
        } }}
      newlyUnlockedAchievementIds={['story-grand-tour', 'story-grand-tour', 'unexpected-id']}
      achievementBonusCoins={0} onRetry={vi.fn()} onNextStage={vi.fn()} onStageSelect={vi.fn()} />);

    expect(screen.getByText(`업적 달성 · ${getAchievementDisplayName('story-grand-tour')}`)).toBeInTheDocument();
    expect(screen.getByText('업적 달성 · 알 수 없는 업적')).toBeInTheDocument();
    expect(screen.queryByText(/unexpected-id/)).not.toBeInTheDocument();
    expect(screen.getAllByText(`업적 달성 · ${getAchievementDisplayName('story-grand-tour')}`)).toHaveLength(1);
  });
});
