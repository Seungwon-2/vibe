import { getCharacterPassive } from '../characters/characterAbilities';
import type { CharacterId } from '../characters/characterTypes';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import { getStoryStage } from './storyConfig';
import { getBiomeForDistance } from '../visuals/runnerBiomes';
import type {
  RunnerFinishReason,
  RunnerGateId,
  RunnerPickupKind,
  RunnerResult,
  RunnerSnapshot,
  RunnerMode,
  StoryStageId,
} from './runnerTypes';

const GATE_IDS: readonly RunnerGateId[] = RUNNER_GATE_DISTANCES_M.map(
  (distance) => `gate-${distance}` as RunnerGateId,
);
const EPSILON = 1e-7;

function getBaseSpeed(elapsedMs: number, gateCount: number, characterId: CharacterId, mode: RunnerMode): number {
  const { initialSpeedUnitsPerSecond, maxSpeedUnitsPerSecond, speedRampMs } = RUNNER_CONFIG;
  const progress = Math.min(1, Math.max(0, elapsedMs / speedRampMs));
  const passive = getCharacterPassive(characterId);
  const passiveBonus = passive.id === 'rin-speed' ? passive.speedBonusRatio : 0;
  const effectiveGateCount = mode === 'endless' ? gateCount : 0;
  const targetSpeed = maxSpeedUnitsPerSecond * (1 + effectiveGateCount * RUNNER_CONFIG.gateSpeedBonusRatio);
  const baseSpeed = initialSpeedUnitsPerSecond + (targetSpeed - initialSpeedUnitsPerSecond) * progress;
  return baseSpeed * (1 + passiveBonus);
}

function baseTraveledWorldUnits(elapsedMs: number, deltaMs: number, gateCount: number, characterId: CharacterId, mode: RunnerMode): number {
  const rampEnd = RUNNER_CONFIG.speedRampMs;
  const firstEnd = Math.min(elapsedMs + deltaMs, rampEnd);
  const rampDeltaMs = Math.max(0, firstEnd - elapsedMs);
  const rampUnits = (getBaseSpeed(elapsedMs, gateCount, characterId, mode) +
    getBaseSpeed(firstEnd, gateCount, characterId, mode)) / 2 * rampDeltaMs / 1_000;
  const cappedDeltaMs = Math.max(0, elapsedMs + deltaMs - Math.max(elapsedMs, rampEnd));
  const passive = getCharacterPassive(characterId);
  const passiveBonus = passive.id === 'rin-speed' ? passive.speedBonusRatio : 0;
  const effectiveGateCount = mode === 'endless' ? gateCount : 0;
  const targetSpeed = RUNNER_CONFIG.maxSpeedUnitsPerSecond * (1 + effectiveGateCount * RUNNER_CONFIG.gateSpeedBonusRatio);
  return rampUnits + targetSpeed * (1 + passiveBonus) * cappedDeltaMs / 1_000;
}

function getSpeed(state: RunnerSnapshot, elapsedMs = state.elapsedMs, gateCount = state.passedGateIds.length): number {
  const base = getBaseSpeed(elapsedMs, gateCount, state.characterId, state.mode ?? 'endless');
  return state.mode === 'story' && state.stageSpeedBoostRemainingMs
    ? base * (1 + RUNNER_CONFIG.storySpeedBoostRatio)
    : base;
}

function traveledWorldUnits(state: RunnerSnapshot, deltaMs: number, gateCount = state.passedGateIds.length): number {
  const mode = state.mode ?? 'endless';
  const boostedMs = mode === 'story'
    ? Math.min(deltaMs, state.stageSpeedBoostRemainingMs ?? 0)
    : 0;
  const normalMs = Math.max(0, deltaMs - boostedMs);
  const base = baseTraveledWorldUnits(state.elapsedMs, boostedMs, gateCount, state.characterId, mode) *
    (boostedMs > 0 ? 1 + RUNNER_CONFIG.storySpeedBoostRatio : 1);
  return base + baseTraveledWorldUnits(state.elapsedMs + boostedMs, normalMs, gateCount, state.characterId, mode);
}

