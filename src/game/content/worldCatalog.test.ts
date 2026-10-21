import { describe, expect, it } from 'vitest';
import { getStage, stageCatalog, worlds } from './worldCatalog';

describe('world catalog', () => {
  it('contains two themed worlds and eight ordered stages with valid geometry', () => {
    expect(worlds).toHaveLength(2);
    expect(stageCatalog).toHaveLength(8);
    expect(stageCatalog.map((stage) => stage.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const stage of stageCatalog) {
      expect(stage.platforms.length).toBeGreaterThan(0);
      expect(stage.coins.length).toBeGreaterThan(0);
      expect(stage.spawn.x).toBeGreaterThanOrEqual(0);
      expect(stage.exit.x).toBeLessThanOrEqual(stage.width);
    }
  });

  it('defines mine-3 as a timed, checkpoint-free vertical ascent with persistent coins', () => {
    const stage = getStage('mine-3');
    expect(stage).toMatchObject({
      ordinal: 7,
      height: 1_500,
      timeLimitSeconds: 120,
      fallRule: 'restart-at-base',
      persistCoinsOnFall: true,
      checkpoints: [],
      exit: { y: 110 },
      enemies: [],
    });
    expect(stage.platforms.filter((platform) => platform.y < 1_470).length).toBeGreaterThanOrEqual(8);
  });

  it('configures two three-stomp bosses with distinct rage command windows', () => {
    const [ruins, mine] = stageCatalog.filter((stage) => stage.boss).map((stage) => stage.boss!);
    expect(ruins).toMatchObject({ rageAfterStomps: 2, stompsToDefeat: 3, commandInputLimitMs: 4_000 });
    expect(mine).toMatchObject({ rageAfterStomps: 2, stompsToDefeat: 3, commandInputLimitMs: 6_000 });
    expect(ruins.commandKeys).not.toEqual(mine.commandKeys);
    expect(ruins.speedMultiplier).toBe(1.15);
    expect(mine.speedMultiplier).toBe(1.15);
    expect(ruins.groggyDurationMs).toBe(3_000);
    expect(mine.groggyDurationMs).toBe(3_000);
  });
});
