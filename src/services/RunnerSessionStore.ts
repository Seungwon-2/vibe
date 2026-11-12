import { CHARACTERS } from '../game/characters/characterCatalog';
import type { CharacterId } from '../game/characters/characterTypes';
import type {
  RunnerActiveSession,
  RunnerEngineCheckpoint,
  RunnerSessionEnvelope,
  RunnerSessionScope,
  RunnerTerminalSession,
} from '../game/runner/runnerSessionTypes';
import type {
  RunnerFinishOutcome,
  RunnerFinishReason,
  RunnerMode,
  RunnerResult,
  RunnerSnapshot,
  StoryStageId,
} from '../game/runner/runnerTypes';

export const RUNNER_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const STORAGE_KEY_PREFIX = 'stella-runner:session:v1:';

export type SessionStoreResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; reason: 'unavailable' | 'quota' | 'expired' | 'invalid'; error?: string }>;

export interface RunnerSessionStore {
  read(scope: RunnerSessionScope, now?: Date): SessionStoreResult<RunnerSessionEnvelope | null>;
  write(envelope: RunnerSessionEnvelope): SessionStoreResult<void>;
  remove(scope: RunnerSessionScope): SessionStoreResult<void>;
}

type SessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isValidScope(scope: unknown): scope is RunnerSessionScope {
  if (!scope || typeof scope !== 'object') return false;
  const candidate = scope as { kind?: unknown; id?: unknown };
  return candidate.kind === 'guest' ||
    (candidate.kind === 'account' && typeof candidate.id === 'string' && candidate.id.trim().length > 0);
}

export function createRunnerSessionKey(scope: RunnerSessionScope): string {
  if (!isValidScope(scope)) throw new TypeError('Invalid runner session scope');
  return scope.kind === 'guest'
    ? `${STORAGE_KEY_PREFIX}guest`
    : `${STORAGE_KEY_PREFIX}account:${encodeURIComponent(scope.id)}`;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && CHARACTERS.some((character) => character.id === value);
}

function isMode(value: unknown): value is RunnerMode {
  return value === 'endless' || value === 'story';
}

function isStoryStageId(value: unknown): value is StoryStageId {
  return value === 'dawn-city' || value === 'moonlit-forest' ||
    value === 'crystal-mine' || value === 'cloud-skyway';
}

function isScopeEqual(left: RunnerSessionScope, right: RunnerSessionScope): boolean {
  return left.kind === right.kind && (left.kind === 'guest' ||
    (right.kind === 'account' && left.id === right.id));
}

function isSnapshot(value: unknown, characterId: CharacterId, mode: RunnerMode): value is RunnerSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<RunnerSnapshot>;
  return snapshot.phase === 'paused' && snapshot.characterId === characterId &&
    (snapshot.mode === undefined || snapshot.mode === mode) &&
    (snapshot.storyStageId === undefined || snapshot.storyStageId === null || isStoryStageId(snapshot.storyStageId)) &&
    Number.isFinite(snapshot.elapsedMs) && Number.isFinite(snapshot.remainingMs) &&
    Number.isFinite(snapshot.distanceMeters) && Number.isFinite(snapshot.worldDistance) &&
    Number.isFinite(snapshot.speedUnitsPerSecond) && Number.isSafeInteger(snapshot.coins) &&
    Number.isFinite(snapshot.giantRemainingMs) && Number.isFinite(snapshot.speedPickupRemainingMs) &&
    isIsoTimestamp(snapshot.startedAtIso);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isEngineCheckpoint(value: unknown): value is RunnerEngineCheckpoint {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.player)) return false;
  const player = value.player;
  const numericPlayerFields = ['x', 'y', 'velocityX', 'velocityY', 'bodyWidth', 'bodyHeight',
    'bodySourceWidth', 'bodySourceHeight', 'bodyOffsetX', 'bodyOffsetY', 'scaleX', 'scaleY',
    'alpha', 'animationFrame', 'animationElapsedMs'];
  const booleanPlayerFields = ['allowGravity', 'bodyEnabled', 'grounded', 'slidingHeld', 'hurt',
    'passiveRescuing', 'pitFalling', 'passiveEffectActive', 'giantActive'];
  return numericPlayerFields.every((field) => Number.isFinite(player[field])) &&
    booleanPlayerFields.every((field) => typeof player[field] === 'boolean') &&
    typeof player.animation === 'string' && ['ascending', 'descending'].includes(String(player.airPhase)) &&
    [0, 1, 2].includes(Number(player.jumpsUsed)) &&
    ['worldDistance', 'randomSeed', 'obstacleCursor', 'pickupCursor', 'pickupHorizonMeters', 'pitCursor']
      .every((field) => Number.isFinite(value[field])) &&
    typeof value.obstacleSkipPatternAfterDoubleJump === 'boolean' &&
    (value.pickupStageId === null || isStoryStageId(value.pickupStageId)) &&
    ['obstaclePending', 'obstacleWarnedKinds', 'createdGateDistances', 'entities',
      'collectedPickupIds', 'passedGateIds'].every((field) => Array.isArray(value[field]));
}

function isActivePayload(value: unknown): value is RunnerActiveSession {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<RunnerActiveSession>;
  return isCharacterId(payload.characterId) && isMode(payload.mode) &&
    (payload.storyStageId === null || isStoryStageId(payload.storyStageId)) &&
    isSnapshot(payload.snapshot, payload.characterId, payload.mode) && isEngineCheckpoint(payload.engine);
}

const FINISH_REASONS: readonly RunnerFinishReason[] = [
  'timeout', 'pit', 'lives-exhausted', 'stage-complete',
];
const FINISH_OUTCOMES: readonly RunnerFinishOutcome[] = ['personal-best', 'completed'];

