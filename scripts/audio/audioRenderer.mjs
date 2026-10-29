import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

function validateTrack(track) {
  if (!track || !Number.isFinite(track.bpm) || track.bpm <= 0 || track.beatsPerBar !== 4 || !Number.isInteger(track.bars) || track.bars <= 0) {
    throw new TypeError('Track timing must use a positive BPM, four beats per bar, and a positive integer bar count.');
  }
  for (const lane of ['melody', 'accompaniment', 'bass']) {
    if (!Array.isArray(track[lane])) throw new TypeError(`${lane} must be an array of note events.`);
    for (const note of track[lane]) {
      if (!Number.isFinite(note.startBeat) || note.startBeat < 0 || note.startBeat >= track.bars * track.beatsPerBar) throw new RangeError(`${lane} note start is outside the loop.`);
      if (!Number.isFinite(note.durationBeats) || note.durationBeats <= 0) throw new RangeError(`${lane} note duration must be positive.`);
      if (!Number.isInteger(note.midiNote) || note.midiNote < 0 || note.midiNote > 127) throw new RangeError(`${lane} MIDI pitch must be between 0 and 127.`);
      if (!Number.isFinite(note.velocity) || note.velocity < 0 || note.velocity > 1) throw new RangeError(`${lane} velocity must be between 0 and 1.`);
    }
  }
}

const TAU = Math.PI * 2;
const PARTIALS = [1, 2.003, 3.009, 4.021];
const PARTIAL_GAINS = [1, 0.34, 0.15, 0.065];

function midiFrequency(note) {
  return 440 * (2 ** ((note - 69) / 12));
}

function addNote(samples, event, track, sampleRate, gain) {
  const start = Math.round((event.startBeat * 60 / track.bpm) * sampleRate);
  const duration = event.durationBeats * 60 / track.bpm;
  const length = Math.min(samples.length - start, Math.ceil(duration * sampleRate));
  if (length <= 0) return;

  const frequency = midiFrequency(event.midiNote);
  const velocity = event.velocity;
  const attackSeconds = 0.008 + (1 - velocity) * 0.018;
  const releaseSeconds = Math.min(0.12, duration * 0.28);
  const phases = PARTIALS.map(() => 0);

  for (let i = 0; i < length; i += 1) {
    const time = i / sampleRate;
    const remaining = duration - time;
    const attack = Math.min(1, time / attackSeconds);
    const release = remaining < releaseSeconds ? Math.max(0, remaining / releaseSeconds) : 1;
    const hammer = 1 + 0.12 * Math.exp(-time * 95);
    let voice = 0;
    for (let p = 0; p < PARTIALS.length; p += 1) {
      const partialDecay = Math.exp(-time * (0.75 + p * 0.95));
      voice += Math.sin(phases[p]) * PARTIAL_GAINS[p] * partialDecay;
      phases[p] += TAU * frequency * PARTIALS[p] / sampleRate;
    }
    samples[start + i] += voice * attack * release * hammer * velocity * gain;
  }
}

export function renderTrackToPcm(track, sampleRate = 32000) {
  validateTrack(track);
  if (!Number.isInteger(sampleRate) || sampleRate < 8000) throw new RangeError('Sample rate must be an integer of at least 8000 Hz.');
  const durationSeconds = track.bars * track.beatsPerBar * 60 / track.bpm;
  const samples = new Float32Array(Math.ceil(durationSeconds * sampleRate));

  for (const event of track.bass) addNote(samples, event, track, sampleRate, 0.18);
  for (const event of track.accompaniment) addNote(samples, event, track, sampleRate, 0.23);
  for (const event of track.melody) addNote(samples, event, track, sampleRate, 0.36);

  const fadeSamples = Math.min(Math.floor(sampleRate * 0.16), Math.floor(samples.length / 8));
  const seamValue = (samples[0] + samples[samples.length - 1]) / 2;
  for (let i = 0; i < fadeSamples; i += 1) {
    const progress = fadeSamples <= 1 ? 1 : i / (fadeSamples - 1);
    const blend = progress * progress * (3 - 2 * progress);
    const startIndex = i;
    const endIndex = samples.length - fadeSamples + i;
    samples[startIndex] = seamValue * (1 - blend) + samples[startIndex] * blend;
    samples[endIndex] = seamValue * (1 - blend) + samples[endIndex] * blend;
  }

  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const scale = peak > 0.84 ? 0.84 / peak : 1;
  if (scale !== 1) for (let i = 0; i < samples.length; i += 1) samples[i] *= scale;
  return samples;
}

export function renderEffectToPcm(effect, sampleRate = 32000) {
  if (!effect || typeof effect.id !== 'string' || !Number.isFinite(effect.durationMs) || effect.durationMs < 80 || effect.durationMs > (effect.id === 'gate' ? 2200 : 1400)) {
    throw new TypeError('Effect must have an id and a supported duration.');
  }
  if (!Array.isArray(effect.notes) || !Number.isFinite(effect.noiseMix) || effect.noiseMix < 0 || effect.noiseMix > 1 || !Number.isInteger(effect.seed)) {
    throw new TypeError('Effect notes, noise mix, or seed are invalid.');
  }
  if (!Number.isInteger(sampleRate) || sampleRate < 8000) throw new RangeError('Sample rate must be an integer of at least 8000 Hz.');

  const samples = new Float32Array(Math.ceil(effect.durationMs * sampleRate / 1000));
  const timing = { bpm: 240, beatsPerBar: 4, bars: Math.ceil(effect.durationMs / 1000) };
  for (const note of effect.notes) {
    if (!Number.isFinite(note.startBeat) || note.startBeat < 0 || !Number.isFinite(note.durationBeats) || note.durationBeats <= 0 || !Number.isInteger(note.midiNote) || note.midiNote < 0 || note.midiNote > 127 || !Number.isFinite(note.velocity) || note.velocity < 0 || note.velocity > 1) {
      throw new RangeError(`Effect ${effect.id} contains an invalid note.`);
    }
    addNote(samples, note, timing, sampleRate, 0.55);
  }

  let state = effect.seed >>> 0;
  if (state === 0) state = 0x6d2b79f5;
  for (let i = 0; i < samples.length; i += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const noise = ((state >>> 0) / 0xffffffff) * 2 - 1;
    const progress = i / Math.max(1, samples.length - 1);
    const envelope = Math.sin(Math.PI * Math.min(1, Math.max(0, progress))) ** 0.7;
    samples[i] += noise * effect.noiseMix * envelope * 0.16;
  }

  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak > 0.88) {
    const scale = 0.88 / peak;
    for (let i = 0; i < samples.length; i += 1) samples[i] *= scale;
  }
  return samples;
}

export function encodePcmWav(samples, sampleRate) {
  if (!(samples instanceof Float32Array)) throw new TypeError('Samples must be a Float32Array.');
  if (!Number.isInteger(sampleRate) || sampleRate <= 0) throw new RangeError('Sample rate must be a positive integer.');
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(sample < 0 ? sample * 32768 : sample * 32767), 44 + i * 2);
  }
  return buffer;
}

export function writeWavFile(filePath, samples, sampleRate) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, encodePcmWav(samples, sampleRate));
}
