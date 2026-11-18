import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RUNNER_MUSIC } from './musicCatalog';

describe('runner music catalog', () => {
  it('maps the title and all course themes to local looping OGG assets', () => {
    expect(Object.keys(RUNNER_MUSIC).sort()).toEqual([
      'cloud-skyway', 'crystal-mine', 'dawn-city', 'moonlit-forest', 'starlight-rainbow', 'title',
    ]);
    for (const track of Object.values(RUNNER_MUSIC)) {
      expect(track.loop).toBe(true);
      expect(track.src.startsWith('/audio/music/')).toBe(true);
      const file = join(process.cwd(), 'public', track.src.slice(1));
      expect(existsSync(file)).toBe(true);
      expect(readFileSync(file).toString('ascii', 0, 4)).toBe('OggS');
    }
  });
});
