export type AudioPreferences = {
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
};

export const DEFAULT_AUDIO_PREFERENCES: Readonly<AudioPreferences> = Object.freeze({
  muted: false,
  musicVolume: 0.6,
  effectsVolume: 0.8,
});

export const AUDIO_PREFERENCES_STORAGE_KEY = 'runner-audio:preferences:v1';

function clampVolume(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

export function loadAudioPreferences(storage: Pick<Storage, 'getItem'>): AudioPreferences {
  try {
    const value = storage.getItem(AUDIO_PREFERENCES_STORAGE_KEY);
    if (value === null) return { ...DEFAULT_AUDIO_PREFERENCES };
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { ...DEFAULT_AUDIO_PREFERENCES };
    const candidate = parsed as Partial<Record<keyof AudioPreferences, unknown>>;
    return {
      muted: typeof candidate.muted === 'boolean' ? candidate.muted : DEFAULT_AUDIO_PREFERENCES.muted,
      musicVolume: clampVolume(candidate.musicVolume, DEFAULT_AUDIO_PREFERENCES.musicVolume),
      effectsVolume: clampVolume(candidate.effectsVolume, DEFAULT_AUDIO_PREFERENCES.effectsVolume),
    };
  } catch {
    return { ...DEFAULT_AUDIO_PREFERENCES };
  }
}

export function saveAudioPreferences(preferences: AudioPreferences, storage: Pick<Storage, 'setItem'>): void {
  const value: AudioPreferences = {
    muted: typeof preferences.muted === 'boolean' ? preferences.muted : DEFAULT_AUDIO_PREFERENCES.muted,
    musicVolume: clampVolume(preferences.musicVolume, DEFAULT_AUDIO_PREFERENCES.musicVolume),
    effectsVolume: clampVolume(preferences.effectsVolume, DEFAULT_AUDIO_PREFERENCES.effectsVolume),
  };
  try {
    storage.setItem(AUDIO_PREFERENCES_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage may be disabled; audio playback can continue with in-memory settings.
  }
}
