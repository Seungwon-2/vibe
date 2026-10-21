import type { DamageResult, RunState } from './RunState';

export type EnemyContact = {
  stompable: boolean;
  descending: boolean;
  playerBottom: number;
  enemyTop: number;
};

export type EnemyContactResult =
  | { kind: 'stomp'; score: number }
  | { kind: 'damage'; damage: DamageResult };

const STOMP_TOLERANCE = 14;

export function resolveEnemyContact(contact: EnemyContact, runState: RunState): EnemyContactResult {
  const isStomp = contact.stompable && contact.descending &&
    contact.playerBottom <= contact.enemyTop + STOMP_TOLERANCE;
  if (isStomp) {
    runState.recordEnemyStomp();
    return { kind: 'stomp', score: runState.snapshot().stageScore };
  }
  return { kind: 'damage', damage: runState.loseLife() };
}

export function resolveHazardContact(runState: RunState): DamageResult {
  return runState.loseLife();
}
