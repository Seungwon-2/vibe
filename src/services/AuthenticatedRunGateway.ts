import { CHARACTERS } from '../game/characters/characterCatalog';
import type { CharacterId } from '../game/characters/characterTypes';
import type { RunnerFinishReason, RunnerMode, RunnerResult, StoryStageId } from '../game/runner/runnerTypes';
import type { PersonalBestRecord, PersonalRunHistoryPage, PersonalRunHistoryRecord,
  PublicLeaderboardRecord, RunGateway, RunSubmissionReceipt } from './RunGateway';

export class RunApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); this.name = 'RunApiError'; }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && CHARACTERS.some((item) => item.id === value);
}
function isDate(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)); }
function isReason(value: unknown): value is RunnerFinishReason {
  return value === 'timeout' || value === 'pit' || value === 'lives-exhausted' || value === 'stage-complete';
}
function isMode(value: unknown): value is RunnerMode { return value === 'endless' || value === 'story'; }
function isStoryStageId(value: unknown): value is StoryStageId {
  return value === 'dawn-city' || value === 'moonlit-forest' || value === 'crystal-mine' || value === 'cloud-skyway';
}
function validPublicRecord(value: unknown): value is PublicLeaderboardRecord {
  if (!isObject(value)) return false;
  // Allow only the public projection fields, so future server fields cannot leak by accident.
  const allowedKeys = new Set(['rank', 'displayName', 'characterId', 'distanceMeters', 'coins', 'finishedAtIso']);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false;
  return Number.isSafeInteger(value.rank) && (value.rank as number) > 0 &&
    typeof value.displayName === 'string' && value.displayName.trim().length > 0 &&
    isCharacterId(value.characterId) && Number.isSafeInteger(value.distanceMeters) &&
    (value.distanceMeters as number) >= 0 && Number.isSafeInteger(value.coins) &&
    (value.coins as number) >= 0 && isDate(value.finishedAtIso);
}
function validHistoryRecord(value: unknown): value is PersonalRunHistoryRecord {
  if (!isObject(value)) return false;
  const validStage = value.mode === 'story'
    ? isStoryStageId(value.storyStageId)
    : value.mode === 'endless' && value.storyStageId === null;
  return typeof value.id === 'string' && value.id.length > 0 && isCharacterId(value.characterId) &&
    isMode(value.mode) && validStage &&
    Number.isSafeInteger(value.distanceMeters) && (value.distanceMeters as number) >= 0 &&
    Number.isSafeInteger(value.coins) && (value.coins as number) >= 0 &&
    Number.isFinite(value.durationMs) && (value.durationMs as number) >= 0 && isDate(value.finishedAtIso) &&
    isReason(value.finishReason) && Number.isSafeInteger(value.hitsTaken) && (value.hitsTaken as number) >= 0 &&
    Number.isSafeInteger(value.passedGateCount) && (value.passedGateCount as number) >= 0 &&
    typeof value.completedStage === 'boolean';
}
function parsePublic(value: unknown): PublicLeaderboardRecord {
  if (!validPublicRecord(value)) throw new TypeError('Invalid public leaderboard DTO');
  return { rank: value.rank as number, displayName: (value.displayName as string).trim() || 'Runner',
    characterId: value.characterId, distanceMeters: value.distanceMeters as number,
    coins: value.coins as number, finishedAtIso: value.finishedAtIso as string };
}
function parseHistoryPage(value: unknown): PersonalRunHistoryPage {
  if (!isObject(value) || !Array.isArray(value.items) ||
      !(value.nextCursor === null || typeof value.nextCursor === 'string') || !value.items.every(validHistoryRecord)) {
    throw new TypeError('Invalid personal run-history DTO');
  }
  return { items: value.items as PersonalRunHistoryRecord[], nextCursor: value.nextCursor as string | null };
}
function parseReceipt(value: unknown): RunSubmissionReceipt {
  if (!isObject(value) || !validHistoryRecord(value.savedRun) ||
      !(value.personalBest === null || validPublicRecord(value.personalBest)) ||
      typeof value.personalBestUpdated !== 'boolean') throw new TypeError('Invalid run-submission DTO');
  return { savedRun: value.savedRun as PersonalRunHistoryRecord,
    personalBest: value.personalBest === null ? null : parsePublic(value.personalBest),
    personalBestUpdated: value.personalBestUpdated };
}

export class AuthenticatedRunGateway implements RunGateway {
  private readonly baseUrl: string;
  constructor(baseUrl: string, private readonly acquireToken: () => Promise<string>, private readonly fetcher: typeof fetch = fetch) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }
  async getBest(): Promise<PersonalBestRecord | null> {
    const value = await this.request('/runs/best');
    return value === null ? null : parsePublic(value);
  }
  async getRanking(): Promise<PublicLeaderboardRecord[]> {
    const value: unknown = await this.request('/leaderboard');
    if (!Array.isArray(value)) throw new TypeError('Invalid public leaderboard response');
    return value.map(parsePublic);
  }
  async getPersonalHistory(options: { limit?: number; cursor?: string | null } = {}): Promise<PersonalRunHistoryPage> {
    const query = new URLSearchParams();
    if (options.limit !== undefined) query.set('limit', String(options.limit));
    if (options.cursor) query.set('cursor', options.cursor);
    return parseHistoryPage(await this.request(`/runs${query.size ? `?${query.toString()}` : ''}`));
  }
  async submitRun(result: RunnerResult): Promise<RunSubmissionReceipt> {
    return parseReceipt(await this.request('/runs', { method: 'POST', body: JSON.stringify(result) }));
  }
  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    const token = await this.acquireToken();
    let response: Response;
    try {
      response = await this.fetcher(`${this.baseUrl}${path}`, {
        ...init,
        headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...init.headers, Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      throw new RunApiError(0, error instanceof Error ? error.message : 'Network request failed');
    }
    if (!response.ok) {
      const message = response.status === 401 ? '다시 로그인해야 합니다.'
        : response.status === 403 ? '이 데이터에 접근할 권한이 없습니다.'
          : response.status >= 500 ? '서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.'
            : `API request failed (${response.status})`;
      throw new RunApiError(response.status, message);
    }
    if (response.status === 204) return null;
    return response.json() as Promise<unknown>;
  }
}
