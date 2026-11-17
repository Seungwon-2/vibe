import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEffectiveVisualMode, readRunnerVisualMode, RUNNER_VISUAL_STORAGE_KEY, saveRunnerVisualMode } from './runnerVisualPreferences';

afterEach(() => { localStorage.removeItem(RUNNER_VISUAL_STORAGE_KEY); vi.restoreAllMocks(); });
describe('runner visual preference', () => {
  it('defaults to calm and round-trips a deliberately selected standard mode', () => {
    expect(readRunnerVisualMode()).toBe('calm');
    saveRunnerVisualMode('standard');
    expect(readRunnerVisualMode()).toBe('standard');
    expect(getEffectiveVisualMode('standard', true)).toBe('calm');
    expect(getEffectiveVisualMode('standard', false)).toBe('standard');
  });
  it.each(['broken', '{"version":2,"mode":"standard"}', '{"version":1,"mode":"unknown"}', 'null'])('rejects invalid saved values: %s', value => {
    localStorage.setItem(RUNNER_VISUAL_STORAGE_KEY, value);
    expect(readRunnerVisualMode()).toBe('calm');
  });
  it('tolerates denied browser storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
    expect(readRunnerVisualMode()).toBe('calm');
    expect(() => saveRunnerVisualMode('standard')).not.toThrow();
  });
});
