import { applyCollision, applyPitFall, finishRunner } from './RunnerSimulation';
import type { RunnerResult, RunnerSnapshot } from './runnerTypes';
import type { HazardDefinition } from './hazardTypes';
import { RUNNER_GROUND_Y } from './runnerPose';

export type HazardGeometry = Readonly<{ x: number; y: number; width: number; height: number }>;

export function getHazardGeometry(hazard: HazardDefinition, x: number): HazardGeometry {
  // Standing player spans y=394..470; aligned sliding player spans y=422..470.
  // The overhead bar ends at y=416, leaving a readable 6px slide clearance.
  const y = hazard.kind === 'ground' || hazard.kind === 'double-jump'
    ? RUNNER_GROUND_Y - hazard.height
    : 380;
  return { x, y, width: hazard.width, height: hazard.height };
}

/** Full art canvas for overhead barriers; collision and spacing still use getHazardGeometry. */
export function getHazardVisualGeometry(hazard: HazardDefinition, x: number): HazardGeometry {
  if (hazard.kind === 'overhead') return { x, y: 0, width: hazard.width, height: RUNNER_GROUND_Y };
  return getHazardGeometry(hazard, x);
}

/** Overhead art stays at the ceiling, while its collision lane covers every jump height. */
export function getHazardCollisionGeometry(hazard: HazardDefinition, x: number): HazardGeometry {
  if (hazard.kind === 'overhead') return { x, y: 0, width: hazard.width, height: RUNNER_GROUND_Y };
  return getHazardGeometry(hazard, x);
}

export function isHazardDodgedBySlide(hazard: HazardDefinition, groundedSliding: boolean): boolean {
  return hazard.kind === 'overhead' && groundedSliding;
}

export function tryResolveHazardHit(state: RunnerSnapshot, sliding = false): {
  state: RunnerSnapshot;
  hit: boolean;
  blockedByPassive: boolean;
  passiveId: 'hiyori-guard' | 'toa-ghost-glide' | null;
  result: RunnerResult | null;
} {
  const next = applyCollision(state, sliding);
  if (next === state) return { state, hit: false, blockedByPassive: false, passiveId: null, result: null };
  const passiveId = next.passiveChargesRemaining < state.passiveChargesRemaining
    ? 'hiyori-guard'
    : next.slideGuardCooldownRemainingMs > state.slideGuardCooldownRemainingMs ? 'toa-ghost-glide' : null;
  return {
    state: next,
    hit: true,
    blockedByPassive: passiveId !== null,
    passiveId,
    result: next.phase === 'finished' ? finishRunner(next).result : null,
  };
}

export function tryResolvePitFall(state: RunnerSnapshot): {
  state: RunnerSnapshot;
  blockedByPassive: boolean;
  passiveId: 'hiyori-guard' | null;
  result: RunnerResult | null;
} {
  const resolved = applyPitFall(state);
  return {
    ...resolved,
    passiveId: resolved.blockedByPassive ? 'hiyori-guard' : null,
    result: resolved.state.phase === 'finished' ? finishRunner(resolved.state).result : null,
  };
}
