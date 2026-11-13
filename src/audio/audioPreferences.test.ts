import { describe, expect, it } from 'vitest';
import {
  AUDIO_PREFERENCES_STORAGE_KEY,
  AUDIO_MEDIA_GAIN_CEILING,
  DEFAULT_AUDIO_PREFERENCES,
  audioGainFromPreference,
  loadAudioPreferences,
  saveAudioPreferences,
} from './audioPreferences';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe('audio preferences', () => {
  it('starts with centered slider defaults and deliberately quiet output', () => {
    expect(DEFAULT_AUDIO_PREFERENCES).toEqual({ muted: false, musicVolume: 0.5, effectsVolume: 0.5 });
  });

  it('maps the slider to a capped, quiet media-gain range', () => {
    expect(audioGainFromPreference(0)).toBe(0);
    expect(audioGainFromPreference(0.1)).toBeCloseTo(0.002);
    expect(audioGainFromPreference(0.5)).toBeCloseTo(0.01);
    expect(audioGainFromPreference(1)).toBe(AUDIO_MEDIA_GAIN_CEILING);
    expect(audioGainFromPreference(Number.NaN)).toBe(0);
  });

  it('migrates old quadratic slider settings to preserve their output level', () => {
    const storage = memoryStorage({
      'runner-audio:preferences:v1': JSON.stringify({ muted: false, musicVolume: 0.1, effectsVolume: 0.1 }),
    });
    expect(loadAudioPreferences(storage)).toEqual({ muted: false, musicVolume: 0.5, effectsVolume: 0.5 });
  });

  it('uses the confirmed defaults when storage is empty or inaccessible', () => {
    expect(loadAudioPreferences(memoryStorage())).toEqual(DEFAULT_AUDIO_PREFERENCES);
    expect(loadAudioPreferences({ getItem: () => { throw new Error('denied'); } })).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it('loads valid preferences and clamps volume values', () => {
    const storage = memoryStorage({
      [AUDIO_PREFERENCES_STORAGE_KEY]: JSON.stringify({ muted: true, musicVolume: 1.4, effectsVolume: -0.2 }),
    });
    expect(loadAudioPreferences(storage)).toEqual({ muted: true, musicVolume: 1, effectsVolume: 0 });
  });

  it('falls back safely for malformed data and invalid fields', () => {
    expect(loadAudioPreferences(memoryStorage({ [AUDIO_PREFERENCES_STORAGE_KEY]: '{' }))).toEqual(DEFAULT_AUDIO_PREFERENCES);
    const storage = memoryStorage({
      [AUDIO_PREFERENCES_STORAGE_KEY]: JSON.stringify({ muted: 'yes', musicVolume: null, effectsVolume: 0.35 }),
    });
    expect(loadAudioPreferences(storage)).toEqual({ muted: false, musicVolume: 0.5, effectsVolume: 0.35 });
  });

  it('persists clamped values under the versioned key', () => {
    const storage = memoryStorage();
    saveAudioPreferences({ muted: false, musicVolume: 5, effectsVolume: 0.45 }, storage);
    expect(loadAudioPreferences(storage)).toEqual({ muted: false, musicVolume: 1, effectsVolume: 0.45 });
  });
});
