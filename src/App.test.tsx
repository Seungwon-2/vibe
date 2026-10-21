import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./game/PhaserGame', () => ({
  PhaserGame: () => <div aria-label="플랫포머 게임 화면" />,
}));

describe('App', () => {
  it('shows the main menu and campaign actions', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '바람과 빛의 모험' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 게임' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '스테이지 랭킹' })).toBeInTheDocument();
  });
});