function advanceSegment(state: RunnerSnapshot, deltaMs: number, gateCount = state.passedGateIds.length): RunnerSnapshot {
  const elapsedMs = state.elapsedMs + deltaMs;
  const worldDistance = state.worldDistance + traveledWorldUnits(state, deltaMs, gateCount);
  const distanceMeters = worldDistance * RUNNER_CONFIG.metersPerWorldUnit;
  return {
    ...state,
    elapsedMs,
    remainingMs: state.mode === 'story' ? Number.POSITIVE_INFINITY : Math.max(0, state.remainingMs - deltaMs),
    worldDistance,
    distanceMeters,
    speedUnitsPerSecond: getSpeed({ ...state, elapsedMs,
      stageSpeedBoostRemainingMs: Math.max(0, (state.stageSpeedBoostRemainingMs ?? 0) - deltaMs) }, elapsedMs, gateCount),
    staggerRemainingMs: Math.max(0, state.staggerRemainingMs - deltaMs),
    protectionRemainingMs: Math.max(0, state.protectionRemainingMs - deltaMs),
    passiveEffectRemainingMs: Math.max(0, state.passiveEffectRemainingMs - deltaMs),
    slideGuardRemainingMs: Math.max(0, state.slideGuardRemainingMs - deltaMs),
    slideGuardCooldownRemainingMs: Math.max(0, state.slideGuardCooldownRemainingMs - deltaMs),
    giantRemainingMs: Math.max(0, state.giantRemainingMs - deltaMs),
    stageSpeedBoostRemainingMs: Math.max(0, (state.stageSpeedBoostRemainingMs ?? 0) - deltaMs),
    biomeId: getBiomeForDistance(distanceMeters).id,
  };
}

function millisecondsToReach(
  state: RunnerSnapshot,
  gateDistanceMeters: number,
  availableMs: number,
  gateCount: number,
): number {
  if (state.distanceMeters >= gateDistanceMeters - EPSILON) return 0;
  let low = 0;
  let high = availableMs;
  for (let index = 0; index < 48; index += 1) {
    const middle = (low + high) / 2;
    const distance = state.distanceMeters +
      traveledWorldUnits(state, middle, gateCount) * RUNNER_CONFIG.metersPerWorldUnit;
    if (distance >= gateDistanceMeters) high = middle;
    else low = middle;
  }
  return high;
}

function getNextGate(state: RunnerSnapshot): { distance: number; id: RunnerGateId } | null {
  for (let index = 0; index < RUNNER_GATE_DISTANCES_M.length; index += 1) {
    const id = GATE_IDS[index];
    if (!state.passedGateIds.includes(id)) {
      return { distance: RUNNER_GATE_DISTANCES_M[index], id };
    }
  }
  return null;
}

function logicalFinishIso(state: RunnerSnapshot): string {
  return new Date(Date.parse(state.startedAtIso) + state.elapsedMs).toISOString();
}

function toResult(state: RunnerSnapshot): RunnerResult {
  return {
    characterId: state.characterId,
    mode: state.mode ?? 'endless',
    storyStageId: state.storyStageId ?? null,
    hitsTaken: state.hitsTaken ?? 0,
    livesRemaining: state.livesRemaining,
    nearMissScore: state.nearMissScore ?? 0,
    passedGateCount: state.passedGateIds.length,
    completedStage: state.finishReason === 'stage-complete',
    distanceMeters: Math.round(state.distanceMeters),
    coins: state.coins,
    durationMs: state.elapsedMs,
    finishedAtIso: state.finishedAtIso ?? logicalFinishIso(state),
    finishReason: state.finishReason ?? 'timeout',
  };
}

