import { getCharacterPassive } from '../characters/characterAbilities';
import type { CharacterId } from '../characters/characterTypes';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import type {
  RunnerBiomeId,
  RunnerGateId,
  RunnerPickupKind,
  RunnerResult,
  RunnerSnapshot,
} from './runnerTypes';

const GATE_IDS: readonly RunnerGateId[] = ['gate-2500', 'gate-5000', 'gate-7500'];
const BIOME_IDS: readonly RunnerBiomeId[] = [
  'dawn-city',
  'moonlit-forest',
  'crystal-mine',
  'cloud-skyway',
];
const EPSILON = 1e-7;

function getSpeed(elapsedMs: number): number {
  const { initialSpeedUnitsPerSecond, maxSpeedUnitsPerSecond, speedRampMs } = RUNNER_CONFIG;
  const progress = Math.min(1, Math.max(0, elapsedMs / speedRampMs));
  return initialSpeedUnitsPerSecond +
    (maxSpeedUnitsPerSecond - initialSpeedUnitsPerSecond) * progress;
}

function getBiome(distanceMeters: number): RunnerBiomeId {
  let index = 0;
  for (const gateDistance of RUNNER_GATE_DISTANCES_M) {
    if (distanceMeters < gateDistance - EPSILON) break;
    index += 1;
  }
  return BIOME_IDS[index];
}

function traveledWorldUnits(elapsedMs: number, deltaMs: number): number {
  const rampEnd = RUNNER_CONFIG.speedRampMs;
  const firstEnd = Math.min(elapsedMs + deltaMs, rampEnd);
  const rampDeltaMs = Math.max(0, firstEnd - elapsedMs);
  const rampUnits = (getSpeed(elapsedMs) + getSpeed(firstEnd)) / 2 * rampDeltaMs / 1_000;
  const cappedDeltaMs = Math.max(0, elapsedMs + deltaMs - Math.max(elapsedMs, rampEnd));
  return rampUnits + RUNNER_CONFIG.maxSpeedUnitsPerSecond * cappedDeltaMs / 1_000;
}

function advanceSegment(state: RunnerSnapshot, deltaMs: number): RunnerSnapshot {
  const elapsedMs = state.elapsedMs + deltaMs;
  const worldDistance = state.worldDistance + traveledWorldUnits(state.elapsedMs, deltaMs);
  const distanceMeters = worldDistance * RUNNER_CONFIG.metersPerWorldUnit;
  return {
    ...state,
    elapsedMs,
    remainingMs: Math.max(0, state.remainingMs - deltaMs),
    worldDistance,
    distanceMeters,
    speedUnitsPerSecond: getSpeed(elapsedMs),
    staggerRemainingMs: Math.max(0, state.staggerRemainingMs - deltaMs),
    protectionRemainingMs: Math.max(0, state.protectionRemainingMs - deltaMs),
    biomeId: getBiome(distanceMeters),
  };
}

function millisecondsToReach(
  state: RunnerSnapshot,
  gateDistanceMeters: number,
  availableMs: number,
): number {
  if (state.distanceMeters >= gateDistanceMeters - EPSILON) return 0;
  let low = 0;
  let high = availableMs;
  for (let index = 0; index < 48; index += 1) {
    const middle = (low + high) / 2;
    const distance = state.distanceMeters +
      traveledWorldUnits(state.elapsedMs, middle) * RUNNER_CONFIG.metersPerWorldUnit;
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
    distanceMeters: Math.round(state.distanceMeters),
    coins: state.coins,
    durationMs: state.elapsedMs,
    finishedAtIso: state.finishedAtIso ?? logicalFinishIso(state),
  };
}

