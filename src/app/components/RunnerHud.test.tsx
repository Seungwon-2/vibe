import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCharacter } from '../../game/characters/characterCatalog';
import { createRunnerSnapshot, startRunner } from '../../game/runner/RunnerSimulation';
import type { RunnerSnapshot } from '../../game/runner/runnerTypes';
import { CountdownOverlay } from './CountdownOverlay';
import { PauseOverlay } from './PauseOverlay';
import { RunnerHud } from './RunnerHud';

afterEach(cleanup);

describe('RunnerHud', () => {
  const snapshot = (overrides: Partial<RunnerSnapshot> = {}) => ({
    ...startRunner(createRunnerSnapshot('hanayo-hiyori')),
    distanceMeters: 61,
    coins: 2,
    ...overrides,
  });

  it('shows current run information and an accessible passive label', () => {
    const onPause = vi.fn();
    render(<RunnerHud snapshot={snapshot()} character={getCharacter('hanayo-hiyori')}
      recentBonus={null} onPause={onPause} />);
    expect(screen.getByText('1:30')).toBeInTheDocument();
    expect(screen.getByText('61')).toBeInTheDocument();
    expect(screen.getByLabelText('코인 2개')).toBeInTheDocument();
    expect(screen.getByText(/새벽 도심 · 다음 보너스까지 1,939m/)).toBeInTheDocument();
    expect(screen.getByText('벚꽃 수호')).toBeInTheDocument();
    expect(screen.getByText('충돌·낭떠러지 방어 2회')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '남은 방어 2회' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '일시정지' }));
    expect(onPause).toHaveBeenCalledOnce();
  });

  it('uses the same four HUD slots for Story and Endless while changing the first metric', () => {
    const endlessSnapshot = snapshot();
    const storySnapshot = {
      ...startRunner(createRunnerSnapshot('player-default', new Date(), { mode: 'story', storyStageId: 'dawn-city' })),
      distanceMeters: 460,
      coins: 4,
    };
    const { rerender } = render(<RunnerHud snapshot={endlessSnapshot} character={getCharacter('player-default')}
      recentBonus={null} onPause={vi.fn()} />);
    const hud = document.querySelector('.runner-hud__main');
    const slotOrder = Array.from(hud?.children ?? []).map((child) => child.className.split(' ')[0]);
    expect(slotOrder).toEqual(['runner-hud__timer', 'runner-hud__distance', 'runner-hud__lives', 'runner-hud__actions']);
    expect(screen.getByText('남은 시간')).toBeInTheDocument();

    rerender(<RunnerHud snapshot={storySnapshot} character={getCharacter('player-default')}
      recentBonus={null} onPause={vi.fn()} />);
    expect(Array.from(hud?.children ?? []).map((child) => child.className.split(' ')[0])).toEqual(slotOrder);
    expect(screen.getByText('코스 진행')).toBeInTheDocument();
    expect(screen.getByText('460 / 2,500m')).toBeInTheDocument();
    expect(screen.getByLabelText('코인 4개')).toBeInTheDocument();
  });

  it('shows three remaining lives in Endless and updates the accessible heart count', () => {
    const { rerender } = render(<RunnerHud snapshot={snapshot()} character={getCharacter('player-default')}
      recentBonus={null} onPause={vi.fn()} />);
    expect(screen.getByRole('img', { name: '남은 생명 3개' })).toHaveTextContent('♥♥♥');
    rerender(<RunnerHud snapshot={snapshot({ livesRemaining: 1 })} character={getCharacter('player-default')}
      recentBonus={null} onPause={vi.fn()} />);
    expect(screen.getByRole('img', { name: '남은 생명 1개' })).toHaveTextContent('♥♡♡');
  });

  it('warns at ten seconds, hides zero rewards, and shows actual awarded bonus only', () => {
    const { rerender } = render(<RunnerHud snapshot={snapshot({ remainingMs: 10_000 })}
      character={getCharacter('player-default')} recentBonus={{ id: 'capped', kind: 'pickup', awardedMs: 0 }}
      onPause={vi.fn()} />);
    expect(screen.getByText('0:10').parentElement).toHaveClass('is-warning');
    expect(screen.queryByText('+0초')).not.toBeInTheDocument();
    rerender(<RunnerHud snapshot={snapshot()} character={getCharacter('player-default')}
      recentBonus={{ id: 'time-coin', kind: 'pickup', awardedMs: 4_000 }} onPause={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('+4초');
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('shows Hiyori defense charges and a trigger-specific cue', () => {
    const base = snapshot({ passiveChargesRemaining: 1 });
    const { rerender } = render(<RunnerHud snapshot={base} character={getCharacter('hanayo-hiyori')}
      recentBonus={null} onPause={vi.fn()} />);
    expect(screen.getByRole('img', { name: '남은 방어 1회' })).toBeInTheDocument();
    rerender(<RunnerHud snapshot={base} character={getCharacter('hanayo-hiyori')}
      recentBonus={{ id: 'passive-1', kind: 'passive-triggered', passiveId: 'hiyori-guard',
        remainingCharges: 1, trigger: 'pit' }} onPause={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('벚꽃 수호 · 낭떠러지 방어 · 남은 1회');
  });

  it('shows giant duration and a pickup cue without reporting it as a time bonus', () => {
    const { rerender } = render(<RunnerHud snapshot={snapshot({ giantRemainingMs: 2_200 })}
      character={getCharacter('player-default')} recentBonus={null} onPause={vi.fn()} />);
    expect(screen.getByRole('timer', { name: '거대화 3초 남음' })).toBeInTheDocument();
    rerender(<RunnerHud snapshot={snapshot({ giantRemainingMs: 0 })} character={getCharacter('player-default')}
      recentBonus={{ id: 'giant-0', kind: 'giant' }} onPause={vi.fn()} />);
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('거대화!');
    expect(screen.queryByText('+0초')).not.toBeInTheDocument();
  });
});

describe('overlays', () => {
  it('renders countdown values and hides the overlay at zero', () => {
    const { rerender } = render(<CountdownOverlay value={3} />);
    expect(screen.getByRole('status', { name: '3초 후 시작' })).toBeInTheDocument();
    rerender(<CountdownOverlay value={0} />);
    expect(screen.queryByRole('status', { name: /초 후 시작/ })).not.toBeInTheDocument();
  });

  it('prevents resuming in portrait but provides resume and exit in landscape', () => {
    const onResume = vi.fn();
    const onExit = vi.fn();
    const { rerender } = render(<PauseOverlay onResume={onResume} onExit={onExit} onOpenAudioSettings={vi.fn()} portrait />);
    expect(screen.getByRole('button', { name: '계속하기' })).toBeDisabled();
    rerender(<PauseOverlay onResume={onResume} onExit={onExit} onOpenAudioSettings={vi.fn()} portrait={false} />);
    fireEvent.click(screen.getByRole('button', { name: '계속하기' }));
    fireEvent.click(screen.getByRole('button', { name: '나가기' }));
    expect(onResume).toHaveBeenCalledOnce();
    expect(onExit).toHaveBeenCalledOnce();
  });
});
