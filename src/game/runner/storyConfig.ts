import type { CharacterId } from '../characters/characterTypes';
import type { RunnerBiomeId, StoryStageId } from './runnerTypes';

export type StoryStageDefinition = Readonly<{
  id: StoryStageId;
  order: 1 | 2 | 3 | 4;
  name: string;
  biomeId: RunnerBiomeId;
  lengthMeters: number;
  unlockCharacterId: CharacterId | null;
  coinTarget: number;
}>;

export const STORY_STAGES: readonly StoryStageDefinition[] = Object.freeze([
  {
    id: 'dawn-city',
    order: 1,
    name: '새벽 도심',
    biomeId: 'dawn-city',
    lengthMeters: 2_500,
    unlockCharacterId: 'hanayo-hiyori',
    coinTarget: 20,
  },
  {
    id: 'moonlit-forest',
    order: 2,
    name: '달빛 숲길',
    biomeId: 'moonlit-forest',
    lengthMeters: 3_000,
    unlockCharacterId: 'tokino-mary',
    coinTarget: 25,
  },
  {
    id: 'crystal-mine',
    order: 3,
    name: '수정 광산',
    biomeId: 'crystal-mine',
    lengthMeters: 3_500,
    unlockCharacterId: 'goth-student',
    coinTarget: 30,
  },
  {
    id: 'cloud-skyway',
    order: 4,
    name: '구름 위 하늘길',
    biomeId: 'cloud-skyway',
    lengthMeters: 4_000,
    unlockCharacterId: 'cogane-rang',
    coinTarget: 35,
  },
]);

const STORY_STAGE_BY_ID = new Map(STORY_STAGES.map((stage) => [stage.id, stage]));

export function getStoryStage(stageId: StoryStageId): StoryStageDefinition {
  const stage = STORY_STAGE_BY_ID.get(stageId);
  if (!stage) throw new Error('Unknown Story stage: ' + stageId);
  return stage;
}

export function getNextStoryStageId(stageId: StoryStageId): StoryStageId | null {
  const next = STORY_STAGES.find((stage) => stage.order === getStoryStage(stageId).order + 1);
  return next?.id ?? null;
}
