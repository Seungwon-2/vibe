import type { CharacterId } from '../characters/characterTypes';
import type {
  RunnerFinishOutcome,
  RunnerMode,
  RunnerResult,
  RunnerSnapshot,
  StoryStageId,
} from './runnerTypes';

export type RunnerSessionKind = 'active' | 'terminal';
export type RunnerSessionScope = Readonly<
  | { kind: 'account'; id: string }
  | { kind: 'guest' }
>;

/** The Phaser-specific fields are filled in by the engine-checkpoint task. */
export type RunnerEngineCheckpoint = Readonly<{
  version: 1;
  [key: string]: unknown;
}>;

export type RunnerActiveSession = Readonly<{
  characterId: CharacterId;
  mode: RunnerMode;
  storyStageId: StoryStageId | null;
  snapshot: RunnerSnapshot;
  engine: RunnerEngineCheckpoint;
}>;

export type RunnerTerminalSession = Readonly<{
  characterId: CharacterId;
  mode: RunnerMode;
  storyStageId: StoryStageId | null;
  result: RunnerResult;
  outcome: RunnerFinishOutcome;
  settled: boolean;
}>;

export type RunnerSessionEnvelope = Readonly<{
  schemaVersion: 1;
  kind: RunnerSessionKind;
  savedAt: string;
  accountScope: RunnerSessionScope;
  runId: string;
  payload: RunnerActiveSession | RunnerTerminalSession;
}>;
