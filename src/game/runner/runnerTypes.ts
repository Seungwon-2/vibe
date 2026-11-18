import type { CharacterId } from '../characters/characterTypes';

export type RunnerPhase = 'countdown' | 'running' | 'paused' | 'finished';
export type RunnerFinishOutcome = 'personal-best' | 'completed';
export type RunnerFinishReason = 'timeout' | 'pit' | 'lives-exhausted' | 'stage-complete';
export type RunnerMode = 'endless' | 'story';
export type RunnerVisualMode = 'calm' | 'standard';
export type RunnerPickupKind = 'coin' | 'time' | 'giant' | 'speed';
export type StoryStageId = 'dawn-city' | 'moonlit-forest' | 'crystal-mine' | 'cloud-skyway';
export type StoryCourseRevision = 1 | 2;
export type RunnerBiomeId = StoryStageId | 'starlight-rainbow';
export type StoryChallengeId = 'no-hit' | 'coin-target';
export type RunnerGateId = `gate-${number}`;

export type RunnerSnapshot = Readonly<{
  phase: RunnerPhase;
  characterId: CharacterId;
  /** Optional during migration; populated by the mode-aware simulation task. */
  mode?: RunnerMode;
  storyStageId?: StoryStageId | null;
  /** Saves without a revision still use the original layout. */
  storyCourseRevision?: StoryCourseRevision;
  livesRemaining?: number;
  nearMissScore?: number;
  hitsTaken?: number;
  stageSpeedBoostRemainingMs?: number;
  speedPickupRemainingMs: number;
  elapsedMs: number;
  remainingMs: number;
  distanceMeters: number;
  worldDistance: number;
  speedUnitsPerSecond: number;
  coins: number;
  giantRemainingMs: number;
  /** Ordinary-hazard protection after natural expiry; absent in legacy saves. */
  giantRecoveryRemainingMs?: number;
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
