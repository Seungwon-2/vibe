export const CHARACTER_IDS = ['player-default', 'goth-student', 'cogane-rang', 'hanayo-hiyori', 'tokino-mary'] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];
export const STORY_STAGE_IDS = ['dawn-city', 'moonlit-forest', 'crystal-mine', 'cloud-skyway'] as const;
export type StoryStageId = (typeof STORY_STAGE_IDS)[number];
export type RunMode = 'endless' | 'story';
export type FinishReason = 'timeout' | 'pit' | 'lives-exhausted' | 'stage-complete';

export type RunSubmission = Readonly<{
  runId: string;
  characterId: CharacterId;
  mode: RunMode;
  storyStageId: StoryStageId | null;
  distanceMeters: number;
  coins: number;
  durationMs: number;
  finishedAtIso: string;
  finishReason: FinishReason;
  hitsTaken: number;
  passedGateCount: number;
  completedStage: boolean;
}>;
export type RunHistoryRow = Omit<RunSubmission, 'runId'> & { runId: string };
export type RunHistoryPage = Readonly<{ items: readonly RunHistoryRow[]; nextCursor: string | null }>;
export type PublicBestRow = Readonly<{
  rank: number;
  displayName: string;
  characterId: CharacterId;
  distanceMeters: number;
  coins: number;
  finishedAtIso: string;
}>;
export type PlayerProfileDto = Readonly<{
  version: 1;
  walletCoins: number;
  unlockedCharacterIds: readonly CharacterId[];
  unlockedStageIds: readonly StoryStageId[];
  clearedStageIds: readonly StoryStageId[];
  completedChallengeKeys: readonly string[];
  achievementProgress: Readonly<Record<string, number>>;
  unlockedAchievementIds: readonly string[];
  unlockedCosmeticIds: readonly string[];
  equippedCosmeticIdsByCharacter: Readonly<Record<string, readonly string[]>>;
  processedRunIds: readonly string[];
  claimedRewardKeys: readonly string[];
}>;
export type SubmitRunResponse = Readonly<{
  savedRun: RunHistoryRow;
  personalBest: PublicBestRow | null;
  personalBestUpdated: boolean;
}>;
export type ApiError = Readonly<{ code: string; message: string; correlationId: string }>;

export type PlayerPrincipal = Readonly<{ playerId: string; displayName: string }>;
export type ProfileDocument = Readonly<{
  id: 'profile'; playerId: string; kind: 'profile'; schemaVersion: 1; updatedAtIso: string; profile: PlayerProfileDto;
}>;
export type RunDocument = Readonly<{
  id: string; playerId: string; kind: 'run'; schemaVersion: 1; run: RunSubmission; receivedAtIso: string;
  serverOutcome: 'accepted';
}>;
export type LeaderboardBestDocument = Readonly<{
  id: 'leaderboard-best'; playerId: string; kind: 'leaderboardBest'; schemaVersion: 1; displayName: string;
  bestRunId: string; characterId: CharacterId; distanceMeters: number; coins: number; finishedAtIso: string;
  updatedAtIso: string;
}>;
export type PlayerDocument = ProfileDocument | RunDocument | LeaderboardBestDocument;
