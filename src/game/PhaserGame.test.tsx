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
    const onReady = vi.fn();
    const onDestroy = vi.fn();
    const view = render(<PhaserGame onReady={onReady} onDestroy={onDestroy} />);

    expect(screen.getByLabelText('플랫포머 게임 화면')).toContainElement(document.querySelector('canvas'));
    expect(phaserLifecycle.created).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledTimes(1);

    view.unmount();

    expect(phaserLifecycle.destroyed).toHaveBeenCalledWith(true);
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });
});
