import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('shows the game title and current preparation status', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '바람과 빛의 모험' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('모험 준비 중');
  });
});
