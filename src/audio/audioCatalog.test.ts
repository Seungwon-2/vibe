import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RUNNER_AUDIO_EFFECTS } from './audioCatalog';

const PUBLIC_ROOT = join(process.cwd(), 'public');

describe('runner audio effects catalog', () => {
  it('defines ten local SFX with provenance metadata', () => {
    expect(Object.keys(RUNNER_AUDIO_EFFECTS).sort()).toEqual([
      'coin', 'double-jump', 'fall', 'gate', 'hit', 'hiyori-defense', 'jump', 'slide', 'time-pickup', 'ui-click',
    ]);

    for (const [id, asset] of Object.entries(RUNNER_AUDIO_EFFECTS)) {
      expect(asset.src.startsWith('/audio/sfx/')).toBe(true);
      expect(asset.src.startsWith('http')).toBe(false);
      expect(existsSync(join(PUBLIC_ROOT, asset.src.slice(1)))).toBe(true);
      expect(asset.credit).toMatchObject({
        id,
        creator: 'Project02',
        sourceUrl: null,
        licenseName: 'Original project-generated audio',
        licenseUrl: null,
        generationScript: 'scripts/generate-runner-effects.mjs',
      });
      expect(asset.credit.title.length).toBeGreaterThan(0);
    }
  });

  it('ships each catalog file as a valid 32 kHz mono PCM16 WAV', () => {
    for (const asset of Object.values(RUNNER_AUDIO_EFFECTS)) {
      const path = join(PUBLIC_ROOT, asset.src.slice(1));
      const wav = readFileSync(path);
      expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
      expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
      expect(wav.readUInt16LE(20)).toBe(1);
      expect(wav.readUInt16LE(22)).toBe(1);
      expect(wav.readUInt32LE(24)).toBe(32000);
      expect(wav.readUInt16LE(34)).toBe(16);
      expect(wav.readUInt32LE(40)).toBe(wav.length - 44);
    }
  });
});
