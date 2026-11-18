import { getStoryStage } from './storyConfig';
import { RUNNER_CONFIG } from './runnerConfig';
import type { PitDefinition } from './pitTypes';
import type { StoryCourseRevision, StoryStageId } from './runnerTypes';

const WIDE_PIT_DISTANCE_BY_STAGE: Readonly<Record<StoryStageId, number>> = Object.freeze({
  'dawn-city': 2_300,
  'moonlit-forest': 2_600,
  'crystal-mine': 2_600,
  'cloud-skyway': 2_600,
});

export function getStoryPitDefinitions(
  stageId: StoryStageId,
  maxDistanceMeters: number,
  revision: StoryCourseRevision = 2,
): readonly PitDefinition[] {
  const stage = getStoryStage(stageId);
  const scheduled = [
    {
      id: `${stageId}-pit-intro`, distanceMeters: RUNNER_CONFIG.firstPitDistanceMeters,
      widthMeters: RUNNER_CONFIG.pitWidthMeters, tutorialWarning: true,
    },
    {
      id: `${stageId}-wide-pit`, distanceMeters: WIDE_PIT_DISTANCE_BY_STAGE[stageId],
      widthMeters: stageId === 'cloud-skyway' && revision === 2 ? 120 : RUNNER_CONFIG.storyWidePitWidthMeters,
      tutorialWarning: true,
    },
  ];
  return scheduled.filter((pit) => pit.distanceMeters <= stage.lengthMeters &&
    pit.distanceMeters <= maxDistanceMeters);
}

export function validateStoryPitSpacing(): void {
  for (const [stageId, wideDistance] of Object.entries(WIDE_PIT_DISTANCE_BY_STAGE) as [StoryStageId, number][]) {
    const stage = getStoryStage(stageId);
    const halfWidth = RUNNER_CONFIG.storyWidePitWidthMeters / 2;
    if (wideDistance <= RUNNER_CONFIG.firstPitDistanceMeters ||
        wideDistance + halfWidth >= stage.lengthMeters - 100) {
      throw new Error(`Wide pit is too close to a course boundary in ${stageId}`);
    }
    if (wideDistance - halfWidth <= RUNNER_CONFIG.firstPitDistanceMeters +
        RUNNER_CONFIG.pitWidthMeters / 2 + RUNNER_CONFIG.pitHazardClearanceMeters) {
      throw new Error(`Wide pit is too close to the intro pit in ${stageId}`);
    }
  }
}
