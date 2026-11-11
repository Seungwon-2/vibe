import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PersonalRunHistoryRecord } from '../../services/RunGateway';
import { PersonalHistoryScreen } from './PersonalHistoryScreen';

afterEach(cleanup);

const firstRun: PersonalRunHistoryRecord = {
  id: 'private-run-id-001', characterId: 'player-default', mode: 'story', storyStageId: 'dawn-city',
  distanceMeters: 2450, coins: 21, durationMs: 48_000, finishedAtIso: '2026-11-10T12:30:00.000Z',
  finishReason: 'stage-complete', hitsTaken: 0, passedGateCount: 1, completedStage: true,
};
const secondRun: PersonalRunHistoryRecord = {
  ...firstRun, id: 'private-run-id-002', mode: 'endless', storyStageId: null,
  distanceMeters: 1800, coins: 5, finishReason: 'lives-exhausted', hitsTaken: 3, completedStage: false,
};

describe('PersonalHistoryScreen', () => {
  it('renders personal run details with readable mode and finish labels, without record IDs', () => {
    render(<PersonalHistoryScreen rows={[firstRun]} loading={false} error={null} hasMore={false}
      onLoadMore={vi.fn()} onRetry={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '내 플레이 기록' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '내 달리기 기록' })).toBeInTheDocument();
    expect(screen.getByText('새벽 도심')).toBeInTheDocument();
    expect(screen.getByText('2,450m')).toBeInTheDocument();
    expect(screen.getByText('21 코인')).toBeInTheDocument();
    expect(screen.getByText('0회 피격')).toBeInTheDocument();
    expect(screen.getByText('스테이지 완주')).toBeInTheDocument();
    expect(screen.getByText('코스 완주')).toBeInTheDocument();
    expect(screen.getByText(/2026\. 11\. 10\./)).toBeInTheDocument();
    expect(screen.queryByText(/private-run-id/)).not.toBeInTheDocument();
  });

  it('shows accessible loading, empty and retryable error states', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<PersonalHistoryScreen rows={[]} loading onBack={vi.fn()} error={null}
      hasMore={false} onLoadMore={vi.fn()} onRetry={onRetry} />);
    expect(screen.getByRole('status')).toHaveTextContent('기록을 불러오는 중입니다');
    rerender(<PersonalHistoryScreen rows={[]} loading={false} onBack={vi.fn()} error={null}
      hasMore={false} onLoadMore={vi.fn()} onRetry={onRetry} />);
    expect(screen.getByText(/아직 저장된 플레이 기록이 없습니다/)).toBeInTheDocument();
    rerender(<PersonalHistoryScreen rows={[]} loading={false} onBack={vi.fn()} error="읽기 실패"
      hasMore={false} onLoadMore={vi.fn()} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('읽기 실패');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('offers a single load-more action, disables it during a request, and appends subsequent pages', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<PersonalHistoryScreen rows={[firstRun]} loading={false} error={null}
      hasMore onLoadMore={onLoadMore} onRetry={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '기록 더 보기' }));
    expect(onLoadMore).toHaveBeenCalledOnce();
    rerender(<PersonalHistoryScreen rows={[firstRun]} loading error={null}
      hasMore onLoadMore={onLoadMore} onRetry={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: '불러오는 중…' })).toBeDisabled();
    rerender(<PersonalHistoryScreen rows={[firstRun, secondRun]} loading={false} error={null}
      hasMore={false} onLoadMore={onLoadMore} onRetry={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('2,450m')).toBeInTheDocument();
    expect(screen.getByText('1,800m')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '기록 더 보기' })).not.toBeInTheDocument();
  });
});
