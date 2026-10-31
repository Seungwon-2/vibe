import type { CharacterId } from '../characters/characterTypes';

export type RunnerPhase = 'countdown' | 'running' | 'paused' | 'finished';
export type RunnerFinishOutcome = 'personal-best' | 'completed';
export type RunnerFinishReason = 'timeout' | 'pit' | 'lives-exhausted' | 'stage-complete';
export type RunnerMode = 'endless' | 'story';
export type RunnerPickupKind = 'coin' | 'time' | 'giant';
export type RunnerBiomeId = 'dawn-city' | 'moonlit-forest' | 'crystal-mine' | 'cloud-skyway';
export type StoryStageId = RunnerBiomeId;
export type StoryChallengeId = 'no-hit' | 'coin-target';
export type RunnerGateId = 'gate-2000' | 'gate-4000' | 'gate-6000' | 'gate-8000' | 'gate-10000';

export type RunnerSnapshot = Readonly<{
  phase: RunnerPhase;
  characterId: CharacterId;
  /** Optional during migration; populated by the mode-aware simulation task. */
  mode?: RunnerMode;
  storyStageId?: StoryStageId | null;
  livesRemaining?: number;
  nearMissScore?: number;
  hitsTaken?: number;
  stageSpeedBoostRemainingMs?: number;
  elapsedMs: number;
  remainingMs: number;
  distanceMeters: number;
  worldDistance: number;
  speedUnitsPerSecond: number;
  coins: number;
  giantRemainingMs: number;
  collectedPickupIds: readonly string[];
  passedGateIds: readonly RunnerGateId[];
  staggerRemainingMs: number;
  protectionRemainingMs: number;
  passiveChargesRemaining: number;
  passiveEffectRemainingMs: number;
  slideGuardRemainingMs: number;
  slideGuardCooldownRemainingMs: number;
  biomeId: RunnerBiomeId;
  finishedAtElapsedMs: number | null;
  finishReason: RunnerFinishReason | null;
  // The timestamp anchor makes the pure simulation's result reproducible.
  startedAtIso: string;
  finishedAtIso: string | null;
}>;

export type RunnerResult = Readonly<{
  characterId: CharacterId;
  /** Optional during migration; populated by the mode-aware simulation task. */
  mode?: RunnerMode;
  storyStageId?: StoryStageId | null;
  hitsTaken?: number;
  livesRemaining?: number;
  nearMissScore?: number;
  passedGateCount?: number;
  completedStage?: boolean;
  distanceMeters: number;
  coins: number;
  durationMs: number;
  finishedAtIso: string;
  finishReason: RunnerFinishReason;
}>;
