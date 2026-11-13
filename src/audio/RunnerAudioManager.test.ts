import { describe, expect, it, vi } from 'vitest';
import { RUNNER_AUDIO_EFFECTS, type AudioEffectId } from './audioCatalog';
import { RunnerAudioManager, type RunnerAudioElement } from './RunnerAudioManager';
import { DEFAULT_AUDIO_PREFERENCES } from './audioPreferences';

function makeAudio(src: string) {
  const audio: RunnerAudioElement = {
    src,
    volume: 1,
    playbackRate: 1,
    currentTime: 0,
    onended: null,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
  };
  return audio;
}

describe('RunnerAudioManager', () => {
  it('waits for user gesture unlock and loads only local catalog files', () => {
    const created: RunnerAudioElement[] = [];
    const manager = new RunnerAudioManager({ audioFactory: (src) => { const audio = makeAudio(src); created.push(audio); return audio; } });
    manager.playEffect('jump');
    expect(created).toHaveLength(0);
    manager.unlock();
    manager.playEffect('jump');
    expect(created[0].src).toBe(RUNNER_AUDIO_EFFECTS.jump.src);
    expect(created[0].src.startsWith('/audio/sfx/')).toBe(true);
  });

  it('applies effects volume and updates active sounds when muted or unmuted', () => {
    const active: RunnerAudioElement[] = [];
    const manager = new RunnerAudioManager({ audioFactory: (src) => { const audio = makeAudio(src); active.push(audio); return audio; } });
    manager.unlock();
    manager.setPreferences({ ...DEFAULT_AUDIO_PREFERENCES, effectsVolume: 0.4 });
    manager.playEffect('coin');
    expect(active[0].volume).toBeCloseTo(0.16);
    manager.setPreferences({ ...DEFAULT_AUDIO_PREFERENCES, effectsVolume: 0.7, muted: true });
    expect(active[0].volume).toBe(0);
    manager.setPreferences({ ...DEFAULT_AUDIO_PREFERENCES, effectsVolume: 0.7, muted: false });
    expect(active[0].volume).toBeCloseTo(0.49);
  });

  it('varies consecutive coin pitch within bounds and resets after a gap', () => {
    const active: RunnerAudioElement[] = [];
    let time = 1000;
    const manager = new RunnerAudioManager({ audioFactory: (src) => { const audio = makeAudio(src); active.push(audio); return audio; }, now: () => time });
    manager.unlock();
    manager.playEffect('coin');
    time += 100;
    manager.playEffect('coin');
    time += 100;
    manager.playEffect('coin');
    expect(active.slice(0, 3).map((audio) => audio.playbackRate)).toEqual([1, 1.06, 1.12]);
    manager.playEffect('coin', { playbackRate: 8 });
    expect(active[3].playbackRate).toBe(1.35);
    time += 700;
    manager.playEffect('coin');
    expect(active[4].playbackRate).toBe(1);
  });

  it('silently ignores invalid effects, muted playback, and rejected audio', async () => {
    const audio = makeAudio('/audio/sfx/jump.wav');
    audio.play = vi.fn(() => Promise.reject(new Error('autoplay blocked')));
    const manager = new RunnerAudioManager({ audioFactory: () => audio });
    manager.unlock();
    manager.playEffect('not-an-effect' as AudioEffectId);
    manager.setPreferences({ ...DEFAULT_AUDIO_PREFERENCES, muted: true });
    manager.playEffect('jump');
    expect(audio.play).not.toHaveBeenCalled();
    manager.setPreferences({ ...DEFAULT_AUDIO_PREFERENCES, muted: false });
    expect(() => manager.playEffect('jump')).not.toThrow();
    await Promise.resolve();
    expect(audio.pause).toHaveBeenCalled();
  });

  it('stops and releases active sounds on dispose', () => {
    const audio = makeAudio('/audio/sfx/jump.wav');
    const manager = new RunnerAudioManager({ audioFactory: () => audio });
    manager.unlock();
    manager.playEffect('jump');
    manager.dispose();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.onended).toBeNull();
  });
});
