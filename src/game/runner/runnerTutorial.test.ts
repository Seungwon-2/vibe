import { describe, expect, it, vi } from 'vitest';
import { markRunnerTutorialSeen, RUNNER_TUTORIAL_STORAGE_KEY, shouldShowRunnerTutorial } from './runnerTutorial';

function makeStorage(initialValue: string | null = null) {
  let value = initialValue;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => { value = nextValue; }),
  };
}

describe('first-run tutorial storage', () => {
  it('shows when unseen, persists completion, and hides on subsequent checks', () => {
    const storage = makeStorage();
    expect(shouldShowRunnerTutorial(storage)).toBe(true);
    markRunnerTutorialSeen(storage);
    expect(storage.setItem).toHaveBeenCalledWith(RUNNER_TUTORIAL_STORAGE_KEY, '1');
    expect(shouldShowRunnerTutorial(storage)).toBe(false);
  });

  it('hides when the browser already has the seen marker', () => {
    expect(shouldShowRunnerTutorial(makeStorage('1'))).toBe(false);
  });

  it('does not throw when browser storage reads or writes fail', () => {
    const throwingStorage = {
      getItem: vi.fn(() => { throw new Error('storage denied'); }),
      setItem: vi.fn(() => { throw new Error('storage denied'); }),
    };
    expect(shouldShowRunnerTutorial(throwingStorage)).toBe(true);
    expect(() => markRunnerTutorialSeen(throwingStorage)).not.toThrow();
    expect(shouldShowRunnerTutorial(throwingStorage)).toBe(false);
  });
});
