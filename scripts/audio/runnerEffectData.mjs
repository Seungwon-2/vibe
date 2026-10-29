/** @typedef {{ startBeat: number; durationBeats: number; midiNote: number; velocity: number }} NoteEvent */
/** @typedef {{ id: string; durationMs: number; notes: readonly NoteEvent[]; noiseMix: number; seed: number }} EffectDefinition */

/**
 * Notes use a quarter-second beat so tiny effect phrases remain easy to tune.
 * Everything is generated from these fixed values; no external samples are used.
 * @type {Readonly<Record<string, EffectDefinition>>}
 */
export const RUNNER_EFFECTS = Object.freeze({
  jump: {
    id: 'jump', durationMs: 260, noiseMix: 0.015, seed: 101,
    notes: [
      { startBeat: 0, durationBeats: 0.62, midiNote: 76, velocity: 0.74 },
      { startBeat: 0.28, durationBeats: 0.58, midiNote: 83, velocity: 0.66 },
    ],
  },
  'double-jump': {
    id: 'double-jump', durationMs: 420, noiseMix: 0.01, seed: 211,
    notes: [
      { startBeat: 0, durationBeats: 0.48, midiNote: 79, velocity: 0.58 },
      { startBeat: 0.24, durationBeats: 0.58, midiNote: 84, velocity: 0.68 },
      { startBeat: 0.52, durationBeats: 0.86, midiNote: 91, velocity: 0.76 },
    ],
  },
  slide: {
    id: 'slide', durationMs: 340, noiseMix: 0.1, seed: 307,
    notes: [
      { startBeat: 0.02, durationBeats: 0.45, midiNote: 79, velocity: 0.35 },
      { startBeat: 0.2, durationBeats: 0.58, midiNote: 74, velocity: 0.24 },
    ],
  },
  coin: {
    id: 'coin', durationMs: 210, noiseMix: 0, seed: 401,
    notes: [
      { startBeat: 0, durationBeats: 0.58, midiNote: 88, velocity: 0.62 },
      { startBeat: 0.12, durationBeats: 0.54, midiNote: 95, velocity: 0.56 },
    ],
  },
  'time-pickup': {
    id: 'time-pickup', durationMs: 560, noiseMix: 0, seed: 503,
    notes: [
      { startBeat: 0, durationBeats: 0.72, midiNote: 79, velocity: 0.58 },
      { startBeat: 0.34, durationBeats: 0.72, midiNote: 84, velocity: 0.62 },
      { startBeat: 0.68, durationBeats: 1.18, midiNote: 91, velocity: 0.7 },
    ],
  },
  gate: {
    id: 'gate', durationMs: 1450, noiseMix: 0.025, seed: 601,
    notes: [
      { startBeat: 0, durationBeats: 1.1, midiNote: 72, velocity: 0.48 },
      { startBeat: 0, durationBeats: 1.1, midiNote: 79, velocity: 0.44 },
      { startBeat: 0.72, durationBeats: 0.88, midiNote: 84, velocity: 0.54 },
      { startBeat: 1.4, durationBeats: 1.7, midiNote: 88, velocity: 0.64 },
    ],
  },
  hit: {
    id: 'hit', durationMs: 300, noiseMix: 0.025, seed: 701,
    notes: [
      { startBeat: 0, durationBeats: 0.42, midiNote: 74, velocity: 0.34 },
      { startBeat: 0.18, durationBeats: 0.55, midiNote: 69, velocity: 0.25 },
    ],
  },
  fall: {
    id: 'fall', durationMs: 520, noiseMix: 0.015, seed: 809,
    notes: [
      { startBeat: 0, durationBeats: 0.72, midiNote: 84, velocity: 0.3 },
      { startBeat: 0.36, durationBeats: 0.78, midiNote: 79, velocity: 0.25 },
      { startBeat: 0.72, durationBeats: 0.84, midiNote: 74, velocity: 0.2 },
    ],
  },
  'hiyori-defense': {
    id: 'hiyori-defense', durationMs: 720, noiseMix: 0.04, seed: 907,
    notes: [
      { startBeat: 0, durationBeats: 0.78, midiNote: 72, velocity: 0.4 },
      { startBeat: 0.18, durationBeats: 0.88, midiNote: 79, velocity: 0.42 },
      { startBeat: 0.44, durationBeats: 1.35, midiNote: 84, velocity: 0.48 },
    ],
  },
  'ui-click': {
    id: 'ui-click', durationMs: 110, noiseMix: 0, seed: 1009,
    notes: [{ startBeat: 0, durationBeats: 0.34, midiNote: 84, velocity: 0.3 }],
  },
});

export function validateEffect(effect) {
  const maximumDuration = effect?.id === 'gate' ? 2200 : 1400;
  if (!effect || typeof effect.id !== 'string' || !Number.isFinite(effect.durationMs) || effect.durationMs < 80 || effect.durationMs > maximumDuration) {
    throw new TypeError('Effect duration must be between 80ms and 1400ms (2200ms for gate).');
  }
  if (!Array.isArray(effect.notes) || !Number.isFinite(effect.noiseMix) || effect.noiseMix < 0 || effect.noiseMix > 1 || !Number.isInteger(effect.seed)) {
    throw new TypeError('Effect notes, noise mix, and seed must be valid.');
  }
  for (const note of effect.notes) {
    if (!Number.isFinite(note.startBeat) || note.startBeat < 0 || !Number.isFinite(note.durationBeats) || note.durationBeats <= 0) throw new RangeError('Effect note timing must be positive.');
    if (!Number.isInteger(note.midiNote) || note.midiNote < 0 || note.midiNote > 127) throw new RangeError('Effect MIDI pitch must be between 0 and 127.');
    if (!Number.isFinite(note.velocity) || note.velocity < 0 || note.velocity > 1) throw new RangeError('Effect velocity must be between 0 and 1.');
  }
}
