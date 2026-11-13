export type AudioPreferences = {
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
};

export const DEFAULT_AUDIO_PREFERENCES: Readonly<AudioPreferences> = Object.freeze({
  muted: false,
  // The slider controls a deliberately quiet 0-2% media-gain range.
  musicVolume: 0.5,
  effectsVolume: 0.5,
});

export const AUDIO_PREFERENCES_STORAGE_KEY = 'runner-audio:preferences:v2';
const LEGACY_AUDIO_PREFERENCES_STORAGE_KEY = 'runner-audio:preferences:v1';
export const AUDIO_MEDIA_GAIN_CEILING = 0.02;

/** Convert the user-facing slider position to the capped media gain. */
export function audioGainFromPreference(volume: number): number {
  const normalized = Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0));
  return normalized * AUDIO_MEDIA_GAIN_CEILING;
}

function clampVolume(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

export function loadAudioPreferences(storage: Pick<Storage, 'getItem'>): AudioPreferences {
  try {
    const currentValue = storage.getItem(AUDIO_PREFERENCES_STORAGE_KEY);
    if (currentValue === null) {
      const legacyValue = storage.getItem(LEGACY_AUDIO_PREFERENCES_STORAGE_KEY);
      if (legacyValue === null) return { ...DEFAULT_AUDIO_PREFERENCES };
      const parsedLegacy: unknown = JSON.parse(legacyValue);
      if (typeof parsedLegacy !== 'object' || parsedLegacy === null || Array.isArray(parsedLegacy)) {
        return { ...DEFAULT_AUDIO_PREFERENCES };
      }
      const legacy = parsedLegacy as Partial<Record<keyof AudioPreferences, unknown>>;
      const migrateVolume = (value: unknown): number => {
        const oldSlider = clampVolume(value, 0);
        const migrated = (oldSlider * oldSlider) / AUDIO_MEDIA_GAIN_CEILING;
        return clampVolume(Number(migrated.toFixed(6)), 0);
      };
      return {
        muted: typeof legacy.muted === 'boolean' ? legacy.muted : DEFAULT_AUDIO_PREFERENCES.muted,
        musicVolume: migrateVolume(legacy.musicVolume),
        effectsVolume: migrateVolume(legacy.effectsVolume),
      };
    }
    const value = currentValue;
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
