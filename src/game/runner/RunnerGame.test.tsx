import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RunnerInputBridge } from './RunnerInput';

const mocks = vi.hoisted(() => ({
  destroy: vi.fn(),
  construct: vi.fn(),
  shouldThrow: false,
}));

vi.mock('phaser', () => ({
  default: {
    Game: class {
      registry = { set: vi.fn() };
      isBooted = false;
      destroy = mocks.destroy;
      constructor(config: unknown) {
        mocks.construct(config);
        if (mocks.shouldThrow) throw new Error('WebGL unavailable');
      }
    },
  },
}));
vi.mock('./createRunnerGameConfig', () => ({ createRunnerGameConfig: vi.fn(() => ({ mocked: true })) }));
vi.mock('./RunnerScene', () => ({ RunnerScene: class {} }));

import { RunnerGame } from './RunnerGame';

describe('RunnerGame', () => {
  it('constructs once, keeps the instance through prop changes, and destroys it on unmount', () => {
    mocks.construct.mockClear();
    mocks.destroy.mockClear();
    const bridge = new RunnerInputBridge();
    const onSnapshot = vi.fn();
    const onFinished = vi.fn();
    const view = render(<RunnerGame characterId="player-default" inputBridge={bridge} paused={false}
      onSnapshot={onSnapshot} onFinished={onFinished} />);
    expect(mocks.construct).toHaveBeenCalledTimes(1);
    view.rerender(<RunnerGame characterId="player-default" inputBridge={bridge} paused
      onSnapshot={vi.fn()} onFinished={onFinished} />);
    expect(mocks.construct).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(mocks.destroy).toHaveBeenCalledWith(true);
  });

  it('shows a retry path when Phaser construction fails', async () => {
    mocks.shouldThrow = true;
    render(<RunnerGame characterId="moonwing" inputBridge={new RunnerInputBridge()} paused={false}
      onSnapshot={vi.fn()} onFinished={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('WebGL unavailable');
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    mocks.shouldThrow = false;
  });
});
