import { CHARACTERS } from '../game/characters/characterCatalog';
import type { CharacterId } from '../game/characters/characterTypes';
import type { RunnerFinishReason, RunnerMode, RunnerResult, StoryStageId } from '../game/runner/runnerTypes';
import type { PersonalBestRecord, PersonalRunHistoryPage, PersonalRunHistoryRecord,
  PublicLeaderboardRecord, RunGateway, RunSubmissionReceipt } from './RunGateway';

export const RUN_RECORDS_STORAGE_KEY = 'running-action:records:v1';
const MAX_RECORDS = 10;
type StoredRun = PersonalRunHistoryRecord;
type RunRecordSnapshot = Readonly<{ version: 1; records: StoredRun[] }>;
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
let fallbackIdSequence = 0;

function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && CHARACTERS.some((character) => character.id === value);
}
function isMode(value: unknown): value is RunnerMode { return value === 'endless' || value === 'story'; }
function isFinishReason(value: unknown): value is RunnerFinishReason {
  return value === 'timeout' || value === 'pit' || value === 'lives-exhausted' || value === 'stage-complete';
}
function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
function normalizeLegacyRecord(value: unknown): StoredRun | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<PersonalRunHistoryRecord> & { id?: unknown; characterId?: unknown;
    distanceMeters?: unknown; coins?: unknown; durationMs?: unknown; finishedAtIso?: unknown };
  if (typeof item.id !== 'string' || !item.id || !isCharacterId(item.characterId) ||
      !Number.isSafeInteger(item.distanceMeters) || (item.distanceMeters as number) < 0 ||
      !Number.isSafeInteger(item.coins) || (item.coins as number) < 0 ||
      !Number.isFinite(item.durationMs) || (item.durationMs as number) < 0 || !isIsoTimestamp(item.finishedAtIso)) return null;
  // Existing v1 browser records predate mode-aware history. Treat them as endless runs.
  const mode = isMode(item.mode) ? item.mode : 'endless';
  const finishReason = isFinishReason(item.finishReason) ? item.finishReason : 'timeout';
  return {
    id: item.id,
    characterId: item.characterId,
    mode,
    storyStageId: mode === 'story' && typeof item.storyStageId === 'string' ? item.storyStageId as StoryStageId : null,
    distanceMeters: item.distanceMeters as number,
    coins: item.coins as number,
    durationMs: item.durationMs as number,
    finishedAtIso: item.finishedAtIso,
    finishReason,
    hitsTaken: Number.isSafeInteger(item.hitsTaken) && (item.hitsTaken as number) >= 0 ? item.hitsTaken as number : 0,
    passedGateCount: Number.isSafeInteger(item.passedGateCount) && (item.passedGateCount as number) >= 0 ? item.passedGateCount as number : 0,
    completedStage: item.completedStage === true,
  };
}
function parseSnapshot(raw: string): RunRecordSnapshot {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || (parsed as { version?: unknown }).version !== 1 ||
      !Array.isArray((parsed as { records?: unknown }).records)) throw new TypeError('Invalid runner records snapshot');
  const records = (parsed as { records: unknown[] }).records.map(normalizeLegacyRecord);
  if (records.some((record) => record === null)) throw new TypeError('Invalid runner record');
  const normalized = records as StoredRun[];
  if (new Set(normalized.map((record) => record.id)).size !== normalized.length) throw new TypeError('Duplicate runner record ID');
  return { version: 1, records: normalized };
}
function compareRecords(left: StoredRun, right: StoredRun): number {
  return right.distanceMeters - left.distanceMeters || right.coins - left.coins ||
    left.finishedAtIso.localeCompare(right.finishedAtIso) || left.id.localeCompare(right.id);
}
function createRunId(): string {
  try { const uuid = globalThis.crypto?.randomUUID?.(); if (uuid) return uuid; } catch { /* restricted browser crypto */ }
  fallbackIdSequence += 1;
  return `run-${Date.now().toString(36)}-${fallbackIdSequence.toString(36)}`;
}
function toPublicRecord(record: StoredRun, rank: number): PublicLeaderboardRecord {
  return { rank, displayName: 'Local Player', characterId: record.characterId,
    distanceMeters: record.distanceMeters, coins: record.coins, finishedAtIso: record.finishedAtIso };
}
function validateResult(result: RunnerResult): number {
  if (!result || !isCharacterId(result.characterId) || !Number.isFinite(result.distanceMeters) || result.distanceMeters < 0 ||
      !Number.isSafeInteger(result.coins) || result.coins < 0 || !Number.isFinite(result.durationMs) || result.durationMs < 0 ||
      !isIsoTimestamp(result.finishedAtIso)) throw new TypeError('Invalid runner result for local ranking');
  const distance = Math.round(result.distanceMeters);
  if (!Number.isSafeInteger(distance)) throw new TypeError('Runner distance exceeds the supported integer range');
  return distance;
}

