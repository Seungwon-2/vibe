import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RUNNER_AUDIO_EFFECTS } from './audioCatalog';

const PUBLIC_ROOT = join(process.cwd(), 'public');

describe('runner audio effects catalog', () => {
  it('defines local sound effects with supplied provenance metadata', () => {
    expect(Object.keys(RUNNER_AUDIO_EFFECTS).sort()).toEqual([
      'coin', 'double-jump', 'fall', 'game-over', 'gate', 'hit', 'hiyori-defense', 'jump', 'slide', 'time-pickup', 'ui-click', 'victory',
    ]);

    for (const [id, asset] of Object.entries(RUNNER_AUDIO_EFFECTS)) {
      expect(asset.src.startsWith('/audio/sfx/')).toBe(true);
      expect(asset.src.startsWith('http')).toBe(false);
      expect(existsSync(join(PUBLIC_ROOT, asset.src.slice(1)))).toBe(true);
      expect(asset.credit).toMatchObject({ id, sourceUrl: null, licenseUrl: null });
      if (asset.src.endsWith('.ogg')) {
        expect(asset.credit).toMatchObject({
          creator: 'User supplied', licenseName: 'README claims original audio; sharing terms unverified', generationScript: null,
        });
      } else {
        expect(asset.credit).toMatchObject({
          creator: 'Project02', licenseName: 'Original project-generated audio', generationScript: 'scripts/generate-runner-effects.mjs',
        });
      }
      expect(asset.credit.title.length).toBeGreaterThan(0);
    }
  });

  it('ships catalog files as OGG Vorbis or valid 32 kHz mono PCM16 WAV', () => {
    for (const asset of Object.values(RUNNER_AUDIO_EFFECTS)) {
      const path = join(PUBLIC_ROOT, asset.src.slice(1));
      const data = readFileSync(path);
      if (asset.src.endsWith('.ogg')) {
        expect(data.toString('ascii', 0, 4)).toBe('OggS');
      } else {
        expect(data.toString('ascii', 0, 4)).toBe('RIFF');
        expect(data.toString('ascii', 8, 12)).toBe('WAVE');
        expect(data.readUInt16LE(20)).toBe(1);
        expect(data.readUInt16LE(22)).toBe(1);
        expect(data.readUInt32LE(24)).toBe(32000);
        expect(data.readUInt16LE(34)).toBe(16);
        expect(data.readUInt32LE(40)).toBe(data.length - 44);
      }
    }
  });
});
