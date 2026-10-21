import { describe, expect, it } from 'vitest';
import { resolveEnemyContact, resolveHazardContact } from './CollisionRules';
import { RunState } from './RunState';

describe('CollisionRules', () => {
  it('defeats an enemy when the player descends onto its top', () => {
    const run = new RunState('ruins', 'ruins-1');
    const result = resolveEnemyContact({
      stompable: true,
      descending: true,
      playerBottom: 101,
      enemyTop: 100,
    }, run);

    expect(result.kind).toBe('stomp');
    expect(run.snapshot().enemyStomps).toBe(1);
    expect(run.snapshot().stageScore).toBe(200);
  });

  it('treats side contact and non-stompable enemies as damage', () => {
    const run = new RunState('ruins', 'ruins-1');
    expect(resolveEnemyContact({
      stompable: true,
      descending: false,
      playerBottom: 100,
      enemyTop: 100,
    }, run).kind).toBe('damage');
    expect(run.snapshot().lives).toBe(4);
    expect(resolveEnemyContact({
      stompable: false,
      descending: true,
      playerBottom: 100,
      enemyTop: 100,
    }, run).kind).toBe('damage');
    expect(run.snapshot().lives).toBe(4);
  });

  it('applies one life loss for repeated hazard callbacks during invulnerability', () => {
    const run = new RunState('ruins', 'ruins-1');
    const firstHit = resolveHazardContact(run);
    const repeatedHit = resolveHazardContact(run);

    expect(firstHit).toMatchObject({ accepted: true, lives: 4, shouldRespawn: true });
    expect(repeatedHit.accepted).toBe(false);
    expect(run.snapshot().lives).toBe(4);
  });
});
