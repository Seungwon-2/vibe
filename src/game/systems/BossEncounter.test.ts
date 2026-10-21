import { describe, expect, it } from 'vitest';
import { getStage } from '../content/worldCatalog';
import { BossEncounter } from './BossEncounter';

describe('BossEncounter', () => {
  it('starts command challenge after two stomps, then opens a three-second final stomp window', () => {
    const boss = new BossEncounter(getStage('ruins-4').boss!);
    expect(boss.stomp()).toBe(false);
    expect(boss.stomp()).toBe(false);
    expect(boss.snapshot().phase).toBe('rage-delay');
    boss.tick(5_000);
    expect(boss.snapshot().phase).toBe('command');

    const command = boss.snapshot().currentCommand!;
    command.forEach((key) => boss.input(key));
    expect(boss.snapshot()).toMatchObject({ phase: 'groggy', stomps: 2, remainingMs: 3_000 });
    expect(boss.stomp()).toBe(true);
    expect(boss.snapshot().phase).toBe('defeated');
  });

  it('counterattacks on incorrect or expired commands and offers another command later', () => {
    const boss = new BossEncounter(getStage('mine-4').boss!);
    boss.stomp();
    boss.stomp();
    boss.tick(5_000);
    expect(boss.input('S')).toBe('counter');
    expect(boss.snapshot().phase).toBe('countering');
    boss.tick(900);
    boss.tick(5_000);
    expect(boss.snapshot().phase).toBe('command');
    boss.tick(6_000);
    expect(boss.snapshot().phase).toBe('countering');
  });
});
