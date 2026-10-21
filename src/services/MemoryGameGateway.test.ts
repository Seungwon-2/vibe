import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryGameGateway } from './MemoryGameGateway';

describe('MemoryGameGateway', () => {
  beforeEach(() => localStorage.removeItem('azure-platformer-dev-save-v1'));

  it('persists a save and returns the top ten per-player best records by score then time', async () => {
    const gateway = new MemoryGameGateway();
    const save = {
      worldId: 'windy-ruins' as const,
      stageId: 'ruins-2',
      checkpointId: 'ruins-2-checkpoint',
      lives: 3,
      stageScore: 700,
      coins: 5,
      collectedCoinIds: ['coin-1'],
      unlockedStageOrdinal: 4,
      characterId: 'default-hero',
    };
    await gateway.putSave(save);
    expect(await new MemoryGameGateway().getSave()).toEqual(save);

    await gateway.submitClear({ stageId: 'ruins-2', displayName: 'player-1', score: 500, clearTimeMs: 40_000 });
    await gateway.submitClear({ stageId: 'ruins-2', displayName: 'player-1', score: 250, clearTimeMs: 20_000 });
    for (let index = 2; index <= 12; index += 1) {
      await gateway.submitClear({ stageId: 'ruins-2', displayName: `player-${index}`, score: 400 - index, clearTimeMs: 30_000 });
    }

    const rows = await new MemoryGameGateway().getRanking('ruins-2');
    expect(rows).toHaveLength(10);
    expect(rows[0]).toMatchObject({ displayName: 'player-1', score: 500, clearTimeMs: 40_000 });
    expect(rows.some((row) => row.displayName === 'player-12')).toBe(false);
  });
});
