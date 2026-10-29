import { describe, expect, it } from 'vitest';
import { getCharacterPassive } from './characterAbilities';

describe('central character passive tuning', () => {
  it('assigns the agreed named passives and tunings', () => {
    expect(getCharacterPassive('player-default')).toMatchObject({
      id: 'rin-speed', speedBonusRatio: 0.05, name: '질주의 메이드', icon: 'cloud',
    });
    expect(getCharacterPassive('hanayo-hiyori')).toMatchObject({
      id: 'hiyori-guard', chargesPerRun: 2, name: '유령의 수호', icon: 'pink-flame',
    });
    expect(getCharacterPassive('tokino-mary')).toMatchObject({
      id: 'mary-pickup-magnet', radiusPx: 30, name: '별빛 자석', icon: 'sparkling-magnet',
    });
  });

  it('keeps Toa and Rang on default performance until their passives are designed', () => {
    expect(getCharacterPassive('goth-student').id).toBe('unassigned');
    expect(getCharacterPassive('cogane-rang').id).toBe('unassigned');
  });
});
