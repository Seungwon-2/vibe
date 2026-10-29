import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RUNNER_AUDIO_EFFECTS } from '../../audio/audioCatalog';
import { AudioCreditsDialog } from './AudioCreditsDialog';

describe('AudioCreditsDialog', () => {
  it('lists each effect from the shared catalog with its generator', () => {
    render(<AudioCreditsDialog onClose={vi.fn()} />);
    for (const { credit } of Object.values(RUNNER_AUDIO_EFFECTS)) {
      expect(screen.getByText(credit.title)).toBeInTheDocument();
      expect(screen.getAllByText(credit.generationScript)).toHaveLength(10);
    }
    expect(screen.getAllByText(/Original project-generated audio/)).toHaveLength(10);
  });
});
