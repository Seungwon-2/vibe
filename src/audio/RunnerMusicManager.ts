import { RUNNER_MUSIC, type RunnerMusicId } from './musicCatalog';
import { DEFAULT_AUDIO_PREFERENCES, type AudioPreferences } from './audioPreferences';

export type RunnerMusicElement = Pick<HTMLAudioElement, 'src' | 'volume' | 'loop' | 'play' | 'pause'>;
export type MusicFactory = (src: string) => RunnerMusicElement;

export class RunnerMusicManager {
  private readonly audioFactory: MusicFactory;
  private preferences: AudioPreferences;
  private current: RunnerMusicElement | null = null;
  private currentId: RunnerMusicId | null = null;
  private unlocked = false;
  private paused = false;

  constructor(options: { audioFactory?: MusicFactory; preferences?: AudioPreferences } = {}) {
    this.audioFactory = options.audioFactory ?? ((src) => new Audio(src));
    this.preferences = options.preferences ?? { ...DEFAULT_AUDIO_PREFERENCES };
  }

  unlock(): void {
    this.unlocked = true;
    if (this.currentId && !this.paused) void this.start(this.currentId);
  }

  setPreferences(preferences: AudioPreferences): void {
    this.preferences = preferences;
    if (this.current) this.current.volume = preferences.muted ? 0 : preferences.musicVolume;
  }

  play(id: RunnerMusicId | null): void {
    if (id === this.currentId && this.current) {
      this.resume();
      return;
    }
    this.current?.pause();
    this.current = null;
    this.currentId = id;
    this.paused = false;
    if (id && this.unlocked) void this.start(id);
  }

  pause(): void {
    this.paused = true;
    this.current?.pause();
  }

  resume(): void {
    this.paused = false;
    if (this.currentId && this.unlocked && !this.current) void this.start(this.currentId);
    else if (this.currentId && this.unlocked) void this.start(this.currentId);
  }

  dispose(): void {
    this.current?.pause();
    this.current = null;
    this.currentId = null;
    this.unlocked = false;
  }

  private async start(id: RunnerMusicId): Promise<void> {
    if (!this.unlocked || this.paused || this.currentId !== id) return;
    if (!this.current) {
      const track = RUNNER_MUSIC[id];
      this.current = this.audioFactory(track.src);
      this.current.loop = track.loop;
    }
    const audio = this.current;
    audio.volume = this.preferences.muted ? 0 : this.preferences.musicVolume;
    try {
      await audio.play();
    } catch {
      // Playback may be blocked until a user gesture; a later unlock retries it.
    }
  }
}

export const browserRunnerMusic = new RunnerMusicManager();
