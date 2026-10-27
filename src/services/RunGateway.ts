import type { CharacterId } from '../game/characters/characterTypes';
import type { RunnerResult } from '../game/runner/runnerTypes';

export type RunRecord = Readonly<{
  id: string;
  characterId: CharacterId;
  distanceMeters: number;
  coins: number;
  durationMs: number;
  finishedAtIso: string;
}>;

export type RankedRunRecord = RunRecord & Readonly<{ rank: number }>;

export interface RunGateway {
  getBest(): Promise<RankedRunRecord | null>;
  getRanking(): Promise<RankedRunRecord[]>;
  submitRun(result: RunnerResult): Promise<RankedRunRecord>;
}
