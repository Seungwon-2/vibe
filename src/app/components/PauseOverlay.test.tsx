import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PauseOverlay } from './PauseOverlay';

afterEach(cleanup);

describe('PauseOverlay', () => {
  it('moves initial focus to the resume action', () => {
    const { container } = render(<PauseOverlay onResume={vi.fn()} onExit={vi.fn()} onOpenAudioSettings={vi.fn()}
      onOpenGuide={vi.fn()} portrait={false} />);
    expect(document.activeElement).toBe(container.querySelector('.runner-result-actions button'));
  });

  it('offers an accessible way to reopen the guide while paused', () => {
    const onOpenGuide = vi.fn();
    render(<PauseOverlay onResume={vi.fn()} onExit={vi.fn()} onOpenAudioSettings={vi.fn()}
      onOpenGuide={onOpenGuide} portrait={false} />);
    fireEvent.click(screen.getByRole('button', { name: '설명서 보기' }));
    expect(onOpenGuide).toHaveBeenCalledOnce();
  });

  it('moves focus with arrow keys according to the visible pause button layout', () => {
    const { container } = render(<PauseOverlay onResume={vi.fn()} onExit={vi.fn()} onOpenAudioSettings={vi.fn()}
      onOpenGuide={vi.fn()} portrait={false} />);
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('.runner-result-actions button'));
    const positions = [
      { left: 0, top: 0 },
      { left: 120, top: 0 },
      { left: 0, top: 60 },
      { left: 120, top: 60 },
    ];
    buttons.forEach((button, index) => {
      const { left, top } = positions[index];
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        x: left, y: top, left, top, right: left + 100, bottom: top + 40, width: 100, height: 40,
        toJSON: () => ({}),
      } as DOMRect);
    });

    fireEvent.keyDown(buttons[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[1]);
    fireEvent.keyDown(buttons[1], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[3]);
    fireEvent.keyDown(buttons[3], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(buttons[2]);
  });
});
