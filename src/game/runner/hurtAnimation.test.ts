import { describe, expect, it } from 'vitest';
import { RUNNER_CONFIG } from './runnerConfig';
import { getHurtAnimationFrames } from './hurtAnimation';

describe('hurt animation timing', () => {
  it('holds the fallen drawing before the recovery frames and fits the hit pause', () => {
    const frames = getHurtAnimationFrames(['impact', 'stumble', 'kneel', 'fallen', 'rise', 'steady']);
    expect(frames.slice(0, 4)).toEqual(['impact', 'stumble', 'kneel', 'fallen']);
    expect(frames.slice(4, 12)).toEqual(Array(8).fill('fallen'));
    expect(frames.slice(-2)).toEqual(['rise', 'steady']);
    expect(frames.length / 12 * 1_000).toBeLessThan(RUNNER_CONFIG.staggerMs);
    expect(() => getHurtAnimationFrames(['impact'])).toThrow();
  });
});
