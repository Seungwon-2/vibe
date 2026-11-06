import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PauseOverlay } from './PauseOverlay';

afterEach(cleanup);

describe('PauseOverlay', () => {
  it('offers an accessible way to reopen the guide while paused', () => {
    const onOpenGuide = vi.fn();
    render(<PauseOverlay onResume={vi.fn()} onExit={vi.fn()} onOpenAudioSettings={vi.fn()}
      onOpenGuide={onOpenGuide} portrait={false} />);
    fireEvent.click(screen.getByRole('button', { name: '설명서 보기' }));
    expect(onOpenGuide).toHaveBeenCalledOnce();
  });
});
