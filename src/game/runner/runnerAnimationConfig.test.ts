import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../characters/characterCatalog';
import { getRunnerAnimationPlayback } from './runnerAnimationConfig';

describe('runner animation playback settings', () => {
  it('uses each character\'s authored terminal FPS and keeps the final pose', () => {
    for (const character of CHARACTERS) {
      expect(getRunnerAnimationPlayback('victory', character)).toEqual({
        frameRate: character.qualityAnimationFps.victory, repeat: 0,
      });
      expect(getRunnerAnimationPlayback('gameOver', character)).toEqual({
        frameRate: character.qualityAnimationFps.gameOver, repeat: 0,
      });
    }
  });

  it('leaves gameplay animation timing unchanged', () => {
    const character = CHARACTERS[0];
    expect(getRunnerAnimationPlayback('run', character)).toEqual({ frameRate: 20, repeat: -1 });
    expect(getRunnerAnimationPlayback('jump-fall', character)).toEqual({ frameRate: 6, repeat: -1 });
    expect(getRunnerAnimationPlayback('slide', character)).toEqual({ frameRate: 18, repeat: 0 });
  });
});
