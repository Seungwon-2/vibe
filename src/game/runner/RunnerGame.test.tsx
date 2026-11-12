import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RunnerInputBridge } from './RunnerInput';

const mocks = vi.hoisted(() => ({
  destroy: vi.fn(),
  construct: vi.fn(),
  configArgs: [] as unknown[],
  shouldThrow: false,
  scene: null as unknown,
}));

vi.mock('phaser', () => ({
  default: {
    Game: class {
      registry = { set: vi.fn() };
      isBooted = true;
      scene = { keys: { RunnerScene: mocks.scene } };
      destroy = mocks.destroy;
      constructor(config: unknown) {
        mocks.construct(config);
        if (mocks.shouldThrow) throw new Error('WebGL unavailable');
      }
    },
  },
}));
vi.mock('./createRunnerGameConfig', () => ({ createRunnerGameConfig: vi.fn((...args: unknown[]) => {
  mocks.configArgs = args;
  return { mocked: true };
}) }));
vi.mock('./RunnerScene', () => ({ RunnerScene: class {
  getSnapshot = vi.fn(() => ({ phase: 'running' }));
  createSessionCheckpoint = vi.fn(() => ({ snapshot: { phase: 'paused' } }));
  canCreateSessionCheckpoint = vi.fn(() => true);
  setPaused = vi.fn();
} }));

import { RunnerGame } from './RunnerGame';
import { RunnerScene } from './RunnerScene';

describe('RunnerGame', () => {
  it('autosaves a paused snapshot without pausing the live scene or clearing held input', async () => {
    vi.useFakeTimers();
    const scene = new RunnerScene();
    mocks.scene = scene;
    const bridge = new RunnerInputBridge();
    bridge.press('slide');
    const onCheckpoint = vi.fn();
    render(<RunnerGame characterId="player-default" inputBridge={bridge} paused={false} tutorialEnabled={false}
      onSnapshot={vi.fn()} onFinished={vi.fn()} onCheckpoint={onCheckpoint} />);

    await vi.advanceTimersByTimeAsync(1_000);

    expect(scene.createSessionCheckpoint).toHaveBeenCalledOnce();
    expect(scene.setPaused).toHaveBeenCalledTimes(1); // Initial paused=false synchronization only.
    expect(onCheckpoint).toHaveBeenCalledWith({ snapshot: { phase: 'paused' } });
    expect(bridge.consumeFrame().slideHeld).toBe(true);
    vi.useRealTimers();
  });

  it('constructs once, keeps the instance through prop changes, and destroys it on unmount', () => {
    mocks.construct.mockClear();
    mocks.destroy.mockClear();
    const bridge = new RunnerInputBridge();
    const onSnapshot = vi.fn();
    const onFinished = vi.fn();
    const view = render(<RunnerGame characterId="player-default" inputBridge={bridge} paused={false} tutorialEnabled
      onSnapshot={onSnapshot} onFinished={onFinished} />);
    expect(mocks.construct).toHaveBeenCalledTimes(1);
    view.rerender(<RunnerGame characterId="player-default" inputBridge={bridge} paused tutorialEnabled
      onSnapshot={vi.fn()} onFinished={onFinished} />);
    expect(mocks.construct).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(mocks.destroy).toHaveBeenCalledWith(true);
  });

  it('shows a retry path when Phaser construction fails', async () => {
    mocks.shouldThrow = true;
    render(<RunnerGame characterId="cogane-rang" inputBridge={new RunnerInputBridge()} paused={false} tutorialEnabled={false}
      onSnapshot={vi.fn()} onFinished={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('WebGL unavailable');
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    mocks.shouldThrow = false;
  });

  it('forwards the result outcome through the stable callback bridge', () => {
    const onFinished = vi.fn();
    render(<RunnerGame characterId="player-default" inputBridge={new RunnerInputBridge()} paused={false} tutorialEnabled
      onSnapshot={vi.fn()} onFinished={onFinished} />);
    const callbacks = mocks.configArgs[6] as {
      onFinished(result: object, outcome: string): void;
    };
    const result = { characterId: 'player-default', distanceMeters: 100 };
    callbacks.onFinished(result, 'personal-best');
    expect(onFinished).toHaveBeenCalledWith(result, 'personal-best');
  });

  it('passes the captured tutorial setting into Phaser configuration', () => {
    render(<RunnerGame characterId="player-default" inputBridge={new RunnerInputBridge()} paused={false}
      tutorialEnabled onSnapshot={vi.fn()} onFinished={vi.fn()} />);
    expect(mocks.configArgs[7]).toBe(true);
  });
});
