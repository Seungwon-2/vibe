import type { RunnerGateId, RunnerPickupKind, RunnerResult, RunnerSnapshot } from './runnerTypes';

export type RunnerEvent =
  | Readonly<{ type: 'snapshot'; snapshot: RunnerSnapshot }>
  | Readonly<{ type: 'pickup'; pickupId: string; kind: RunnerPickupKind; awardedMs: number }>
  | Readonly<{ type: 'gate'; gateId: RunnerGateId; awardedMs: number }>
  | Readonly<{ type: 'run-finished'; result: RunnerResult }>
  | Readonly<{ type: 'fatal-error'; message: string }>;

export type RunnerCallbacks = {
  onSnapshot(snapshot: RunnerSnapshot): void;
  onFinished(result: RunnerResult): void;
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

  finish(result: RunnerResult): void {
    if (this.finished) return;
    this.finished = true;
    this.callbacks.onFinished(result);
    this.callbacks.onEvent?.({ type: 'run-finished', result });
  }

  fatalError(message: string): void {
    this.callbacks.onEvent?.({ type: 'fatal-error', message });
  }
}
