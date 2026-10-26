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
    expect(getCharacter('goth-student').displayName).toBe('Shizuki Toa');
    expect(() => getCharacter('moonwing' as never)).toThrow('Unknown character: moonwing');
    expect(() => getCharacter('unknown' as never)).toThrow('Unknown character: unknown');
  });

  it('keeps balanced passive tuning centralized and mapped to the intended character', () => {
    expect(CHARACTER_PASSIVES).toEqual({
      'time-pickup': { id: 'time-pickup', bonusMs: 1000 },
      'slide-release-grace': { id: 'slide-release-grace', graceMs: 150 },
      'rang-second-jump': { id: 'rang-second-jump', multiplier: 1.08 },
      'hiyori-pickup-magnet': { id: 'hiyori-pickup-magnet', radiusPx: 20 },
      'mary-hit-protection': { id: 'mary-hit-protection', bonusMs: 250 },
    });
    expect(CHARACTERS.map(({ id }) => getCharacterPassive(id).id)).toEqual([
      'time-pickup',
      'slide-release-grace',
      'rang-second-jump',
      'hiyori-pickup-magnet',
      'mary-hit-protection',
    ]);
    expect(Object.isFrozen(CHARACTER_PASSIVES)).toBe(true);
  });
});
