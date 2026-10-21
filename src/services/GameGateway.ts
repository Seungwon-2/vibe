import type { StageDefinition, WorldId } from '../game/content/stageTypes';

export type PlayerSave = {
  worldId: WorldId;
  stageId: string;
  checkpointId: string;
  lives: number;
  stageScore: number;
  coins: number;
  collectedCoinIds?: string[];
  enemyStomps?: number;
  extraLifeOverflow?: number;
  elapsedMs?: number;
  unlockedStageOrdinal: number;
  characterId: string;
};

export type StageClearResult = {
  stageId: string;
  displayName: string;
  score: number;
  clearTimeMs: number;
};

export type StageRecord = StageClearResult & { rank: number };
export type StageRankingRow = StageRecord;

export interface GameGateway {
  getSave(): Promise<PlayerSave | null>;
  putSave(save: PlayerSave): Promise<void>;
  deleteSave(): Promise<void>;
  getRanking(stageId: string): Promise<StageRankingRow[]>;
  submitClear(result: StageClearResult): Promise<StageRecord>;
}

export function createInitialSave(stage: StageDefinition): PlayerSave {
  return {
    worldId: stage.worldId,
    stageId: stage.id,
    checkpointId: 'start',
    lives: 5,
    stageScore: 0,
    coins: 0,
    unlockedStageOrdinal: stage.ordinal,
    characterId: 'default-hero',
  };
}
