import type { RunnerFinishOutcome, RunnerGateId, RunnerPickupKind, RunnerResult, RunnerSnapshot } from './runnerTypes';

export type RunnerEvent =
  | Readonly<{ type: 'snapshot'; snapshot: RunnerSnapshot }>
  | Readonly<{ type: 'countdown'; value: 0 | 1 | 2 | 3 }>
  | Readonly<{ type: 'player-action'; action: 'jump' | 'double-jump' | 'slide' }>
  | Readonly<{ type: 'pickup'; pickupId: string; kind: RunnerPickupKind; awardedMs: number }>
  | Readonly<{ type: 'gate'; gateId: RunnerGateId; awardedMs: number }>
  | Readonly<{ type: 'passive-triggered'; passiveId: 'hiyori-guard'; remainingCharges: number; trigger: 'obstacle' | 'pit' }>
  | Readonly<{ type: 'passive-triggered'; passiveId: 'toa-ghost-glide'; remainingCharges: 0; trigger: 'slide' }>
  | Readonly<{ type: 'hazard-hit' }>
  | Readonly<{ type: 'pit-fall-started' }>
  | Readonly<{ type: 'run-finished'; result: RunnerResult; outcome: RunnerFinishOutcome }>
  | Readonly<{ type: 'fatal-error'; message: string }>;

export type RunnerCallbacks = {
  onSnapshot(snapshot: RunnerSnapshot): void;
  onFinished(result: RunnerResult, outcome: RunnerFinishOutcome): void;
  onEvent?(event: RunnerEvent): void;
};

export class RunnerEventEmitter {
  private lastSnapshotMs = -Infinity;
  private readonly pickupIds = new Set<string>();
  private readonly gateIds = new Set<RunnerGateId>();
  private finished = false;

  constructor(private readonly callbacks: RunnerCallbacks) {}

  snapshot(snapshot: RunnerSnapshot, nowMs: number, force = false): void {
    if (!force && nowMs - this.lastSnapshotMs < 100) return;
    this.lastSnapshotMs = nowMs;
    this.callbacks.onSnapshot(snapshot);
    this.callbacks.onEvent?.({ type: 'snapshot', snapshot });
  }

  countdown(value: 0 | 1 | 2 | 3): void {
    this.callbacks.onEvent?.({ type: 'countdown', value });
  }

  playerAction(action: 'jump' | 'double-jump' | 'slide'): void {
    this.callbacks.onEvent?.({ type: 'player-action', action });
  }

  hazardHit(): void {
    this.callbacks.onEvent?.({ type: 'hazard-hit' });
  }

  pitFallStarted(): void {
    this.callbacks.onEvent?.({ type: 'pit-fall-started' });
  }

  pickup(pickupId: string, kind: RunnerPickupKind, awardedMs: number): void {
    if (this.pickupIds.has(pickupId)) return;
    this.pickupIds.add(pickupId);
    this.callbacks.onEvent?.({ type: 'pickup', pickupId, kind, awardedMs });
  }

  gate(gateId: RunnerGateId, awardedMs: number): void {
    if (this.gateIds.has(gateId)) return;
    this.gateIds.add(gateId);
    this.callbacks.onEvent?.({ type: 'gate', gateId, awardedMs });
  }

  passiveTriggered(remainingCharges: number, trigger: 'obstacle' | 'pit'): void {
    this.callbacks.onEvent?.({ type: 'passive-triggered', passiveId: 'hiyori-guard', remainingCharges, trigger });
  }

  toaGlideTriggered(): void {
    this.callbacks.onEvent?.({ type: 'passive-triggered', passiveId: 'toa-ghost-glide', remainingCharges: 0, trigger: 'slide' });
  }

  finish(result: RunnerResult, outcome: RunnerFinishOutcome): void {
    if (this.finished) return;
    this.finished = true;
    this.callbacks.onFinished(result, outcome);
    this.callbacks.onEvent?.({ type: 'run-finished', result, outcome });
  }

  fatalError(message: string): void {
    this.callbacks.onEvent?.({ type: 'fatal-error', message });
  }
}
