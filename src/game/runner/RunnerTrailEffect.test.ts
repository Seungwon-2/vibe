import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { RunnerTrailEffect } from './RunnerTrailEffect';

describe('trail presentation', () => {
  it('keeps cosmetics as sparse steady marks in calm mode, with sparkles only in standard mode', () => {
    const art = { clear: vi.fn(), destroy: vi.fn(), fillStyle: vi.fn(), fillCircle: vi.fn(),
      lineStyle: vi.fn(), lineBetween: vi.fn(), setDepth: vi.fn() };
    for (const mock of Object.values(art)) mock.mockReturnValue(art);
    const scene = { add: { graphics: () => art } } as unknown as Phaser.Scene;
    const effect = new RunnerTrailEffect(scene, 'trail-cloud');
    for (let tick = 0; tick < 6; tick++) effect.update(tick * 50, 50, 170, 450, true, true);
    expect(art.fillCircle).toHaveBeenCalled();
    expect(art.lineBetween).not.toHaveBeenCalled();
    effect.setVisualMode('standard');
    art.fillCircle.mockClear();
    effect.update(400, 50, 170, 450, true, true);
    expect(art.fillCircle.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(art.lineBetween).toHaveBeenCalled();
    effect.destroy();
    expect(art.destroy).toHaveBeenCalledOnce();
  });
});
