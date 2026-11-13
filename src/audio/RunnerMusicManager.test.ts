import { describe, expect, it, vi } from 'vitest';
import { RunnerMusicManager, type RunnerMusicElement } from './RunnerMusicManager';
import { RUNNER_MUSIC } from './musicCatalog';
import { DEFAULT_AUDIO_PREFERENCES } from './audioPreferences';

function makeAudio(src: string): RunnerMusicElement {
  return { src, volume: 1, loop: false, play: vi.fn(() => Promise.resolve()), pause: vi.fn() };
}

describe('RunnerMusicManager', () => {
  it('waits for a gesture, loops local music, and changes track cleanly', () => {
    const tracks: RunnerMusicElement[] = [];
    const manager = new RunnerMusicManager({ audioFactory: (src) => { const audio = makeAudio(src); tracks.push(audio); return audio; } });
    manager.play('title');
    expect(tracks).toHaveLength(0);
    manager.unlock();
    expect(tracks[0].src).toBe(RUNNER_MUSIC.title.src);
    expect(tracks[0].loop).toBe(true);
    manager.play('dawn-city');
    expect(tracks[0].pause).toHaveBeenCalledOnce();
    expect(tracks[1].src).toBe(RUNNER_MUSIC['dawn-city'].src);
  });

  it('pauses and resumes the selected track and applies music volume', () => {
    const tracks: RunnerMusicElement[] = [];
    const manager = new RunnerMusicManager({ audioFactory: (src) => { const audio = makeAudio(src); tracks.push(audio); return audio; } });
    manager.unlock();
    manager.play('title');
    manager.setPreferences({ ...DEFAULT_AUDIO_PREFERENCES, musicVolume: 0.35 });
    expect(tracks[0].volume).toBeCloseTo(0.007);
    manager.pause();
    expect(tracks[0].pause).toHaveBeenCalledOnce();
    manager.resume();
    expect(tracks[0].play).toHaveBeenCalledTimes(2);
  });

  it('does not issue overlapping play requests when pointer and click both unlock audio', () => {
    const tracks: RunnerMusicElement[] = [];
    const manager = new RunnerMusicManager({ audioFactory: (src) => {
      const audio = makeAudio(src);
      audio.play = vi.fn(() => new Promise<void>(() => {}));
      tracks.push(audio);
      return audio;
    } });
    manager.play('title');
    manager.unlock();
    manager.unlock();
    expect(tracks).toHaveLength(1);
    expect(tracks[0].play).toHaveBeenCalledOnce();
  });

  it('retries music after a browser rejects the first play request', async () => {
    const tracks: RunnerMusicElement[] = [];
    const manager = new RunnerMusicManager({ audioFactory: (src) => {
      const audio = makeAudio(src);
      audio.play = vi.fn()
        .mockRejectedValueOnce(new Error('autoplay blocked'))
        .mockResolvedValue(undefined);
      tracks.push(audio);
      return audio;
    } });
    manager.play('title');
    manager.unlock();
    await Promise.resolve();
    await Promise.resolve();
    manager.unlock();
    expect(tracks[0].play).toHaveBeenCalledTimes(2);
  });
});
