import { describe, expect, it } from 'vitest';
import { calculateStageScore, RunState } from './RunState';

describe('RunState', () => {
  it('shares five lives through the world and rejects repeated damage for 1.5 seconds', () => {
    const run = new RunState('ruins', 'ruins-1');
    expect(run.snapshot().lives).toBe(5);

    const firstHit = run.loseLife();
    expect(firstHit).toMatchObject({ accepted: true, lives: 4, shouldRespawn: true, gameOver: false });
    expect(run.loseLife().accepted).toBe(false);

    run.tick(1_499);
    expect(run.loseLife().accepted).toBe(false);
    run.tick(1);
    expect(run.loseLife().lives).toBe(3);
  });

  it('emits a checkpoint save once when a new checkpoint is activated', () => {
    const run = new RunState('ruins', 'ruins-1');

    const event = run.activateCheckpoint('checkpoint-1');
    expect(event).toMatchObject({ type: 'checkpoint-save', checkpointId: 'checkpoint-1' });
    expect(event?.snapshot.checkpointId).toBe('checkpoint-1');
    expect(run.activateCheckpoint('checkpoint-1')).toBeNull();
  });

  it('scores coins, stomps, clear bonus, and overflow lives exactly once', () => {
    const run = new RunState('ruins', 'ruins-1', 1, 9);
    run.collectCoin();
    run.recordEnemyStomp();
    expect(run.collectExtraLife()).toEqual({ lives: 9, overflowAwarded: true });
    expect(run.snapshot().stageScore).toBe(1_300);

    run.markStageCleared(2);
    run.markStageCleared(2);
    expect(run.snapshot().stageScore).toBe(1_800);
    expect(run.snapshot().unlockedStageOrdinal).toBe(2);
    expect(calculateStageScore(run.snapshot(), true)).toBe(1_800);
  });

  it('restarts the stage with five lives after game over and resets lives for a new world', () => {
    const run = new RunState('ruins', 'ruins-1', 1, 1);
    expect(run.loseLife().gameOver).toBe(true);
    run.restartCurrentStage();
    expect(run.snapshot()).toMatchObject({ lives: 5, stageId: 'ruins-1', checkpointId: 'start', stageScore: 0 });

    run.startNextStage('ruins-2', 2);
    expect(run.snapshot()).toMatchObject({ lives: 5, stageId: 'ruins-2', unlockedStageOrdinal: 2 });
    run.startNewWorld('mine', 'mine-1');
    expect(run.snapshot()).toMatchObject({ lives: 5, worldId: 'mine', stageId: 'mine-1' });
  });

  it('restores checkpoint, score, coins, and unlock progress without sharing mutable coin ids', () => {
    const run = new RunState('ruins', 'ruins-2', 2);
    const collectedCoinIds = ['coin-1'];
    run.restoreProgress({
      lives: 3,
      checkpointId: 'checkpoint-1',
      stageScore: 500,
      coins: 5,
      collectedCoinIds,
      enemyStomps: 1,
      extraLifeOverflow: 0,
      elapsedMs: 20_000,
      unlockedStageOrdinal: 4,
    });
    collectedCoinIds.push('coin-mutated-after-restore');
    expect(run.snapshot()).toMatchObject({
      lives: 3,
      checkpointId: 'checkpoint-1',
      stageScore: 500,
      coins: 5,
      collectedCoinIds: ['coin-1'],
      unlockedStageOrdinal: 4,
    });
  });
});
