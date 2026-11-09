import type { CharacterId } from '../game/characters/characterTypes';
import type { RunnerFinishReason, RunnerMode, RunnerResult, StoryStageId } from '../game/runner/runnerTypes';

export type PublicLeaderboardRecord = Readonly<{
  rank: number;
  displayName: string;
  characterId: CharacterId;
  distanceMeters: number;
  coins: number;
  finishedAtIso: string;
}>;

export type PersonalBestRecord = PublicLeaderboardRecord;

export type PersonalRunHistoryRecord = Readonly<{
  id: string;
  characterId: CharacterId;
  mode: RunnerMode;
  storyStageId: StoryStageId | null;
  distanceMeters: number;
  coins: number;
  durationMs: number;
  finishedAtIso: string;
  finishReason: RunnerFinishReason;
  hitsTaken: number;
  passedGateCount: number;
  completedStage: boolean;
}>;

export type PersonalRunHistoryPage = Readonly<{
  items: readonly PersonalRunHistoryRecord[];
  nextCursor: string | null;
}>;

export type RunSubmissionReceipt = Readonly<{
  savedRun: PersonalRunHistoryRecord;
  personalBest: PersonalBestRecord | null;
  personalBestUpdated: boolean;
}>;

export interface RunGateway {
  getBest(): Promise<PersonalBestRecord | null>;
  getRanking(): Promise<PublicLeaderboardRecord[]>;
  getPersonalHistory(options?: { limit?: number; cursor?: string | null }): Promise<PersonalRunHistoryPage>;
  submitRun(result: RunnerResult): Promise<RunSubmissionReceipt>;
}

export type { RunnerResult };
