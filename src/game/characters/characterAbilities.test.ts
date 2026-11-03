import { describe, expect, it } from 'vitest';
import { getCharacterPassive } from './characterAbilities';

describe('central character passive tuning', () => {
  it('assigns the agreed named passives and tunings', () => {
    expect(getCharacterPassive('player-default')).toMatchObject({
      id: 'rin-speed', speedBonusRatio: 0.05, name: '질주의 메이드', icon: 'rin-cloud-tailwind',
    });
    expect(getCharacterPassive('hanayo-hiyori')).toMatchObject({
      id: 'hiyori-guard', chargesPerRun: 2, name: '벚꽃 수호', icon: 'hiyori-blossom-ward',
    });
    expect(getCharacterPassive('tokino-mary')).toMatchObject({
      id: 'mary-pickup-magnet', magnetRadiusPx: 150, magnetPullDurationMs: 300,
      name: '음표의 이끌림', icon: 'mary-music-magnet',
      effectLabel: '코인·시간 아이템 150px 자석 흡인',
    });
    expect(getCharacterPassive('goth-student')).toMatchObject({ id: 'toa-ghost-glide', slideGuardMs: 250, cooldownMs: 20_000 });
    expect(getCharacterPassive('cogane-rang')).toMatchObject({ id: 'rang-double-jump', doubleJumpVelocityMultiplier: 1.058 });
  });
});
