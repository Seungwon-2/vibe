import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PhaserGame } from './PhaserGame';

const phaserLifecycle = vi.hoisted(() => ({
  created: vi.fn(),
  destroyed: vi.fn(),
}));

vi.mock('phaser', () => ({
  default: {
    AUTO: 1,
    Scale: { FIT: 2, CENTER_BOTH: 3 },
    Scene: class {},
    Game: class {
      constructor(config: { parent: HTMLElement }) {
        phaserLifecycle.created(config.parent);
        config.parent.append(document.createElement('canvas'));
        Object.assign(this, {
          events: { on: vi.fn(), off: vi.fn() },
          scene: { isActive: vi.fn(() => false), pause: vi.fn(), resume: vi.fn() },
        });
      }

      destroy(removeCanvas: boolean) {
        phaserLifecycle.destroyed(removeCanvas);
      }
    },
  },
}));

describe('PhaserGame', () => {
  beforeEach(() => {
    phaserLifecycle.created.mockClear();
    phaserLifecycle.destroyed.mockClear();
  });

  afterEach(cleanup);

  it('creates one Phaser game and tears it down with its React host', () => {
    const onEvent = vi.fn();
    const onDestroy = vi.fn();
    const view = render(<PhaserGame stageId="ruins-1" initialLives={5} paused={false} onEvent={onEvent} onDestroy={onDestroy} />);

    expect(screen.getByLabelText('플랫포머 게임 화면')).toContainElement(document.querySelector('canvas'));
    expect(phaserLifecycle.created).toHaveBeenCalledTimes(1);
    expect(onEvent).not.toHaveBeenCalled();

    view.unmount();

    expect(phaserLifecycle.destroyed).toHaveBeenCalledWith(true);
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });
});
