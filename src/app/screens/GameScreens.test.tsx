import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainMenu } from './MainMenu';
import { RankingScreen } from './RankingScreen';
import { ResultScreen } from './ResultScreen';
import { WorldMap } from './WorldMap';
import { worlds } from '../../game/content/worldCatalog';
import { stageCatalog } from '../../game/content/worldCatalog';

describe('game screens', () => {
  it('offers continue only when a save exists and routes menu actions', () => {
    const onNewGame = vi.fn();
    const onContinue = vi.fn();
    const onRankings = vi.fn();
    const { rerender } = render(<MainMenu canContinue={false} onNewGame={onNewGame} onContinue={onContinue} onRankings={onRankings} />);
    expect(screen.getByRole('button', { name: '이어서 하기' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '새 게임' }));
    fireEvent.click(screen.getByRole('button', { name: '스테이지 랭킹' }));
    expect(onNewGame).toHaveBeenCalledOnce();
    expect(onRankings).toHaveBeenCalledOnce();
    rerender(<MainMenu canContinue onNewGame={onNewGame} onContinue={onContinue} onRankings={onRankings} />);
    fireEvent.click(screen.getByRole('button', { name: '이어서 하기' }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('locks campaign stages beyond the unlocked ordinal', () => {
    render(<WorldMap worlds={worlds} unlockedStageOrdinal={6} onSelect={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: '끝없는 승강로 잠김' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '발광 광맥' })).toBeEnabled();
  });

  it('shows result actions and top ten ranking entries', () => {
    const onRetry = vi.fn();
    render(<ResultScreen kind="timeout" stageName="끝없는 승강로" score={300} onContinue={vi.fn()} onRetry={onRetry} onMenu={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '다시 도전' }));
    expect(onRetry).toHaveBeenCalledOnce();

    const rows = Array.from({ length: 12 }, (_, index) => ({
      stageId: 'ruins-1', displayName: `플레이어 ${index + 1}`, score: 1_000 - index,
      clearTimeMs: 30_000, rank: index + 1,
    }));
    const { container, rerender } = render(<RankingScreen rows={rows} stageId="ruins-1" stages={stageCatalog} onStageChange={vi.fn()} onBack={vi.fn()} />);
    expect(container.querySelectorAll('.ranking-list > li')).toHaveLength(10);
    rerender(<RankingScreen rows={[]} stageId="ruins-1" stages={stageCatalog} onStageChange={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('아직 등록된 기록이 없습니다.')).toBeInTheDocument();
  });
});
