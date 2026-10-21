import type { RunStateSnapshot } from './systems/RunState';
import type { BossEncounterSnapshot } from './systems/BossEncounter';

export type GameEvent =
  | { type: 'state'; state: RunStateSnapshot; timeRemainingMs: number | null; effectRemainingMs: number; boss: BossEncounterSnapshot | null }
  | { type: 'checkpoint'; state: RunStateSnapshot }
  | { type: 'stage-clear'; state: RunStateSnapshot }
  | { type: 'game-over'; state: RunStateSnapshot }
  | { type: 'timeout'; state: RunStateSnapshot };