function isRunnerResult(value: unknown, characterId: CharacterId, mode: RunnerMode): value is RunnerResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<RunnerResult>;
  return result.characterId === characterId && (result.mode === undefined || result.mode === mode) &&
    Number.isFinite(result.distanceMeters) && result.distanceMeters! >= 0 &&
    Number.isSafeInteger(result.coins) && result.coins! >= 0 &&
    Number.isFinite(result.durationMs) && result.durationMs! >= 0 &&
    isIsoTimestamp(result.finishedAtIso) && FINISH_REASONS.includes(result.finishReason as RunnerFinishReason);
}

function isTerminalPayload(value: unknown): value is RunnerTerminalSession {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<RunnerTerminalSession>;
  return isCharacterId(payload.characterId) && isMode(payload.mode) &&
    (payload.storyStageId === null || isStoryStageId(payload.storyStageId)) &&
    isRunnerResult(payload.result, payload.characterId, payload.mode) &&
    FINISH_OUTCOMES.includes(payload.outcome as RunnerFinishOutcome) && typeof payload.settled === 'boolean' &&
    (payload.presentation === undefined || (!!payload.presentation &&
      typeof payload.presentation === 'object' &&
      Array.isArray(payload.presentation.newlyUnlockedAchievementIds) &&
      Number.isFinite(payload.presentation.achievementBonusCoins) &&
      !!payload.presentation.settlement && typeof payload.presentation.settlement === 'object'));
}

function parseEnvelope(value: unknown): RunnerSessionEnvelope | null {
  if (!value || typeof value !== 'object') return null;
  const envelope = value as { schemaVersion?: unknown; kind?: unknown; savedAt?: unknown;
    accountScope?: unknown; runId?: unknown; payload?: unknown };
  if (envelope.schemaVersion !== 1 || !isValidScope(envelope.accountScope) ||
      !isIsoTimestamp(envelope.savedAt) || typeof envelope.runId !== 'string' || !envelope.runId.trim()) {
    return null;
  }
  if (envelope.kind === 'active' && isActivePayload(envelope.payload)) {
    return envelope as RunnerSessionEnvelope & { kind: 'active' };
  }
  if (envelope.kind === 'terminal' && isTerminalPayload(envelope.payload)) {
    return envelope as RunnerSessionEnvelope & { kind: 'terminal' };
  }
  return null;
}

function storageFailure(error: unknown): SessionStoreResult<never> {
  const candidate = error as { name?: string; code?: number } | null;
  const quota = candidate?.name === 'QuotaExceededError' || candidate?.code === 22 || candidate?.code === 1014;
  return {
    ok: false,
    reason: quota ? 'quota' : 'unavailable',
    error: error instanceof Error ? error.message : undefined,
  };
}

export class BrowserRunnerSessionStore implements RunnerSessionStore {
  constructor(private readonly storage?: SessionStorage | null) {}

  private getStorage(): SessionStorage | null {
    if (this.storage !== undefined) return this.storage;
    try {
      return typeof window === 'undefined' ? null : window.localStorage;
    } catch {
      return null;
    }
  }

  read(scope: RunnerSessionScope, now = new Date()): SessionStoreResult<RunnerSessionEnvelope | null> {
    if (!isValidScope(scope)) return { ok: false, reason: 'invalid' };
    const storage = this.getStorage();
    if (!storage) return { ok: false, reason: 'unavailable' };
    const key = createRunnerSessionKey(scope);
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch (error) {
      return storageFailure(error);
    }
    if (raw === null) return { ok: true, value: null };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      this.removeCorruptKey(storage, key);
      return { ok: false, reason: 'invalid' };
    }
    const envelope = parseEnvelope(parsed);
    if (!envelope || !isScopeEqual(envelope.accountScope, scope)) {
      this.removeCorruptKey(storage, key);
      return { ok: false, reason: 'invalid' };
    }
    const savedAt = Date.parse(envelope.savedAt);
    const nowMs = now.getTime();
    if (!Number.isFinite(nowMs) || savedAt > nowMs || nowMs - savedAt >= RUNNER_SESSION_TTL_MS) {
      this.removeCorruptKey(storage, key);
      return { ok: false, reason: savedAt <= nowMs ? 'expired' : 'invalid' };
    }
    return { ok: true, value: envelope };
  }

  write(envelope: RunnerSessionEnvelope): SessionStoreResult<void> {
    const validated = parseEnvelope(envelope);
    if (!validated) return { ok: false, reason: 'invalid' };
    const storage = this.getStorage();
    if (!storage) return { ok: false, reason: 'unavailable' };
    try {
      storage.setItem(createRunnerSessionKey(validated.accountScope), JSON.stringify(validated));
      return { ok: true, value: undefined };
    } catch (error) {
      return storageFailure(error);
    }
  }

  remove(scope: RunnerSessionScope): SessionStoreResult<void> {
    if (!isValidScope(scope)) return { ok: false, reason: 'invalid' };
    const storage = this.getStorage();
    if (!storage) return { ok: false, reason: 'unavailable' };
    try {
      storage.removeItem(createRunnerSessionKey(scope));
      return { ok: true, value: undefined };
    } catch (error) {
      return storageFailure(error);
    }
  }

  private removeCorruptKey(storage: SessionStorage, key: string): void {
    try {
      storage.removeItem(key);
    } catch {
      // The invalid/expired state is still reported; callers can continue without a save.
    }
  }
}

export const browserRunnerSessionStore = new BrowserRunnerSessionStore();
