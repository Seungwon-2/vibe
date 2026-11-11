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
  it('shows the public cloud ranking without claiming records are local', () => {
    render(<RankingScreen rows={rows} loading={false} error={null} source="cloud" onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '유저 랭킹' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '유저 랭킹' })).toBeInTheDocument();
    expect(screen.getByText('Runner A · 하나요 히요리')).toBeInTheDocument();
    expect(screen.getByText('Runner B · 코가네 랑')).toBeInTheDocument();
    expect(screen.getByText('2,500m')).toBeInTheDocument();
    expect(screen.getByText('1,900m')).toBeInTheDocument();
    expect(screen.getByText(/8 코인/)).toBeInTheDocument();
    expect(screen.queryByText(/LOCAL RUNS|THIS BROWSER|로컬 기록/)).not.toBeInTheDocument();
  });

  it('labels the browser fallback clearly and exposes loading, empty, and error states', () => {
    const onBack = vi.fn();
    const { rerender } = render(<RankingScreen rows={[]} loading={false} error={null} source="local" onBack={onBack} />);
    expect(screen.getByRole('heading', { name: '로컬 기록' })).toBeInTheDocument();
    expect(screen.getByText(/아직 저장된 기록이 없습니다/)).toBeInTheDocument();
    rerender(<RankingScreen rows={[]} loading error={null} source="local" onBack={onBack} />);
    expect(screen.getByRole('status')).toHaveTextContent('기록을 불러오는 중입니다');
    rerender(<RankingScreen rows={[]} loading={false} error="읽기 실패" source="local" onBack={onBack} />);
    expect(screen.getByRole('alert')).toHaveTextContent('읽기 실패');
    fireEvent.click(screen.getByRole('button', { name: '메인 메뉴로' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