export function createRunnerSnapshot(
  characterId: CharacterId,
  now: Date = new Date(),
  options: { mode?: RunnerMode; storyStageId?: StoryStageId | null } = {},
): RunnerSnapshot {
  const mode = options.mode ?? 'endless';
  const storyStageId = options.storyStageId ?? null;
  if (mode === 'story' && !storyStageId) throw new TypeError('Story mode requires a stage ID');
  if (storyStageId) getStoryStage(storyStageId);
  return {
    phase: 'countdown',
    characterId,
    mode,
    storyStageId,
    livesRemaining: mode === 'story' ? RUNNER_CONFIG.storyLivesPerStage : 0,
    nearMissScore: 0,
    hitsTaken: 0,
    stageSpeedBoostRemainingMs: 0,
    elapsedMs: 0,
    remainingMs: mode === 'story' ? Number.POSITIVE_INFINITY : RUNNER_CONFIG.initialTimerMs,
    distanceMeters: 0,
    worldDistance: 0,
    speedUnitsPerSecond: getBaseSpeed(0, 0, characterId, mode),
    coins: 0,
    giantRemainingMs: 0,
    collectedPickupIds: [],
    passedGateIds: [],
    staggerRemainingMs: 0,
    protectionRemainingMs: 0,
    passiveChargesRemaining: (() => {
      const passive = getCharacterPassive(characterId);
      return passive.id === 'hiyori-guard' ? passive.chargesPerRun : 0;
    })(),
    passiveEffectRemainingMs: 0,
    slideGuardRemainingMs: 0,
    slideGuardCooldownRemainingMs: 0,
    biomeId: 'dawn-city',
    finishedAtElapsedMs: null,
    finishReason: null,
    startedAtIso: now.toISOString(),
    finishedAtIso: null,
  };
}

export function startRunner(state: RunnerSnapshot): RunnerSnapshot {
  return state.phase === 'countdown' ? { ...state, phase: 'running' } : state;
}

export function pauseRunner(state: RunnerSnapshot): RunnerSnapshot {
  return state.phase === 'running' ? { ...state, phase: 'paused' } : state;
}

export function resumeRunner(state: RunnerSnapshot): RunnerSnapshot {
  return state.phase === 'paused' ? { ...state, phase: 'running' } : state;
}

/** Opens Toa's short collision guard window only when a fresh slide begins. */
export function beginRunnerSlide(state: RunnerSnapshot): RunnerSnapshot {
  if (state.phase !== 'running' || state.slideGuardCooldownRemainingMs > 0) return state;
  const passive = getCharacterPassive(state.characterId);
  return passive.id === 'toa-ghost-glide'
    ? { ...state, slideGuardRemainingMs: passive.slideGuardMs }
    : state;
}

export function finishRunner(
  state: RunnerSnapshot,
  now?: Date,
  reason: RunnerFinishReason = 'timeout',
): { state: RunnerSnapshot; result: RunnerResult } {
  const finished = state.phase === 'finished'
    ? state
    : {
      ...state,
      phase: 'finished' as const,
      giantRemainingMs: 0,
      remainingMs: 0,
      finishedAtElapsedMs: state.elapsedMs,
      finishReason: reason,
      finishedAtIso: now?.toISOString() ?? logicalFinishIso(state),
    };
  return { state: finished, result: toResult(finished) };
}

