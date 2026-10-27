import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TouchControls } from './TouchControls';

afterEach(cleanup);

describe('TouchControls', () => {
  it('presses and releases jump/slide for pointer up, cancel, and pointer leave', () => {
    const inputBridge = { press: vi.fn(), release: vi.fn(), clear: vi.fn() };
    render(<TouchControls inputBridge={inputBridge as never} disabled={false} />);
    const jump = screen.getByRole('button', { name: '점프' });
    fireEvent.pointerDown(jump, { pointerId: 1 });
    fireEvent.pointerUp(jump, { pointerId: 1 });
    const slide = screen.getByRole('button', { name: '슬라이딩' });
    fireEvent.pointerDown(slide, { pointerId: 2 });
    fireEvent.pointerCancel(slide, { pointerId: 2 });
    fireEvent.pointerDown(slide, { pointerId: 3 });
    fireEvent.pointerLeave(slide, { pointerId: 3 });
    expect(inputBridge.press.mock.calls).toEqual([['jump'], ['slide'], ['slide']]);
    expect(inputBridge.release.mock.calls).toEqual([['jump'], ['slide'], ['slide']]);
  });

  it('clears held input when disabled and on unmount', () => {
    const inputBridge = { press: vi.fn(), release: vi.fn(), clear: vi.fn() };
    const view = render(<TouchControls inputBridge={inputBridge as never} disabled={false} />);
    view.rerender(<TouchControls inputBridge={inputBridge as never} disabled />);
    expect(screen.getByRole('button', { name: '점프' })).toBeDisabled();
    expect(inputBridge.clear).toHaveBeenCalled();
    view.unmount();
    expect(inputBridge.clear).toHaveBeenCalledTimes(3);
  });
});
