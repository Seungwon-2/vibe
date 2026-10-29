import { describe, expect, it } from 'vitest';
import { CHARACTERS, getCharacter, resolveCharacterId } from './characterCatalog';
import { CHARACTER_PASSIVES, getCharacterPassive } from './characterAbilities';
import type { CharacterAnimationName } from './characterTypes';

const REQUIRED_ANIMATIONS: readonly CharacterAnimationName[] = [
  'idle',
  'run',
  'jump',
  'doubleJump',
  'slide',
  'hurt',
  'start',
  'victory',
  'gameOver',
];

describe('runner character registry', () => {
  it('loads the five active characters with their names, colors, and assets', () => {
    expect(CHARACTERS.map(({ id, displayName, accentColor }) => [id, displayName, accentColor])).toEqual([
      ['player-default', 'Aokumo Rin', '#2b66c0'],
      ['goth-student', 'Shizuki Toa', '#513661'],
      ['cogane-rang', 'Cogane Rang', '#c98743'],
      ['hanayo-hiyori', 'Hanayo Hiyori', '#fca6d0'],
      ['tokino-mary', 'Tokino Mary', '#6d929a'],
    ]);

    for (const character of CHARACTERS) {
      expect(character.portraitUrl).toMatch(/\.png/);
      expect(character.atlasUrl).toMatch(/\.png/);
      expect(character.atlasManifest.meta.size).toEqual({ w: 1152, h: 480 });
      expect(Object.keys(character.atlasManifest.frames)).toHaveLength(60);
    }
    expect(CHARACTERS.filter(({ available }) => available).map(({ id }) => id)).toEqual([
      'player-default', 'goth-student', 'cogane-rang', 'hanayo-hiyori', 'tokino-mary',
    ]);
  });

  it('resolves every required animation to existing 96 by 96 atlas frames', () => {
    for (const character of CHARACTERS) {
      expect(character.frameWidth).toBe(96);
      expect(character.frameHeight).toBe(96);
      expect(character.animations.run).toHaveLength(12);
      expect(Object.keys(character.animations)).toEqual(REQUIRED_ANIMATIONS);

      for (const animation of REQUIRED_ANIMATIONS) {
        const frames = character.animations[animation];
        expect(frames.length, `${character.id} ${animation}`).toBe(animation === 'run' ? 12 : 6);
        for (const frameName of frames) {
          expect(character.atlasManifest.frames[frameName]).toBeDefined();
          expect(character.atlasManifest.frames[frameName].frame).toMatchObject({ w: 96, h: 96 });
        }
      }
    }
  });

  it('falls back to Rin for unknown saved character IDs and throws for invalid direct lookup', () => {
    expect(resolveCharacterId('moonwing')).toBe('player-default');
    expect(resolveCharacterId('akane-lize')).toBe('player-default');
    expect(resolveCharacterId('unknown')).toBe('player-default');
    expect(resolveCharacterId(null)).toBe('player-default');
    expect(resolveCharacterId('goth-student')).toBe('goth-student');
    expect(resolveCharacterId('cogane-rang')).toBe('cogane-rang');
    expect(getCharacter('goth-student').displayName).toBe('Shizuki Toa');
    expect(() => getCharacter('moonwing' as never)).toThrow('Unknown character: moonwing');
    expect(() => getCharacter('unknown' as never)).toThrow('Unknown character: unknown');
  });

  it('keeps balanced passive tuning centralized and mapped to the intended character', () => {
    expect(CHARACTER_PASSIVES).toEqual({
      'rin-speed': { id: 'rin-speed', speedBonusRatio: 0.05, name: '질주의 메이드', icon: 'cloud', effectLabel: '최고 속도 +5%' },
      'hiyori-guard': { id: 'hiyori-guard', chargesPerRun: 2, name: '유령의 수호', icon: 'pink-flame', effectLabel: '충돌·낭떠러지 방어 2회' },
      'mary-pickup-magnet': { id: 'mary-pickup-magnet', radiusPx: 30, name: '별빛 자석', icon: 'sparkling-magnet', effectLabel: '수집 반경 +30px' },
      unassigned: { id: 'unassigned', name: '고유 능력 없음', icon: null, effectLabel: '기본 성능으로 플레이합니다' },
    });
    expect(CHARACTERS.map(({ id }) => getCharacterPassive(id).id)).toEqual([
      'rin-speed',
      'unassigned',
      'unassigned',
      'hiyori-guard',
      'mary-pickup-magnet',
    ]);
    expect(Object.isFrozen(CHARACTER_PASSIVES)).toBe(true);
  });
});
