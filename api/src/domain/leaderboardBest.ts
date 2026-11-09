import type { LeaderboardBestDocument, PublicBestRow, RunSubmission } from '../shared/contracts.js';

export function comparePersonalBest(left: Pick<RunSubmission, 'distanceMeters' | 'coins' | 'finishedAtIso' | 'runId'>,
  right: Pick<RunSubmission, 'distanceMeters' | 'coins' | 'finishedAtIso' | 'runId'>): number {
  return right.distanceMeters - left.distanceMeters || right.coins - left.coins ||
    left.finishedAtIso.localeCompare(right.finishedAtIso) || left.runId.localeCompare(right.runId);
}

export function toLeaderboardBest(playerId: string, displayName: string, run: RunSubmission,
  updatedAtIso: string): LeaderboardBestDocument {
  return {
    id: 'leaderboard-best', playerId, kind: 'leaderboardBest', schemaVersion: 1,
    displayName: displayName.trim().slice(0, 80) || 'Runner', bestRunId: run.runId,
    characterId: run.characterId, distanceMeters: run.distanceMeters, coins: run.coins,
    finishedAtIso: run.finishedAtIso, updatedAtIso,
  };
}

export function compareBestDocuments(left: LeaderboardBestDocument, right: LeaderboardBestDocument): number {
  return comparePersonalBest({ ...left, runId: left.bestRunId }, { ...right, runId: right.bestRunId });
}

export function compareRunToBest(run: RunSubmission, best: LeaderboardBestDocument): number {
  return comparePersonalBest(run, { distanceMeters: best.distanceMeters, coins: best.coins,
    finishedAtIso: best.finishedAtIso, runId: best.bestRunId });
}

export function toPublicBest(document: LeaderboardBestDocument, rank: number): PublicBestRow {
  return { rank, displayName: document.displayName, characterId: document.characterId,
    distanceMeters: document.distanceMeters, coins: document.coins, finishedAtIso: document.finishedAtIso };
}
