import type { CharacterId } from '../characters/characterTypes';
import type { HazardDefinition } from './hazardTypes';
import type { PickupDefinition } from './CollectibleSpawner';
import type { PitDefinition } from './PitSpawner';
import type {
  RunnerFinishOutcome,
  RunnerMode,
  RunnerResult,
  RunnerSnapshot,
  StoryStageId,
} from './runnerTypes';
import type { SettlementResult } from '../../services/PlayerProgression';

export type RunnerSessionKind = 'active' | 'terminal';
export type RunnerSessionScope = Readonly<
  | { kind: 'account'; id: string }
  | { kind: 'guest' }
>;

export type RunnerPlayerCheckpoint = Readonly<{
  x: number; y: number; velocityX: number; velocityY: number;
  bodyWidth: number; bodyHeight: number; bodySourceWidth: number; bodySourceHeight: number;
  bodyOffsetX: number; bodyOffsetY: number;
  scaleX: number; scaleY: number; alpha: number; allowGravity: boolean; bodyEnabled: boolean;
  grounded: boolean; jumpsUsed: 0 | 1 | 2; slidingHeld: boolean; hurt: boolean;
  passiveRescuing: boolean; pitFalling: boolean; passiveEffectActive: boolean; giantActive: boolean;
  airPhase: 'ascending' | 'descending'; animation: string; animationFrame: number; animationElapsedMs: number;
}>;

export type RunnerWorldEntityCheckpoint = Readonly<
  | { kind: 'obstacle'; id: string; distanceMeters: number; definition: HazardDefinition; passed: boolean }
  | { kind: 'pickup'; id: string; distanceMeters: number; definition: PickupDefinition;
      collected: boolean;
      magnetStarted: boolean; magnetElapsedMs: number; magnetStartX: number; magnetStartY: number;
      magnetLastProjectedX: number; lastX: number | null; lastY: number | null }
  | { kind: 'pit'; id: string; distanceMeters: number; definition: PitDefinition;
      resolved: boolean; retainArtUntilDestroy: boolean }
  | { kind: 'gate'; id: string; distanceMeters: number }
  | { kind: 'goal'; id: string; distanceMeters: number }
>;

export type RunnerEngineCheckpoint = Readonly<{
  version: 1;
  player: RunnerPlayerCheckpoint;
  worldDistance: number;
  randomSeed: number;
  obstacleCursor: number;
  obstaclePending: readonly Readonly<{ atMeters: number; definition: HazardDefinition }>[];
  obstacleWarnedKinds: readonly HazardDefinition['kind'][];
  obstacleSkipPatternAfterDoubleJump: boolean;
  pickupCursor: number;
  pickupHorizonMeters: number;
  pickupStageId: StoryStageId | null;
  createdGateDistances: readonly number[];
  pitCursor: number;
  entities: readonly RunnerWorldEntityCheckpoint[];
  collectedPickupIds: readonly string[];
  passedGateIds: readonly string[];
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
  presentation?: Readonly<{
    settlement: SettlementResult;
    newlyUnlockedAchievementIds: readonly string[];
    achievementBonusCoins: number;
  }>;
}>;

type RunnerSessionEnvelopeBase = Readonly<{
  schemaVersion: 1;
  savedAt: string;
  accountScope: RunnerSessionScope;
  runId: string;
}>;

export type RunnerSessionEnvelope =
  | (RunnerSessionEnvelopeBase & Readonly<{ kind: 'active'; payload: RunnerActiveSession }>)
  | (RunnerSessionEnvelopeBase & Readonly<{ kind: 'terminal'; payload: RunnerTerminalSession }>);
