import { CHARACTERS } from '../game/characters/characterCatalog';
import type { CharacterId } from '../game/characters/characterTypes';
import type { RunnerResult } from '../game/runner/runnerTypes';
import type { RankedRunRecord, RunGateway, RunRecord } from './RunGateway';

export const RUN_RECORDS_STORAGE_KEY = 'running-action:records:v1';
const MAX_RECORDS = 10;

type RunRecordSnapshot = Readonly<{ version: 1; records: RunRecord[] }>;
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
let fallbackIdSequence = 0;

function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && CHARACTERS.some((character) => character.id === value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function isValidRecord(value: unknown): value is RunRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<RunRecord>;
  return typeof record.id === 'string' && record.id.length > 0 &&
    isCharacterId(record.characterId) &&
    Number.isSafeInteger(record.distanceMeters) && record.distanceMeters! >= 0 &&
    Number.isSafeInteger(record.coins) && record.coins! >= 0 &&
    Number.isFinite(record.durationMs) && record.durationMs! >= 0 &&
    isIsoTimestamp(record.finishedAtIso);
}

function parseSnapshot(raw: string): RunRecordSnapshot {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' ||
      (parsed as { version?: unknown }).version !== 1 ||
      !Array.isArray((parsed as { records?: unknown }).records)) {
    throw new TypeError('Invalid runner records snapshot');
  }
  const records = (parsed as { records: unknown[] }).records;
  if (records.some((record) => !isValidRecord(record))) {
    throw new TypeError('Invalid runner record');
  }
  const ids = records.map((record) => (record as RunRecord).id);
  if (new Set(ids).size !== ids.length) throw new TypeError('Duplicate runner record ID');
  return { version: 1, records: records as RunRecord[] };
}

function compareRecords(left: RunRecord, right: RunRecord): number {
  return right.distanceMeters - left.distanceMeters ||
    right.coins - left.coins ||
    left.finishedAtIso.localeCompare(right.finishedAtIso) ||
    left.id.localeCompare(right.id);
}

function rankRecords(records: readonly RunRecord[]): RankedRunRecord[] {
  return [...records].sort(compareRecords).map((record, index) => ({ ...record, rank: index + 1 }));
}

function createRunId(): string {
  try {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid) return uuid;
  } catch {
    // Some restricted browser contexts expose crypto but deny randomUUID.
  }
  fallbackIdSequence += 1;
  return `run-${Date.now().toString(36)}-${fallbackIdSequence.toString(36)}`;
}

function validateResult(result: RunnerResult): number {
  if (!result || !isCharacterId(result.characterId) ||
      !Number.isFinite(result.distanceMeters) || result.distanceMeters < 0 ||
      !Number.isSafeInteger(result.coins) || result.coins < 0 ||
      !Number.isFinite(result.durationMs) || result.durationMs < 0 ||
      !isIsoTimestamp(result.finishedAtIso)) {
    throw new TypeError('Invalid runner result for local ranking');
  }
  const distanceMeters = Math.round(result.distanceMeters);
  if (!Number.isSafeInteger(distanceMeters)) {
    throw new TypeError('Runner distance exceeds the supported integer range');
  }
  return distanceMeters;
}

export class LocalRunGateway implements RunGateway {
  private records: RunRecord[] = [];
  private loaded = false;

  constructor(private readonly storage?: StorageLike | null) {}

  async getBest(): Promise<RankedRunRecord | null> {
    return rankRecords(this.load())[0] ?? null;
  }

  async getRanking(): Promise<RankedRunRecord[]> {
    return rankRecords(this.load());
  }

  async submitRun(result: RunnerResult): Promise<RankedRunRecord> {
    const distanceMeters = validateResult(result);
    const current = this.load();
    const submitted: RunRecord = {
      id: createRunId(),
      characterId: result.characterId,
      distanceMeters,
      coins: result.coins,
      durationMs: result.durationMs,
      finishedAtIso: result.finishedAtIso,
    };
    const sorted = rankRecords([...current, submitted]);
    const candidateRank = sorted.find((record) => record.id === submitted.id)!.rank;
    this.records = sorted.slice(0, MAX_RECORDS).map((record) => ({
      id: record.id,
      characterId: record.characterId,
      distanceMeters: record.distanceMeters,
      coins: record.coins,
      durationMs: record.durationMs,
      finishedAtIso: record.finishedAtIso,
    }));
    this.persist();
    // Rank 11 means the submitted result falls outside the stored/displayed top ten.
    return { ...submitted, rank: Math.min(candidateRank, MAX_RECORDS + 1) };
  }

  private load(): RunRecord[] {
    if (this.loaded) return this.records;
    this.loaded = true;
    try {
      const raw = this.getStorage()?.getItem(RUN_RECORDS_STORAGE_KEY);
      if (raw) this.records = parseSnapshot(raw).records.slice().sort(compareRecords).slice(0, MAX_RECORDS);
    } catch {
      this.records = [];
    }
    return this.records;
  }

  private persist(): void {
    try {
      this.getStorage()?.setItem(RUN_RECORDS_STORAGE_KEY,
        JSON.stringify({ version: 1, records: this.records } satisfies RunRecordSnapshot));
    } catch {
      // Keep the in-memory records usable for this tab if browser storage is blocked or full.
    }
  }

  private getStorage(): StorageLike | null {
    if (this.storage !== undefined) return this.storage;
    try {
      return typeof window === 'undefined' ? null : window.localStorage;
    } catch {
      return null;
    }
  }
}

// Safe to construct during SSR; localStorage is accessed lazily on first use.
export const browserRunGateway: RunGateway = new LocalRunGateway();
