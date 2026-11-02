import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RUNNER_AUDIO_EFFECTS } from '../../audio/audioCatalog';
import { AudioCreditsDialog } from './AudioCreditsDialog';

describe('AudioCreditsDialog', () => {
  it('lists each effect from the shared catalog with supplied attribution', () => {
    const { container } = render(<AudioCreditsDialog onClose={vi.fn()} />);
    for (const { credit } of Object.values(RUNNER_AUDIO_EFFECTS)) {
      expect(screen.getByText(credit.title)).toBeInTheDocument();
    }
    expect(Array.from(container.querySelectorAll('.audio-credit-list code'), (node) => node.textContent))
      .toEqual(Object.values(RUNNER_AUDIO_EFFECTS).map(({ credit }) => credit.generationScript ?? '사용자 제공 파일'));
    expect(screen.getAllByText(/Original project-generated audio/)).toHaveLength(3);
    expect(screen.getAllByText(/sharing terms unverified/)).toHaveLength(9);
  });
});
