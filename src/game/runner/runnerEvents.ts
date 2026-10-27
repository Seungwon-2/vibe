import type { RunnerFinishOutcome, RunnerGateId, RunnerPickupKind, RunnerResult, RunnerSnapshot } from './runnerTypes';

export type RunnerEvent =
  | Readonly<{ type: 'snapshot'; snapshot: RunnerSnapshot }>
  | Readonly<{ type: 'countdown'; value: 0 | 1 | 2 | 3 }>
  | Readonly<{ type: 'pickup'; pickupId: string; kind: RunnerPickupKind; awardedMs: number }>
  | Readonly<{ type: 'gate'; gateId: RunnerGateId; awardedMs: number }>
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
