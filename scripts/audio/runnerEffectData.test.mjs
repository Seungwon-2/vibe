import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RUNNER_EFFECTS, validateEffect } from './runnerEffectData.mjs';
import { encodePcmWav, renderEffectToPcm } from './audioRenderer.mjs';

const PUBLIC_ROOT = new URL('../../public/audio/sfx/', import.meta.url);

test('defines exactly ten deterministic, short sound effects', () => {
  assert.deepEqual(Object.keys(RUNNER_EFFECTS).sort(), [
    'coin', 'double-jump', 'fall', 'gate', 'hit', 'hiyori-defense', 'jump', 'slide', 'time-pickup', 'ui-click',
  ]);
  for (const effect of Object.values(RUNNER_EFFECTS)) {
    validateEffect(effect);
    assert.ok(effect.durationMs >= 80);
    assert.ok(effect.durationMs <= (effect.id === 'gate' ? 2200 : 1400));
  }
});

test('generated WAVs have valid PCM16 headers, stay in range, and match deterministic render output', () => {
  for (const effect of Object.values(RUNNER_EFFECTS)) {
    const rendered = encodePcmWav(renderEffectToPcm(effect), 32000);
    const existing = readFileSync(new URL(`${effect.id}.wav`, PUBLIC_ROOT));
    assert.deepEqual(existing, rendered, `${effect.id} bytes should match fresh render`);
    assert.equal(existing.toString('ascii', 0, 4), 'RIFF');
    assert.equal(existing.toString('ascii', 8, 12), 'WAVE');
    assert.equal(existing.readUInt32LE(24), 32000);
    assert.equal(existing.readUInt16LE(22), 1);
    assert.equal(existing.readUInt16LE(34), 16);
    assert.equal(existing.readUInt32LE(40), existing.length - 44);
    assert.ok(existing.length > 44);
    assert.ok(effect.durationMs <= (existing.length - 44) / 64 + 1);
  }
});

test('effect noise and note synthesis repeat identically for the same seed', () => {
  const effect = RUNNER_EFFECTS.slide;
  const first = encodePcmWav(renderEffectToPcm(effect, 8000), 8000);
  const second = encodePcmWav(renderEffectToPcm(effect, 8000), 8000);
  assert.deepEqual(first, second);
});
