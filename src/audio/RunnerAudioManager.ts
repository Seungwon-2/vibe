import { RUNNER_AUDIO_EFFECTS, type AudioEffectId } from './audioCatalog';
import { DEFAULT_AUDIO_PREFERENCES, type AudioPreferences } from './audioPreferences';

export type RunnerAudioElement = Pick<HTMLAudioElement, 'src' | 'volume' | 'playbackRate' | 'currentTime' | 'play' | 'pause' | 'onended'>;
export type AudioFactory = (src: string) => RunnerAudioElement;

const COIN_RATE_SEQUENCE = [1, 1.06, 1.12, 1.18, 1.22] as const;
const COIN_RESET_GAP_MS = 650;
const MIN_PLAYBACK_RATE = 0.75;
const MAX_PLAYBACK_RATE = 1.35;

export class RunnerAudioManager {
  private readonly audioFactory: AudioFactory;
  private readonly now: () => number;
  private readonly activeAudio = new Set<RunnerAudioElement>();
  private preferences: AudioPreferences;
  private unlocked = false;
  private lastCoinAt = Number.NEGATIVE_INFINITY;
  private coinIndex = 0;

  constructor(options: {
    audioFactory?: AudioFactory;
    now?: () => number;
    preferences?: AudioPreferences;
  } = {}) {
    this.audioFactory = options.audioFactory ?? ((src) => new Audio(src));
    this.now = options.now ?? (() => performance.now());
    this.preferences = options.preferences ?? { ...DEFAULT_AUDIO_PREFERENCES };
  }

  unlock(): void {
    this.unlocked = true;
  }

  setPreferences(preferences: AudioPreferences): void {
    this.preferences = {
      muted: preferences.muted,
      musicVolume: Math.min(1, Math.max(0, preferences.musicVolume)),
      effectsVolume: Math.min(1, Math.max(0, preferences.effectsVolume)),
    };
    const volume = this.preferences.muted ? 0 : this.preferences.effectsVolume;
    for (const audio of this.activeAudio) audio.volume = volume;
  }

  playEffect(id: AudioEffectId, options: { playbackRate?: number } = {}): void {
    if (!this.unlocked || this.preferences.muted || this.preferences.effectsVolume <= 0) return;
    const asset = RUNNER_AUDIO_EFFECTS[id];
    if (!asset) return;

    const now = this.now();
    let playbackRate = options.playbackRate;
    if (id === 'coin' && playbackRate === undefined) {
      if (now - this.lastCoinAt > COIN_RESET_GAP_MS) this.coinIndex = 0;
      playbackRate = COIN_RATE_SEQUENCE[this.coinIndex];
      this.coinIndex = (this.coinIndex + 1) % COIN_RATE_SEQUENCE.length;
      this.lastCoinAt = now;
    }
    if (playbackRate !== undefined) playbackRate = Math.min(MAX_PLAYBACK_RATE, Math.max(MIN_PLAYBACK_RATE, playbackRate));

    try {
      const audio = this.audioFactory(asset.src);
      audio.volume = this.preferences.effectsVolume;
      audio.currentTime = 0;
      if (playbackRate !== undefined) audio.playbackRate = playbackRate;
      this.activeAudio.add(audio);
      audio.onended = () => this.activeAudio.delete(audio);
      void audio.play().catch(() => {
        this.activeAudio.delete(audio);
        audio.pause();
      });
    } catch {
      // Missing or unsupported audio is a silent fallback, never a gameplay error.
    }
  }

  dispose(): void {
    for (const audio of this.activeAudio) {
      audio.pause();
      audio.onended = null;
    }
    this.activeAudio.clear();
    this.unlocked = false;
  }
}

export const browserRunnerAudio = new RunnerAudioManager();
