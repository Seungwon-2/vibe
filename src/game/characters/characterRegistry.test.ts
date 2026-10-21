import { describe, expect, it } from 'vitest';
import { getCharacterDefinition, registerCharacter } from './characterRegistry';
import { defaultCharacter } from './defaultCharacter';

describe('playable character registry', () => {
  it('registers the protagonist with all required animations', () => {
    expect(getCharacterDefinition(defaultCharacter.id).animations).toEqual(defaultCharacter.animations);
    expect(Object.values(defaultCharacter.animations).every((frames) => frames.length > 0)).toBe(true);
  });

  it('allows a second playable character without changing actor or scene code', () => {
    const fixture = {
      ...defaultCharacter,
      id: 'fixture-character',
      displayName: 'Registry Fixture',
    };

    registerCharacter(fixture);

    expect(getCharacterDefinition(fixture.id).displayName).toBe('Registry Fixture');
  });

  it('rejects duplicate ids, missing animations, and unknown characters', () => {
    expect(() => registerCharacter(defaultCharacter)).toThrow(/already registered/);
    expect(() => registerCharacter({
      ...defaultCharacter,
      id: 'broken-character',
      animations: { ...defaultCharacter.animations, run: [] },
    })).toThrow(/missing frames for "run"/);
    expect(() => getCharacterDefinition('missing-character')).toThrow(/Unknown playable character/);
  });
});
