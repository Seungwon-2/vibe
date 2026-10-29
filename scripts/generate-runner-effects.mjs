import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { RUNNER_EFFECTS, validateEffect } from './audio/runnerEffectData.mjs';
import { encodePcmWav, renderEffectToPcm } from './audio/audioRenderer.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'public', 'audio', 'sfx');
const SAMPLE_RATE = 32000;
const CHECK = process.argv.includes('--check');

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function generateRunnerEffects({ check = CHECK } = {}) {
  const results = [];
  mkdirSync(OUTPUT, { recursive: true });
  for (const effect of Object.values(RUNNER_EFFECTS)) {
    validateEffect(effect);
    const path = join(OUTPUT, `${effect.id}.wav`);
    const rendered = encodePcmWav(renderEffectToPcm(effect, SAMPLE_RATE), SAMPLE_RATE);
    if (check) {
      let existing;
      try {
        existing = readFileSync(path);
      } catch {
        throw new Error(`Missing generated sound effect: ${path}`);
      }
      if (!existing.equals(rendered)) throw new Error(`Stale generated sound effect: ${path}`);
      results.push({ id: effect.id, milliseconds: effect.durationMs, sha256: hash(existing) });
    } else {
      writeFileSync(path, rendered);
      results.push({ id: effect.id, milliseconds: effect.durationMs, sha256: hash(rendered) });
    }
  }
  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    for (const result of generateRunnerEffects()) {
      console.log(`${CHECK ? 'verified' : 'generated'} ${result.id}: ${result.milliseconds}ms sha256=${result.sha256}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
