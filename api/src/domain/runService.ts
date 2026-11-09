import type { LeaderboardBestDocument, PlayerPrincipal, PublicBestRow, RunDocument,
  RunHistoryPage, RunSubmission, SubmitRunResponse } from '../shared/contracts.js';
import { ApiException } from '../shared/errors.js';
import { assertStoryStageUnlocked, settleRunOnce } from './settleRun.js';
import { compareBestDocuments, compareRunToBest, toLeaderboardBest, toPublicBest } from './leaderboardBest.js';
import type { RunnerRepository } from '../data/cosmosRepository.js';

const MAX_SAVE_ATTEMPTS = 3;
function toHistory(document: RunDocument): RunSubmission {
  return document.run;
}
function rankOf(rows: readonly LeaderboardBestDocument[], playerId: string): PublicBestRow | null {
  const ordered = [...rows].sort(compareBestDocuments);
  const index = ordered.findIndex((row) => row.playerId === playerId);
  return index < 0 ? null : toPublicBest(ordered[index]!, index + 1);
}
function sameSubmission(left: RunSubmission, right: RunSubmission): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class RunService {
  constructor(private readonly repository: RunnerRepository, private readonly now: () => Date = () => new Date()) {}

  async submit(principal: PlayerPrincipal, run: RunSubmission): Promise<SubmitRunResponse> {
    const duplicate = await this.repository.getRun(principal.playerId, run.runId);
    if (duplicate) {
      if (!sameSubmission(duplicate.run, run)) throw new ApiException(409, 'RUN_ID_REUSED', 'RUN_ID_REUSED');
      return { savedRun: toHistory(duplicate), personalBest: await this.currentPublicBest(principal.playerId), personalBestUpdated: false };
    }
    for (let attempt = 0; attempt < MAX_SAVE_ATTEMPTS; attempt += 1) {
      const existingRun = await this.repository.getRun(principal.playerId, run.runId);
      if (existingRun) {
        if (!sameSubmission(existingRun.run, run)) throw new ApiException(409, 'RUN_ID_REUSED', 'RUN_ID_REUSED');
        return { savedRun: toHistory(existingRun), personalBest: await this.currentPublicBest(principal.playerId), personalBestUpdated: false };
      }
      const currentProfile = await this.repository.ensureProfile(principal.playerId);
      if (!currentProfile.value.profile.unlockedCharacterIds.includes(run.characterId)) {
        throw new ApiException(403, 'CHARACTER_LOCKED', 'CHARACTER_LOCKED');
      }
      if (run.mode === 'story' && run.storyStageId) assertStoryStageUnlocked(currentProfile.value.profile, run.storyStageId);
      const currentBest = await this.repository.getBest(principal.playerId);
      const nextProfile = settleRunOnce(currentProfile.value.profile, run);
      const timestamp = this.now().toISOString();
      const nextProfileDocument = { ...currentProfile.value, updatedAtIso: timestamp, profile: nextProfile };
      let nextBest: LeaderboardBestDocument | null = null;
      let personalBestUpdated = false;
      if (run.mode === 'endless') {
        const candidate = toLeaderboardBest(principal.playerId, principal.displayName, run, timestamp);
        if (!currentBest || compareRunToBest(run, currentBest.value) < 0) {
          nextBest = candidate;
          personalBestUpdated = true;
        } else if (currentBest.value.displayName !== principal.displayName) {
          nextBest = { ...currentBest.value, displayName: principal.displayName.trim().slice(0, 80) || 'Runner', updatedAtIso: timestamp };
        }
      } else if (currentBest && currentBest.value.displayName !== principal.displayName) {
        nextBest = { ...currentBest.value, displayName: principal.displayName.trim().slice(0, 80) || 'Runner', updatedAtIso: timestamp };
      }
      const runDocument: RunDocument = { id: `run:${run.runId}`, playerId: principal.playerId, kind: 'run',
        schemaVersion: 1, run, receivedAtIso: timestamp, serverOutcome: 'accepted' };
      try {
        await this.repository.commitRun(runDocument, nextProfileDocument, currentProfile.etag,
          nextBest, currentBest?.etag ?? null);
        const rows = await this.repository.listBestProjections();
        return { savedRun: run, personalBest: rankOf(rows, principal.playerId), personalBestUpdated };
      } catch (error) {
        if (!(error instanceof ApiException) || error.code !== 'SUBMISSION_CONFLICT') throw error;
        const committed = await this.repository.getRun(principal.playerId, run.runId);
        if (committed) {
          if (!sameSubmission(committed.run, run)) throw new ApiException(409, 'RUN_ID_REUSED', 'RUN_ID_REUSED');
          return { savedRun: run, personalBest: await this.currentPublicBest(principal.playerId), personalBestUpdated: false };
        }
        if (attempt === MAX_SAVE_ATTEMPTS - 1) throw new ApiException(503, 'SAVE_RETRY', 'SAVE_RETRY');
      }
    }
    throw new ApiException(503, 'SAVE_RETRY', 'SAVE_RETRY');
  }

  async history(principal: PlayerPrincipal, limit: number, cursor: string | null): Promise<RunHistoryPage> {
    const page = await this.repository.getRunHistory(principal.playerId, limit, cursor);
    return { items: page.items.map((item) => toHistory(item)), nextCursor: page.nextCursor };
  }
  async best(principal: PlayerPrincipal): Promise<PublicBestRow | null> {
    return this.currentPublicBest(principal.playerId);
  }
  async leaderboard(limit: number): Promise<PublicBestRow[]> {
    const rows = (await this.repository.listBestProjections()).sort(compareBestDocuments).slice(0, limit);
    return rows.map((row, index) => toPublicBest(row, index + 1));
  }
  private async currentPublicBest(playerId: string): Promise<PublicBestRow | null> {
    const rows = await this.repository.listBestProjections();
    return rankOf(rows, playerId);
  }
}
