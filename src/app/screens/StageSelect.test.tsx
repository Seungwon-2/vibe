import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PLAYER_PROFILE } from '../../services/LocalPlayerProfileStore';
import { StageSelect } from './StageSelect';

afterEach(cleanup);

describe('StageSelect reward labels', () => {
  it('shows Korean character names rather than stored unlock identifiers', () => {
    render(<StageSelect profile={DEFAULT_PLAYER_PROFILE} selectedStageId="dawn-city"
      onSelect={vi.fn()} onStart={vi.fn()} onAchievements={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('이전 스테이지 완주 시 해금 · 시즈키 토아')).toBeInTheDocument();
    expect(screen.getByText('이전 스테이지 완주 시 해금 · 코가네 랑')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('goth-student');
    expect(document.body.textContent).not.toContain('cogane-rang');
  });
});
