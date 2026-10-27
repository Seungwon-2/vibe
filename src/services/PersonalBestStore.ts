import { CHARACTERS } from '../game/characters/characterCatalog';
import type { CharacterId } from '../game/characters/characterTypes';
import type { RunnerResult } from '../game/runner/runnerTypes';

export type PersonalBest = Readonly<{
  distanceMeters: number;
  coins: number;
  finishedAtIso: string;
}>;

export type PersonalBestSnapshot = Readonly<{
  version: 1;
  bestByCharacter: Partial<Record<CharacterId, PersonalBest>>;
}>;

export type PersonalBestDecision = Readonly<{
  isNewBest: boolean;
  bestDistanceMeters: number;
  previousDistanceMeters: number | null;
}>;

export const PERSONAL_BEST_STORAGE_KEY = 'running-action:personal-best:v1';

function isActiveCharacter(id: unknown): id is CharacterId {
  return typeof id === 'string' && CHARACTERS.some((character) =>
    character.id === id && character.available);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function isValidBest(value: unknown): value is PersonalBest {
  if (!value || typeof value !== 'object') return false;
  const best = value as Partial<PersonalBest>;
  return Number.isSafeInteger(best.distanceMeters) && best.distanceMeters! >= 0 &&
    Number.isSafeInteger(best.coins) && best.coins! >= 0 &&
    isIsoTimestamp(best.finishedAtIso);
}

function parseSnapshot(raw: string): PersonalBestSnapshot {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' ||
      (parsed as { version?: unknown }).version !== 1 ||
      !(parsed as { bestByCharacter?: unknown }).bestByCharacter ||
      typeof (parsed as { bestByCharacter?: unknown }).bestByCharacter !== 'object' ||
      Array.isArray((parsed as { bestByCharacter?: unknown }).bestByCharacter)) {
    throw new TypeError('Invalid personal-best snapshot');
  }
  const entries = Object.entries((parsed as { bestByCharacter: Record<string, unknown> }).bestByCharacter);
  const bestByCharacter: Partial<Record<CharacterId, PersonalBest>> = {};
  for (const [id, value] of entries) {
    if (!isActiveCharacter(id)) continue;
    if (!isValidBest(value)) throw new TypeError(`Invalid personal best for ${id}`);
    bestByCharacter[id] = value;
  }
  return { version: 1, bestByCharacter };
}

export class PersonalBestStore {
  private snapshot: PersonalBestSnapshot = { version: 1, bestByCharacter: {} };
  private loaded = false;

  constructor(private readonly storage?: Pick<Storage, 'getItem' | 'setItem'> | null) {}

  private getStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
    if (this.storage !== undefined) return this.storage;
    try {
      return typeof window === 'undefined' ? null : window.localStorage;
    } catch {
      return null;
    }
  }

  private load(): void {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const raw = this.getStorage()?.getItem(PERSONAL_BEST_STORAGE_KEY);
      if (raw) this.snapshot = parseSnapshot(raw);
    } catch {
      this.snapshot = { version: 1, bestByCharacter: {} };
    }
  }

  getBest(characterId: CharacterId): PersonalBest | null {
    this.load();
    return isActiveCharacter(characterId) ? this.snapshot.bestByCharacter[characterId] ?? null : null;
  }

  record(result: RunnerResult): PersonalBestDecision {
    if (!result || !isActiveCharacter(result.characterId) || !Number.isFinite(result.distanceMeters) ||
        result.distanceMeters < 0 || !Number.isSafeInteger(result.coins) || result.coins < 0 ||
        !Number.isFinite(result.durationMs) || result.durationMs < 0 ||
        !isIsoTimestamp(result.finishedAtIso)) {
      throw new TypeError('Invalid runner result for personal-best storage');
    }
    const distanceMeters = Math.round(result.distanceMeters);
    if (!Number.isSafeInteger(distanceMeters)) {
      throw new TypeError('Runner distance exceeds the supported integer range');
    }
    this.load();
    const previous = this.snapshot.bestByCharacter[result.characterId] ?? null;
    const isNewBest = previous === null || distanceMeters > previous.distanceMeters;
    if (isNewBest) {
      this.snapshot = {
        version: 1,
        bestByCharacter: {
          ...this.snapshot.bestByCharacter,
          [result.characterId]: {
            distanceMeters, coins: result.coins, finishedAtIso: result.finishedAtIso,
          },
        },
      };
      try {
        this.getStorage()?.setItem(PERSONAL_BEST_STORAGE_KEY, JSON.stringify(this.snapshot));
      } catch {
        // Private browsing and quota errors still leave this session's best usable.
      }
    }
    return {
      isNewBest,
      bestDistanceMeters: isNewBest ? distanceMeters : previous!.distanceMeters,
      previousDistanceMeters: previous?.distanceMeters ?? null,
    };
  }
}

// Construction is safe during SSR: browser storage is accessed only on first use.
export const browserPersonalBestStore = new PersonalBestStore();
