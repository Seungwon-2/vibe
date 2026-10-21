import type { GameGateway, PlayerSave, StageClearResult, StageRankingRow, StageRecord } from './GameGateway';

export class MemoryGameGateway implements GameGateway {
  private save: PlayerSave | null = null;
  private readonly records = new Map<string, StageRecord[]>();
  private readonly storageKey = 'azure-platformer-dev-save-v1';

  constructor() {
    try {
      const encoded = globalThis.localStorage?.getItem(this.storageKey);
      if (!encoded) return;
      const state = JSON.parse(encoded) as { save?: PlayerSave | null; records?: Record<string, StageRecord[]> };
      this.save = state.save ? { ...state.save } : null;
      for (const [stageId, records] of Object.entries(state.records ?? {})) this.records.set(stageId, records);
    } catch {
      this.save = null;
      this.records.clear();
    }
  }

  async getSave(): Promise<PlayerSave | null> {
    return this.save ? { ...this.save } : null;
  }

  async putSave(save: PlayerSave): Promise<void> {
    this.save = { ...save };
    this.persist();
  }

  async deleteSave(): Promise<void> {
    this.save = null;
    this.persist();
  }

  async getRanking(stageId: string): Promise<StageRankingRow[]> {
    return [...(this.records.get(stageId) ?? [])]
      .sort((a, b) => b.score - a.score || a.clearTimeMs - b.clearTimeMs)
      .slice(0, 10);
  }

  async submitClear(result: StageClearResult): Promise<StageRecord> {
    const records = this.records.get(result.stageId) ?? [];
    const playerBest = records.find((record) => record.displayName === result.displayName);
    if (!playerBest || result.score > playerBest.score ||
      (result.score === playerBest.score && result.clearTimeMs < playerBest.clearTimeMs)) {
      const next = records.filter((record) => record.displayName !== result.displayName);
      next.push({ ...result, rank: 0 });
      this.records.set(result.stageId, next);
      this.persist();
    }
    const sorted = await this.getRanking(result.stageId);
    const record = sorted.find((entry) => entry.displayName === result.displayName);
    return { ...(record ?? { ...result, rank: 10 }), rank: Math.max(1, (record ? sorted.indexOf(record) : 9) + 1) };
  }

  private persist(): void {
    try {
      globalThis.localStorage?.setItem(this.storageKey, JSON.stringify({
        save: this.save,
        records: Object.fromEntries(this.records.entries()),
      }));
    } catch {
      // A full or disabled browser store should not block local development play.
    }
  }
}

export const gameGateway = new MemoryGameGateway();