export function advanceRunner(
  state: RunnerSnapshot,
  deltaMs: number,
  onGateAward?: (gateId: RunnerGateId, awardedMs: number) => void,
): { state: RunnerSnapshot; result: RunnerResult | null } {
  if (state.phase !== 'running') return { state, result: null };
  if (state.mode !== 'story' && state.remainingMs <= 0) return finishRunner(state);
  let unspentMs = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
  if (unspentMs === 0) return { state, result: null };

  let current = state;
  while (unspentMs > EPSILON) {
    if (current.staggerRemainingMs > EPSILON) {
      const frozenMs = Math.min(unspentMs, current.staggerRemainingMs, current.remainingMs);
      current = {
        ...current,
        elapsedMs: current.elapsedMs + frozenMs,
        remainingMs: current.mode === 'story' ? Number.POSITIVE_INFINITY : Math.max(0, current.remainingMs - frozenMs),
        speedUnitsPerSecond: getSpeed({ ...current,
          stageSpeedBoostRemainingMs: Math.max(0, (current.stageSpeedBoostRemainingMs ?? 0) - frozenMs) },
        current.elapsedMs + frozenMs, current.passedGateIds.length),
        staggerRemainingMs: Math.max(0, current.staggerRemainingMs - frozenMs),
        protectionRemainingMs: Math.max(0, current.protectionRemainingMs - frozenMs),
        passiveEffectRemainingMs: Math.max(0, current.passiveEffectRemainingMs - frozenMs),
        slideGuardRemainingMs: Math.max(0, current.slideGuardRemainingMs - frozenMs),
        slideGuardCooldownRemainingMs: Math.max(0, current.slideGuardCooldownRemainingMs - frozenMs),
        giantRemainingMs: Math.max(0, current.giantRemainingMs - frozenMs),
        stageSpeedBoostRemainingMs: Math.max(0, (current.stageSpeedBoostRemainingMs ?? 0) - frozenMs),
      };
      unspentMs = Math.max(0, unspentMs - frozenMs);
      if (current.mode !== 'story' && current.remainingMs <= EPSILON) return finishRunner(current);
      continue;
    }
    const availableMs = Math.min(unspentMs, current.remainingMs);
    const nextGate = getNextGate(current);
    const gateCount = current.passedGateIds.length;
    const segmentMeters = traveledWorldUnits(current, availableMs, gateCount) *
      RUNNER_CONFIG.metersPerWorldUnit;
    const storyTarget = current.mode === 'story' && current.storyStageId
      ? getStoryStage(current.storyStageId).lengthMeters : null;
    const crossesStoryFinish = storyTarget !== null && current.distanceMeters + segmentMeters >= storyTarget - EPSILON;
    const gateBeforeFinish = nextGate && (!crossesStoryFinish || nextGate.distance < storyTarget! - EPSILON);

    if (gateBeforeFinish && current.distanceMeters + segmentMeters >= nextGate.distance - EPSILON) {
      const segmentMs = millisecondsToReach(current, nextGate.distance, availableMs, gateCount);
      const atGate = advanceSegment(current, segmentMs, gateCount);
      current = {
        ...atGate,
        distanceMeters: nextGate.distance,
        worldDistance: nextGate.distance / RUNNER_CONFIG.metersPerWorldUnit,
        speedUnitsPerSecond: getSpeed(atGate, atGate.elapsedMs, current.mode === 'story' ? 0 : gateCount + 1),
        biomeId: getBiomeForDistance(nextGate.distance).id,
        remainingMs: current.mode === 'story' ? Number.POSITIVE_INFINITY : Math.min(
          RUNNER_CONFIG.maxTimerMs,
          atGate.remainingMs + RUNNER_CONFIG.gateBonusMs,
        ),
        passedGateIds: [...atGate.passedGateIds, nextGate.id],
      };
      onGateAward?.(nextGate.id, current.mode === 'story' ? 0 : current.remainingMs - atGate.remainingMs);
      unspentMs = Math.max(0, unspentMs - segmentMs);
      continue;
    }

    if (crossesStoryFinish && storyTarget !== null) {
      const finishMs = millisecondsToReach(current, storyTarget, availableMs, current.passedGateIds.length);
      const atFinish = advanceSegment(current, finishMs, current.passedGateIds.length);
      const finishState = {
        ...atFinish,
        distanceMeters: storyTarget,
        worldDistance: storyTarget / RUNNER_CONFIG.metersPerWorldUnit,
        remainingMs: Number.POSITIVE_INFINITY,
      };
      const completed = finishRunner(finishState, undefined, 'stage-complete');
      return { state: completed.state, result: completed.result };
    }

    current = advanceSegment(current, availableMs);
    unspentMs = Math.max(0, unspentMs - availableMs);
    if (current.mode !== 'story' && current.remainingMs <= EPSILON) return finishRunner(current);
  }
  return { state: current, result: null };
}

