import type { HttpRequest } from '@azure/functions';
import { CHARACTER_IDS, STORY_STAGE_IDS, type CharacterId, type FinishReason, type PlayerProfileDto,
  type RunSubmission, type StoryStageId } from './contracts.js';
import { ApiException } from './errors.js';

const FINISH_REASONS: readonly FinishReason[] = ['timeout', 'pit', 'lives-exhausted', 'stage-complete'];
const ISO_UTC = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/;
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function integer(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number {
  return Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
}
function exactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
export function validateRunSubmission(value: unknown): RunSubmission {
  const keys = ['runId', 'characterId', 'mode', 'storyStageId', 'distanceMeters', 'coins', 'durationMs',
    'finishedAtIso', 'finishReason', 'hitsTaken', 'passedGateCount', 'completedStage'];
  if (!object(value) || !exactKeys(value, keys) || typeof value.runId !== 'string' || !ID.test(value.runId) ||
      !CHARACTER_IDS.includes(value.characterId as CharacterId) || (value.mode !== 'endless' && value.mode !== 'story') ||
      !integer(value.distanceMeters, 0, 10_000_000) || !integer(value.coins, 0, 1_000_000) ||
      !integer(value.durationMs, 0, 24 * 60 * 60 * 1000) || typeof value.finishedAtIso !== 'string' ||
      !ISO_UTC.test(value.finishedAtIso) || !Number.isFinite(Date.parse(value.finishedAtIso)) ||
      new Date(value.finishedAtIso).toISOString() !== value.finishedAtIso ||
      !FINISH_REASONS.includes(value.finishReason as FinishReason) || !integer(value.hitsTaken, 0, 100_000) ||
      !integer(value.passedGateCount, 0, 10_000) || typeof value.completedStage !== 'boolean') {
    throw new ApiException(400, 'INVALID_RUN', 'INVALID_RUN');
  }
  if ((value.mode === 'story' && (!STORY_STAGE_IDS.includes(value.storyStageId as StoryStageId))) ||
      (value.mode === 'endless' && value.storyStageId !== null) ||
      (value.mode === 'endless' && value.completedStage) ||
      (value.completedStage && (value.mode !== 'story' || value.finishReason !== 'stage-complete')) ||
      (value.finishReason === 'stage-complete' && !value.completedStage)) {
    throw new ApiException(400, 'INVALID_RUN_MODE', 'INVALID_RUN_MODE');
  }
  const durationSeconds = Math.max(value.durationMs / 1000, 0.1);
  // Permit 2.5x boosts plus 25% measurement/network tolerance; this is plausibility filtering, not anti-cheat.
  if (value.distanceMeters > durationSeconds * (393.25 / 3) * 2.5 * 1.25 + 200) {
    throw new ApiException(400, 'IMPLAUSIBLE_RUN', 'IMPLAUSIBLE_RUN');
  }
  return value as unknown as RunSubmission;
}

export async function readJson(request: HttpRequest): Promise<unknown> {
  try { return await request.json(); }
  catch { throw new ApiException(400, 'INVALID_JSON', 'INVALID_JSON'); }
}

export function parseHistoryQuery(request: HttpRequest): { limit: number; cursor: string | null } {
  const rawLimit = request.query.get('limit');
  const rawCursor = request.query.get('cursor');
  if (rawLimit !== null && !/^\d+$/.test(rawLimit)) throw new ApiException(400, 'INVALID_LIMIT', 'INVALID_LIMIT');
  if (rawCursor && rawCursor.length > 4096) throw new ApiException(400, 'INVALID_CURSOR', 'INVALID_CURSOR');
  const limit = rawLimit === null ? 20 : Math.min(50, Math.max(1, Number(rawLimit)));
  return { limit, cursor: rawCursor || null };
}

export function validateProfileUpdate(value: unknown, current: PlayerProfileDto): PlayerProfileDto {
  if (!object(value) || !exactKeys(value, ['equippedCosmeticIdsByCharacter']) || !object(value.equippedCosmeticIdsByCharacter)) {
    throw new ApiException(400, 'INVALID_PROFILE_UPDATE', 'INVALID_PROFILE_UPDATE');
  }
  const equipped: Record<string, readonly string[]> = { ...current.equippedCosmeticIdsByCharacter };
  for (const [characterId, ids] of Object.entries(value.equippedCosmeticIdsByCharacter)) {
    if (!CHARACTER_IDS.includes(characterId as CharacterId) || !Array.isArray(ids) || ids.length > 8 ||
        !ids.every((id) => typeof id === 'string' && id.length <= 100 && current.unlockedCosmeticIds.includes(id)) ||
        new Set(ids).size !== ids.length) {
      throw new ApiException(400, 'INVALID_EQUIPMENT', 'INVALID_EQUIPMENT');
    }
    equipped[characterId] = ids as string[];
  }
  return { ...current, equippedCosmeticIdsByCharacter: equipped };
}
