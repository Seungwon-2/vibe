import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResumeSessionDialog } from './ResumeSessionDialog';
import type { RunnerSessionEnvelope } from '../../game/runner/runnerSessionTypes';

const savedAt = new Date().toISOString();
const envelope: RunnerSessionEnvelope = {
  schemaVersion: 1, kind: 'active', savedAt, accountScope: { kind: 'guest' }, runId: 'test-run',
  payload: {
    characterId: 'player-default', mode: 'endless', storyStageId: null,
    snapshot: {
      phase: 'paused', characterId: 'player-default', mode: 'endless', storyStageId: null,
      speedPickupRemainingMs: 0, elapsedMs: 1_000, remainingMs: 89_000, distanceMeters: 240,
      worldDistance: 240, speedUnitsPerSecond: 255, coins: 3, giantRemainingMs: 0,
      collectedPickupIds: [], passedGateIds: [], staggerRemainingMs: 0, protectionRemainingMs: 0,
      passiveChargesRemaining: 0, passiveEffectRemainingMs: 0, slideGuardRemainingMs: 0,
      slideGuardCooldownRemainingMs: 0, biomeId: 'dawn-city', finishedAtElapsedMs: null,
      finishReason: null, startedAtIso: savedAt, finishedAtIso: null,
    },
    engine: { version: 1 },
  },
};

const handlers = () => ({ onResume: vi.fn(), onRequestNewRun: vi.fn(), onConfirmNewRun: vi.fn(),
  onCancelNewRun: vi.fn(), onDismissWarning: vi.fn() });

describe('ResumeSessionDialog', () => {
  it('offers resume and a separately confirmed new-run choice', () => {
    const props = { envelope, confirmingNewRun: false, ...handlers() };
    const view = render(<ResumeSessionDialog {...props} />);
    fireEvent.click(screen.getByRole('button', { name: '이어하기' }));
    expect(props.onResume).toHaveBeenCalledOnce();

    view.rerender(<ResumeSessionDialog {...props} confirmingNewRun />);
    fireEvent.click(screen.getByRole('button', { name: '저장 삭제 후 새로 시작' }));
    expect(props.onConfirmNewRun).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: '돌아가기' }));
    expect(props.onCancelNewRun).toHaveBeenCalledOnce();
  });

  it('shows storage failures as a dismissible non-modal warning', () => {
    const props = { envelope, warning: '저장에 실패했습니다.', confirmingNewRun: false, ...handlers() };
    render(<ResumeSessionDialog {...props} />);
    expect(screen.getByRole('alert')).toHaveTextContent('저장에 실패했습니다.');
    expect(screen.getByRole('alert').closest('[aria-modal="true"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '안내 닫기' }));
    expect(props.onDismissWarning).toHaveBeenCalledOnce();
  });
});
