import type { BossDefinition, CommandKey } from '../content/stageTypes';

export type BossPhase = 'stompable' | 'rage-delay' | 'command' | 'countering' | 'groggy' | 'defeated';
export type BossInputResult = 'ignored' | 'progress' | 'success' | 'counter';

export type BossEncounterSnapshot = {
  phase: BossPhase;
  stomps: number;
  requiredStomps: number;
  currentCommand: CommandKey[] | null;
  commandIndex: number;
  remainingMs: number;
};

export class BossEncounter {
  private phase: BossPhase = 'stompable';
  private stomps = 0;
  private currentCommand: CommandKey[] | null = null;
  private commandIndex = 0;
  private remainingMs = 0;
  private commandSequenceIndex = 0;

  constructor(readonly definition: BossDefinition) {}

  snapshot(): BossEncounterSnapshot {
    return {
      phase: this.phase,
      stomps: this.stomps,
      requiredStomps: this.definition.stompsToDefeat,
      currentCommand: this.currentCommand ? [...this.currentCommand] : null,
      commandIndex: this.commandIndex,
      remainingMs: this.remainingMs,
    };
  }

  tick(deltaMs: number): void {
    if (this.phase === 'defeated' || this.phase === 'stompable') return;
    this.remainingMs = Math.max(0, this.remainingMs - Math.max(0, deltaMs));
    if (this.remainingMs > 0) return;

    if (this.phase === 'rage-delay') {
      this.startCommand();
    } else if (this.phase === 'command') {
      this.failCommand();
    } else if (this.phase === 'countering' || this.phase === 'groggy') {
      this.startRageDelay();
    }
  }

  stomp(): boolean {
    if (this.phase !== 'stompable' && this.phase !== 'groggy') return false;
    this.stomps += 1;
    if (this.stomps >= this.definition.stompsToDefeat) {
      this.phase = 'defeated';
      this.remainingMs = 0;
      return true;
    }
    if (this.stomps >= this.definition.rageAfterStomps) this.startRageDelay();
    return false;
  }

  input(key: CommandKey): BossInputResult {
    if (this.phase !== 'command' || !this.currentCommand) return 'ignored';
    if (this.currentCommand[this.commandIndex] !== key) {
      this.failCommand();
      return 'counter';
    }
    this.commandIndex += 1;
    if (this.commandIndex >= this.currentCommand.length) {
      this.phase = 'groggy';
      this.remainingMs = this.definition.groggyDurationMs;
      this.currentCommand = null;
      this.commandIndex = 0;
      return 'success';
    }
    return 'progress';
  }

  private startRageDelay(): void {
    this.phase = 'rage-delay';
    this.currentCommand = null;
    this.commandIndex = 0;
    this.remainingMs = this.definition.commandDelayMs;
  }

  private startCommand(): void {
    this.phase = 'command';
    this.currentCommand = this.definition.commands[this.commandSequenceIndex % this.definition.commands.length] ?? [];
    this.commandSequenceIndex += 1;
    this.commandIndex = 0;
    this.remainingMs = this.definition.commandInputLimitMs;
  }

  private failCommand(): void {
    this.phase = 'countering';
    this.currentCommand = null;
    this.commandIndex = 0;
    this.remainingMs = 900;
  }
}
