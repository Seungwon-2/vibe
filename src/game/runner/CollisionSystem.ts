import { applyCollision, finishRunner } from './RunnerSimulation';
import type { RunnerResult, RunnerSnapshot } from './runnerTypes';
import type { HazardDefinition } from './hazardTypes';

export type HazardGeometry = Readonly<{ x: number; y: number; width: number; height: number }>;

export function getHazardGeometry(hazard: HazardDefinition, x: number): HazardGeometry {
  // Standing player spans y=394..470; aligned sliding player spans y=422..470.
  // The overhead bar ends at y=416, leaving a readable 6px slide clearance.
  const y = hazard.kind === 'ground' ? 470 - hazard.height : 380;
  return { x, y, width: hazard.width, height: hazard.height };
}

export function tryResolveHazardHit(state: RunnerSnapshot): {
  state: RunnerSnapshot;
  hit: boolean;
  result: RunnerResult | null;
} {
  const next = applyCollision(state);
  if (next === state) return { state, hit: false, result: null };
  return {
    state: next,
    hit: true,
    result: next.phase === 'finished' ? finishRunner(next).result : null,
  };
}
