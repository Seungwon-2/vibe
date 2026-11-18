import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StoryResult } from './StoryResult';
import { getAchievementDisplayName } from '../../services/AchievementCatalog';
import { STORY_STAGES } from '../../game/runner/storyConfig';
import { LocalPlayerProfileStore } from '../../services/LocalPlayerProfileStore';
import { settleRun } from '../../services/PlayerProgression';
import type { RunnerResult } from '../../game/runner/runnerTypes';

afterEach(cleanup);

describe('StoryResult', () => {
  it.each(STORY_STAGES)('shows localized challenge rewards on $name clear, including recovered settlements', (stage) => {
    const result: RunnerResult = { characterId: 'player-default', mode: 'story', storyStageId: stage.id,
      distanceMeters: stage.lengthMeters, coins: stage.coinTarget + 4, hitsTaken: 0, livesRemaining: 3,
      durationMs: 30_000, finishedAtIso: '2026-11-16T07:00:00.000Z', finishReason: 'stage-complete', completedStage: true };
    const settlement = settleRun(new LocalPlayerProfileStore(null), 'story-reward-test', result);
    render(<StoryResult result={result} settlement={{ ...settlement, newlyClaimedCosmeticIds: [
      ...settlement.newlyClaimedCosmeticIds, stage.challengeRewardCosmeticIds.noHit, 'removed-internal-reward',
    ] }} newlyUnlockedAchievementIds={[]} achievementBonusCoins={0}
      onRetry={vi.fn()} onNextStage={vi.fn()} onStageSelect={vi.fn()} />);
    expect(screen.getByTestId('result-character-portrait')).toHaveAttribute('src',
      '/assets/character/selector-art/roster/player-default-full.webp');
    expect(screen.getByTestId('character-preview-player-default')).toHaveAttribute('data-animation', 'victory');
    expect(screen.getAllByText(`꾸미기 보상 해금 · ${stage.name} 무피격 궤적`)).toHaveLength(1);
    expect(screen.getByText(`꾸미기 보상 해금 · ${stage.name} 코인 배지`)).toBeInTheDocument();
    expect(screen.getByText('꾸미기 보상 해금 · 알 수 없는 꾸미기')).toBeInTheDocument();
    for (const id of [...settlement.newlyClaimedCosmeticIds, 'removed-internal-reward']) {
      expect(document.body.textContent).not.toContain(id);
    }
  });

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
