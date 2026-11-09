import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicLeaderboardRecord } from '../../services/RunGateway';
import { RankingScreen } from './RankingScreen';

afterEach(cleanup);

const rows: PublicLeaderboardRecord[] = [
  { rank: 1, displayName: 'Runner A', characterId: 'hanayo-hiyori', distanceMeters: 2500, coins: 8,
    finishedAtIso: '2026-10-27T00:00:00.000Z' },
  { rank: 2, displayName: 'Runner B', characterId: 'cogane-rang', distanceMeters: 1900, coins: 3,
    finishedAtIso: '2026-10-26T00:00:00.000Z' },
];

describe('RankingScreen', () => {
  it('shows one unified list with rank, character, meters, coins, and date', () => {
    render(<RankingScreen rows={rows} loading={false} error={null} onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '로컬 랭킹' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '통합 달리기 랭킹' })).toBeInTheDocument();
    expect(screen.getByText('하나요 히요리')).toBeInTheDocument();
    expect(screen.getByText('코가네 랑')).toBeInTheDocument();
    expect(screen.getByText('2,500m')).toBeInTheDocument();
    expect(screen.getByText('1,900m')).toBeInTheDocument();
    expect(screen.getByText(/8 코인/)).toBeInTheDocument();
    expect(screen.getAllByText('2026. 10. 27.').length).toBe(1);
    const topRecord = screen.getByText('1위').closest('li');
    expect(topRecord).toHaveClass('ranking-record', 'is-podium', 'is-podium-1');
    expect(topRecord?.style.getPropertyValue('--character-accent')).toBeTruthy();
    expect(screen.getByText('2,500m')).toHaveClass('ranking-record__distance');
    expect(screen.getByText(/8 코인/)).toHaveClass('ranking-record__meta');
  });

  it('shows empty, loading, and read-error states without hiding the back action', () => {
    const onBack = vi.fn();
    const { rerender } = render(<RankingScreen rows={[]} loading={false} error={null} onBack={onBack} />);
    expect(screen.getByText(/완주하면 첫 랭킹 기록/)).toBeInTheDocument();
    rerender(<RankingScreen rows={[]} loading error={null} onBack={onBack} />);
    expect(screen.getByRole('status')).toHaveTextContent('기록을 불러오는 중입니다');
    rerender(<RankingScreen rows={[]} loading={false} error="읽기 실패" onBack={onBack} />);
    expect(screen.getByRole('alert')).toHaveTextContent('읽기 실패');
    fireEvent.click(screen.getByRole('button', { name: '메인 메뉴로' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
