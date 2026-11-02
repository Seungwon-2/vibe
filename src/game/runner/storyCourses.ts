import { getStoryStage } from './storyConfig';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import { isPitClearance } from './PitSpawner';
import type { HazardDefinition, HazardKind } from './hazardTypes';
import type { StoryStageId } from './runnerTypes';
import { isGateClearance } from './hazardPatterns';
import { getStoryPitDefinitions, validateStoryPitSpacing } from './storyPitSchedule';

export type StoryHazardPlacement = Readonly<{
  id: string;
  distanceMeters: number;
  definition: HazardDefinition;
}>;

function hazard(id: string, kind: HazardKind): HazardDefinition {
  return Object.freeze({
    id,
    kind,
    offsetMeters: 0,
    width: kind === 'ground' ? 46 : kind === 'double-jump'
      ? RUNNER_CONFIG.doubleJumpBarrierWidthPx : 64,
    height: kind === 'ground' ? 48 : kind === 'double-jump'
      ? RUNNER_CONFIG.doubleJumpBarrierHeightPx : 36,
    warningColor: kind === 'ground' ? '#ffcf6b' : kind === 'double-jump' ? '#ff9a66' : '#8fe5f8',
  });
}

function placement(id: string, distanceMeters: number, kind: HazardKind): StoryHazardPlacement {
  return Object.freeze({ id, distanceMeters, definition: hazard(id, kind) });
}

const STORY_COURSES: Readonly<Record<StoryStageId, readonly StoryHazardPlacement[]>> = Object.freeze({
  'dawn-city': Object.freeze([
    placement('dawn-jump-01', 360, 'ground'), placement('dawn-slide-01', 600, 'overhead'),
    placement('dawn-wall-01', 1_300, 'double-jump'), placement('dawn-slide-02', 1_560, 'overhead'),
    placement('dawn-jump-03', 1_780, 'ground'),
  ]),
  'moonlit-forest': Object.freeze([
    placement('forest-slide-01', 360, 'overhead'), placement('forest-jump-01', 620, 'ground'),
    placement('forest-slide-02', 1_080, 'overhead'), placement('forest-jump-02', 1_420, 'ground'),
    placement('forest-slide-03', 1_760, 'overhead'), placement('forest-wall-01', 2_280, 'double-jump'),
  ]),
  'crystal-mine': Object.freeze([
    placement('mine-jump-01', 390, 'ground'), placement('mine-slide-01', 620, 'overhead'),
    placement('mine-jump-02', 1_100, 'ground'), placement('mine-jump-03', 1_390, 'ground'),
    placement('mine-slide-02', 1_760, 'overhead'), placement('mine-jump-04', 2_280, 'ground'),
    placement('mine-wall-01', 2_920, 'double-jump'),
    placement('mine-slide-04', 3_180, 'overhead'),
  ]),
  'cloud-skyway': Object.freeze([
    placement('skyway-slide-01', 380, 'overhead'), placement('skyway-jump-01', 620, 'ground'),
    placement('skyway-slide-02', 1_100, 'overhead'), placement('skyway-jump-02', 1_410, 'ground'),
    placement('skyway-slide-03', 1_760, 'overhead'), placement('skyway-jump-03', 2_280, 'ground'),
    placement('skyway-wall-01', 2_920, 'double-jump'),
    placement('skyway-slide-05', 3_220, 'overhead'), placement('skyway-jump-05', 3_550, 'ground'),
    placement('skyway-slide-06', 3_780, 'overhead'),
  ]),
});

export function validateStoryCourses(): void {
  validateStoryPitSpacing();
  for (const [stageId, course] of Object.entries(STORY_COURSES) as [StoryStageId, readonly StoryHazardPlacement[]][]) {
    const stage = getStoryStage(stageId);
    for (let index = 0; index < course.length; index += 1) {
      const current = course[index];
      const previous = course[index - 1];
      const halfWidthMeters = current.definition.width / 2 * RUNNER_CONFIG.metersPerWorldUnit;
      if (!Number.isFinite(current.distanceMeters) || current.distanceMeters <= 0 ||
          current.distanceMeters >= stage.lengthMeters - 180) {
        throw new Error(`Invalid Story hazard ${current.id} in ${stageId}: outside safe course bounds`);
      }
      if (previous && current.distanceMeters - previous.distanceMeters < 220) {
        throw new Error(`Invalid Story hazard spacing in ${stageId}: ${previous.id} and ${current.id}`);
      }
      if (getStoryPitDefinitions(stageId, stage.lengthMeters).some((pit) => isPitClearance(current.distanceMeters, pit,
        RUNNER_CONFIG.pitHazardClearanceMeters + halfWidthMeters))) {
        throw new Error(`Story hazard ${current.id} conflicts with a pit`);
      }
      if (RUNNER_GATE_DISTANCES_M.some((gate) => gate < stage.lengthMeters &&
          isGateClearance(current.distanceMeters, gate, halfWidthMeters))) {
        throw new Error(`Story hazard ${current.id} conflicts with a milestone`);
      }
    }
  }
}

export function getStoryHazardSchedule(stageId: StoryStageId): readonly StoryHazardPlacement[] {
  const course = STORY_COURSES[stageId];
  if (!course) throw new Error('Unknown Story course: ' + stageId);
  return course;
}