export function createRunnerSnapshot(characterId: CharacterId, now: Date = new Date()): RunnerSnapshot {
  return {
    phase: 'countdown',
    characterId,
    elapsedMs: 0,
    remainingMs: RUNNER_CONFIG.initialTimerMs,
    distanceMeters: 0,
    worldDistance: 0,
    speedUnitsPerSecond: RUNNER_CONFIG.initialSpeedUnitsPerSecond,
    coins: 0,
    collectedPickupIds: [],
    passedGateIds: [],
    staggerRemainingMs: 0,
    protectionRemainingMs: 0,
    biomeId: 'dawn-city',
    finishedAtElapsedMs: null,
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

export function finishRunner(
  state: RunnerSnapshot,
  now?: Date,
): { state: RunnerSnapshot; result: RunnerResult } {
  const finished = state.phase === 'finished'
    ? state
    : {
      ...state,
      phase: 'finished' as const,
      remainingMs: 0,
      finishedAtElapsedMs: state.elapsedMs,
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
  if (state.remainingMs <= 0) return finishRunner(state);
  let unspentMs = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
  if (unspentMs === 0) return { state, result: null };

  let current = state;
  while (unspentMs > EPSILON) {
    const availableMs = Math.min(unspentMs, current.remainingMs);
    const nextGate = getNextGate(current);
    const segmentMeters = traveledWorldUnits(current.elapsedMs, availableMs) *
      RUNNER_CONFIG.metersPerWorldUnit;

    if (nextGate && current.distanceMeters + segmentMeters >= nextGate.distance - EPSILON) {
      const segmentMs = millisecondsToReach(current, nextGate.distance, availableMs);
      const atGate = advanceSegment(current, segmentMs);
      current = {
        ...atGate,
        distanceMeters: nextGate.distance,
        worldDistance: nextGate.distance / RUNNER_CONFIG.metersPerWorldUnit,
        biomeId: getBiome(nextGate.distance),
        remainingMs: Math.min(
          RUNNER_CONFIG.maxTimerMs,
          atGate.remainingMs + RUNNER_CONFIG.gateBonusMs,
        ),
        passedGateIds: [...atGate.passedGateIds, nextGate.id],
      };
      onGateAward?.(nextGate.id, current.remainingMs - atGate.remainingMs);
      unspentMs = Math.max(0, unspentMs - segmentMs);
      continue;
    }

    current = advanceSegment(current, availableMs);
    unspentMs = Math.max(0, unspentMs - availableMs);
    if (current.remainingMs <= EPSILON) return finishRunner(current);
  }
  return { state: current, result: null };
}

export function collectPickup(
  state: RunnerSnapshot,
  pickup: { id: string; kind: RunnerPickupKind },
): RunnerSnapshot {
  if (state.phase !== 'running' || state.remainingMs <= 0 || !pickup.id ||
      state.collectedPickupIds.includes(pickup.id)) return state;

  const collectedPickupIds = [...state.collectedPickupIds, pickup.id];
  if (pickup.kind === 'coin') {
    return { ...state, coins: state.coins + 1, collectedPickupIds };
  }
  const passive = getCharacterPassive(state.characterId);
  const bonusMs = passive.id === 'time-pickup' ? passive.bonusMs : 0;
  return {
    ...state,
    remainingMs: Math.min(
      RUNNER_CONFIG.maxTimerMs,
      state.remainingMs + RUNNER_CONFIG.timePickupMs + bonusMs,
    ),
    collectedPickupIds,
  };
}

export function applyCollision(state: RunnerSnapshot): RunnerSnapshot {
  if (state.phase !== 'running' || state.protectionRemainingMs > 0 || state.remainingMs <= 0) {
    return state;
  }
  const passive = getCharacterPassive(state.characterId);
  const reductionMs = passive.id === 'collision-penalty-reduction' ? passive.reductionMs : 0;
  const remainingMs = Math.max(0, state.remainingMs - RUNNER_CONFIG.collisionPenaltyMs + reductionMs);
  const hit: RunnerSnapshot = {
    ...state,
    remainingMs,
    staggerRemainingMs: RUNNER_CONFIG.staggerMs,
    protectionRemainingMs: RUNNER_CONFIG.protectionMs,
  };
  return remainingMs === 0 ? finishRunner(hit).state : hit;
}