export class LocalRunGateway implements RunGateway {
  private records: StoredRun[] = [];
  private loaded = false;
  constructor(private readonly storage?: StorageLike | null) {}

  async getBest(): Promise<PersonalBestRecord | null> {
    const best = this.load().filter((record) => record.mode === 'endless').sort(compareRecords)[0];
    return best ? toPublicRecord(best, 1) : null;
  }
  async getRanking(): Promise<PublicLeaderboardRecord[]> {
    return this.load().filter((record) => record.mode === 'endless').sort(compareRecords)
      .map((record, index) => toPublicRecord(record, index + 1));
  }
  async getPersonalHistory(options: { limit?: number; cursor?: string | null } = {}): Promise<PersonalRunHistoryPage> {
    const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 20)));
    const records = [...this.load()].sort((left, right) => right.finishedAtIso.localeCompare(left.finishedAtIso));
    const cursorIndex = options.cursor ? records.findIndex((record) => record.id === options.cursor) + 1 : 0;
    const start = cursorIndex > 0 ? cursorIndex : 0;
    const items = records.slice(start, start + limit);
    return { items, nextCursor: start + limit < records.length ? items.at(-1)?.id ?? null : null };
  }
  async submitRun(result: RunnerResult): Promise<RunSubmissionReceipt> {
    const distanceMeters = validateResult(result);
    const mode = result.mode ?? 'endless';
    const submitted: StoredRun = {
      id: createRunId(), characterId: result.characterId, mode,
      storyStageId: mode === 'story' ? result.storyStageId ?? null : null,
      distanceMeters, coins: result.coins, durationMs: result.durationMs,
      finishedAtIso: result.finishedAtIso, finishReason: result.finishReason,
      hitsTaken: result.hitsTaken ?? 0, passedGateCount: result.passedGateCount ?? 0,
      completedStage: result.completedStage ?? result.finishReason === 'stage-complete',
    };
    this.records = [...this.load(), submitted].sort((a, b) => b.finishedAtIso.localeCompare(a.finishedAtIso)).slice(0, MAX_RECORDS);
    this.persist();
    const endless = this.load().filter((record) => record.mode === 'endless').sort(compareRecords);
    const rank = endless.findIndex((record) => record.id === submitted.id) + 1;
    const personalBest = endless[0] ? toPublicRecord(endless[0], 1) : null;
    return { savedRun: submitted, personalBest, personalBestUpdated: mode === 'endless' && rank === 1 };
  }
  private load(): StoredRun[] {
    if (this.loaded) return this.records;
    this.loaded = true;
    try {
      const raw = this.getStorage()?.getItem(RUN_RECORDS_STORAGE_KEY);
      if (raw) this.records = parseSnapshot(raw).records.slice().sort((a, b) => b.finishedAtIso.localeCompare(a.finishedAtIso)).slice(0, MAX_RECORDS);
    } catch { this.records = []; }
    return this.records;
  }
  private persist(): void {
    try { this.getStorage()?.setItem(RUN_RECORDS_STORAGE_KEY, JSON.stringify({ version: 1, records: this.records } satisfies RunRecordSnapshot)); }
    catch { /* Keep in-memory records available if browser storage is blocked/full. */ }
  }
  private getStorage(): StorageLike | null {
    if (this.storage !== undefined) return this.storage;
    try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
  }
}

export const browserRunGateway: RunGateway = new LocalRunGateway();
