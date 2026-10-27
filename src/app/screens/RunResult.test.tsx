import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RunResult } from './RunResult';

afterEach(cleanup);

describe('RunResult', () => {
  const result = {
    characterId: 'hanayo-hiyori' as const,
    distanceMeters: 1234.4,
    coins: 6,
    durationMs: 90_000,
    finishedAtIso: '2026-10-27T00:00:00.000Z',
  };

  it('shows personal best animation, rounded distance, best, and coins', () => {
    render(<RunResult result={result} outcome="personal-best" bestDistanceMeters={1234}
      onRetry={vi.fn()} onChooseCharacter={vi.fn()} onRankings={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '새로운 최고 기록!' })).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('1,234m')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByTestId('character-preview-hanayo-hiyori')).toHaveAttribute('data-animation', 'victory');
  });

  it('shows the non-record result animation and forwards all result actions', () => {
    const onRetry = vi.fn();
    const onChooseCharacter = vi.fn();
    const onRankings = vi.fn();
    render(<RunResult result={result} outcome="completed" bestDistanceMeters={1400}
      onRetry={onRetry} onChooseCharacter={onChooseCharacter} onRankings={onRankings} />);
    expect(screen.getByRole('heading', { name: '달리기 종료' })).toBeInTheDocument();
    expect(screen.getByText('1,400m')).toBeInTheDocument();
    expect(screen.getByTestId('character-preview-hanayo-hiyori')).toHaveAttribute('data-animation', 'gameOver');
    fireEvent.click(screen.getByRole('button', { name: '같은 캐릭터로 다시 달리기' }));
    fireEvent.click(screen.getByRole('button', { name: '캐릭터 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '로컬 기록 보기' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onChooseCharacter).toHaveBeenCalledOnce();
    expect(onRankings).toHaveBeenCalledOnce();
  });

  it('shows the unified rank and a non-blocking save failure alongside the finished result', () => {
    render(<RunResult result={result} outcome="completed" bestDistanceMeters={1234}
      submittedRank={3} recordError="기록을 저장하지 못했습니다. 이번 결과는 이 화면에서 확인할 수 있습니다."
      onRetry={vi.fn()} onChooseCharacter={vi.fn()} onRankings={vi.fn()} />);
    expect(screen.getByText('3위')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('기록을 저장하지 못했습니다');
    expect(screen.getByText('1,234m')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });
});