export function collectPickup(
  state: RunnerSnapshot,
  pickup: { id: string; kind: RunnerPickupKind },
): RunnerSnapshot {
  if (state.phase !== 'running' || (state.mode !== 'story' && state.remainingMs <= 0) || !pickup.id ||
      state.collectedPickupIds.includes(pickup.id)) return state;

  const collectedPickupIds = [...state.collectedPickupIds, pickup.id];
  if (pickup.kind === 'giant') {
    return { ...state, giantRemainingMs: RUNNER_CONFIG.giantDurationMs, collectedPickupIds };
  }
  if (pickup.kind === 'coin') {
    return { ...state, coins: state.coins + 1, collectedPickupIds };
  }
  const passive = getCharacterPassive(state.characterId);
  if (state.mode === 'story') {
    return {
      ...state,
      stageSpeedBoostRemainingMs: RUNNER_CONFIG.storySpeedBoostMs,
      collectedPickupIds,
    };
  }
  const bonusMs = passive.id === 'rin-speed' ? 1_000 : 0;
  return {
    ...state,
    remainingMs: Math.min(
      RUNNER_CONFIG.maxTimerMs,
      state.remainingMs + RUNNER_CONFIG.timePickupMs + bonusMs,
    ),
    collectedPickupIds,
  };
}

export function applyCollision(state: RunnerSnapshot, sliding = false): RunnerSnapshot {
  if (state.phase !== 'running' || state.protectionRemainingMs > 0 ||
      (state.mode !== 'story' && state.remainingMs <= 0)) {
    return state;
  }
  if (state.giantRemainingMs > 0) return state;
  const passive = getCharacterPassive(state.characterId);
  if (passive.id === 'toa-ghost-glide' && sliding && state.slideGuardRemainingMs > 0) {
    return {
      ...state,
      slideGuardRemainingMs: 0,
      slideGuardCooldownRemainingMs: passive.cooldownMs,
      passiveEffectRemainingMs: 500,
    };
  }
  if (passive.id === 'hiyori-guard' && state.passiveChargesRemaining > 0) {
    return {
      ...state,
      hitsTaken: (state.hitsTaken ?? 0) + (state.mode === 'story' ? 1 : 0),
      passiveChargesRemaining: state.passiveChargesRemaining - 1,
      passiveEffectRemainingMs: 700,
      protectionRemainingMs: state.mode === 'story'
        ? RUNNER_CONFIG.storyHitProtectionMs : RUNNER_CONFIG.protectionMs,
    };
  }
  if (state.mode === 'story') {
    const livesRemaining = Math.max(0, (state.livesRemaining ?? RUNNER_CONFIG.storyLivesPerStage) - 1);
    const hit: RunnerSnapshot = {
      ...state,
      livesRemaining,
      hitsTaken: (state.hitsTaken ?? 0) + 1,
      staggerRemainingMs: RUNNER_CONFIG.storyHitProtectionMs,
      protectionRemainingMs: RUNNER_CONFIG.storyHitProtectionMs,
    };
    return livesRemaining === 0 ? finishRunner(hit, undefined, 'lives-exhausted').state : hit;
  }
  const remainingMs = Math.max(0, state.remainingMs - RUNNER_CONFIG.collisionPenaltyMs);
  const hit: RunnerSnapshot = {
    ...state,
    remainingMs,
    staggerRemainingMs: RUNNER_CONFIG.staggerMs,
    protectionRemainingMs: RUNNER_CONFIG.protectionMs,
  };
  return remainingMs === 0 ? finishRunner(hit).state : hit;
}

export function applyPitFall(state: RunnerSnapshot): { state: RunnerSnapshot; blockedByPassive: boolean } {
  if (state.phase !== 'running' || (state.mode !== 'story' && state.remainingMs <= 0)) {
    return { state, blockedByPassive: false };
  }
  const passive = getCharacterPassive(state.characterId);
  if (passive.id === 'hiyori-guard' && state.passiveChargesRemaining > 0) {
    return {
      state: {
        ...state,
        giantRemainingMs: 0,
        hitsTaken: (state.hitsTaken ?? 0) + (state.mode === 'story' ? 1 : 0),
        passiveChargesRemaining: state.passiveChargesRemaining - 1,
        passiveEffectRemainingMs: 700,
        protectionRemainingMs: state.mode === 'story'
          ? RUNNER_CONFIG.storyHitProtectionMs : RUNNER_CONFIG.protectionMs,
        // Freeze the course while the scene returns Hiyori to the safe ground anchor.
        staggerRemainingMs: state.mode === 'story' ? 500 : state.staggerRemainingMs,
      },
      blockedByPassive: true,
    };
  }
  return { state: finishRunner(state, undefined, 'pit').state, blockedByPassive: false };
}
