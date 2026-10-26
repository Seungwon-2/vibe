import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  bridge: null as { consumeFrame(): { jumpPressed: boolean; slideHeld: boolean } } | null,
  paused: false,
}));

vi.mock('../../game/runner/RunnerGame', () => ({
  RunnerGame: ({ inputBridge, paused }: {
    inputBridge: typeof mock.bridge;
    paused: boolean;
  }) => {
    mock.bridge = inputBridge;
    mock.paused = paused;
    return <div data-testid="runner-canvas" />;
  },
}));

import { RunnerPreview } from './RunnerPreview';

describe('RunnerPreview', () => {
  it('sends touch buttons through the shared bridge and pauses without remounting', () => {
    render(<RunnerPreview characterId="hanayo-hiyori" onBack={vi.fn()} />);
    expect(screen.getByTestId('runner-canvas')).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole('button', { name: '점프' }));
    expect(mock.bridge?.consumeFrame()).toEqual({ jumpPressed: true, slideHeld: false });
    fireEvent.pointerUp(screen.getByRole('button', { name: '점프' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: '슬라이드' }));
    expect(mock.bridge?.consumeFrame().slideHeld).toBe(true);
    fireEvent.pointerUp(screen.getByRole('button', { name: '슬라이드' }));
    expect(mock.bridge?.consumeFrame().slideHeld).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '일시 정지' }));
    expect(mock.paused).toBe(true);
  });
});
