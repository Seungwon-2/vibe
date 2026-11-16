import { describe, expect, it } from 'vitest';
import { STORY_STAGES } from '../game/runner/storyConfig';
import { COSMETICS, getCosmetic, getCosmeticDisplayName } from './CosmeticCatalog';

describe('cosmetic display names', () => {
  it.each(STORY_STAGES)('localizes both challenge rewards for $name without changing their ids', (stage) => {
    expect(getCosmetic(stage.challengeRewardCosmeticIds.noHit)?.name).toBe(`${stage.name} 무피격 궤적`);
    expect(getCosmetic(stage.challengeRewardCosmeticIds.coinTarget)?.name).toBe(`${stage.name} 코인 배지`);
  });

  it.each(COSMETICS)('resolves the catalog display name for $id', (cosmetic) => {
    expect(getCosmeticDisplayName(cosmetic.id)).toBe(cosmetic.name);
  });

  it('does not reveal an unknown identifier in the display fallback', () => {
    expect(getCosmeticDisplayName('removed-internal-reward')).toBe('알 수 없는 꾸미기');
  });
});
