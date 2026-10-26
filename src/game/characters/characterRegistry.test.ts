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
  it('loads the four stable characters with their names, colors, and assets', () => {
    expect(CHARACTERS.map(({ id, displayName, accentColor }) => [id, displayName, accentColor])).toEqual([
      ['player-default', 'Aokumo Rin', '#2b66c0'],
      ['goth-student', 'Shizuki Toa', '#513661'],
      ['moonwing', 'Ayatsuno Yuni', '#857fd8'],
      ['akane-lize', 'Akane Lize', '#971b2f'],
    ]);

    for (const character of CHARACTERS) {
      expect(character.portraitUrl).toMatch(/\.png/);
      expect(character.atlasUrl).toMatch(/\.png/);
      expect(character.atlasManifest.meta.size).toEqual({ w: 768, h: 384 });
    }
  });

  it('resolves every required animation to existing 96 by 96 atlas frames', () => {
    for (const character of CHARACTERS) {
      expect(character.frameWidth).toBe(96);
      expect(character.frameHeight).toBe(96);
      expect(character.animations.run).toHaveLength(8);
      expect(Object.keys(character.animations)).toEqual(REQUIRED_ANIMATIONS);

      for (const animation of REQUIRED_ANIMATIONS) {
        const frames = character.animations[animation];
        expect(frames.length, `${character.id} ${animation}`).toBeGreaterThan(0);
        for (const frameName of frames) {
          expect(character.atlasManifest.frames[frameName]).toBeDefined();
          expect(character.atlasManifest.frames[frameName].frame).toMatchObject({ w: 96, h: 96 });
        }
      }
    }
  });

  it('falls back to Rin for unknown saved character IDs and throws for invalid direct lookup', () => {
    expect(resolveCharacterId('moonwing')).toBe('moonwing');
    expect(resolveCharacterId('unknown')).toBe('player-default');
    expect(resolveCharacterId(null)).toBe('player-default');
    expect(getCharacter('goth-student').displayName).toBe('Shizuki Toa');
    expect(() => getCharacter('unknown' as never)).toThrow('Unknown character: unknown');
  });

  it('keeps balanced passive tuning centralized and mapped to the intended character', () => {
    expect(CHARACTER_PASSIVES).toEqual({
      'time-pickup': { id: 'time-pickup', bonusMs: 1000 },
      'slide-release-grace': { id: 'slide-release-grace', graceMs: 150 },
      'double-jump-impulse': { id: 'double-jump-impulse', multiplier: 1.12 },
      'collision-penalty-reduction': { id: 'collision-penalty-reduction', reductionMs: 1000 },
    });
    expect(CHARACTERS.map(({ id }) => getCharacterPassive(id).id)).toEqual([
      'time-pickup',
      'slide-release-grace',
      'double-jump-impulse',
      'collision-penalty-reduction',
    ]);
    expect(Object.isFrozen(CHARACTER_PASSIVES)).toBe(true);
  });
});
