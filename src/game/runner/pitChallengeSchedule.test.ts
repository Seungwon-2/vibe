import { describe, expect, it } from 'vitest';
import { getPitDefinitions, isPitClearance } from './PitSpawner';
import { getStoryHazardSchedule, validateStoryCourses } from './storyCourses';
import { getStoryPitDefinitions } from './storyPitSchedule';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import { STORY_STAGES } from './storyConfig';
import { advanceRunner, createRunnerSnapshot, startRunner } from './RunnerSimulation';

function speedAtDistance(mode: 'endless' | 'story', distanceMeters: number,
  storyStageId?: (typeof STORY_STAGES)[number]['id']): number {
  let state = startRunner(createRunnerSnapshot('player-default', new Date('2026-11-02T00:00:00Z'), {
    mode, storyStageId,
  }));
  for (let tick = 0; state.distanceMeters < distanceMeters && tick < 12_000; tick += 1) {
    state = advanceRunner(state, 10).state;
  }
  return state.distanceMeters >= distanceMeters ? state.speedUnitsPerSecond : 0;
}

describe('wide double-jump pit schedule', () => {
  it('keeps wide Endless gaps on their authored schedule with clearance from gates and other pits', () => {
    const pits = getPitDefinitions(20_000);
    const widePits = pits.filter((pit) => pit.widthMeters === RUNNER_CONFIG.widePitWidthMeters);
    expect(widePits.length).toBeGreaterThan(1);
    expect(widePits[0].distanceMeters).toBeGreaterThan(2_000);
    expect(widePits[0].distanceMeters).toBe(RUNNER_CONFIG.endlessWidePitFirstDistanceMeters);
    expect(widePits[0].tutorialWarning).toBe(true);
    expect(widePits.slice(1).every((pit) => !pit.tutorialWarning)).toBe(true);

    for (const pit of widePits) {
      for (const gate of RUNNER_GATE_DISTANCES_M) {
        expect(Math.abs(pit.distanceMeters - gate)).toBeGreaterThan(
          RUNNER_CONFIG.gateClearanceMeters + pit.widthMeters / 2,
        );
      }
    }
    for (const pit of widePits) {
      for (const other of pits) {
        if (pit.id === other.id) continue;
        expect(Math.abs(pit.distanceMeters - other.distanceMeters)).toBeGreaterThan(
          pit.widthMeters / 2 + other.widthMeters / 2 + RUNNER_CONFIG.pitHazardClearanceMeters,
        );
      }
    }
  });

  it('places one fixed wide pit per Story course and validates themed challenge spacing', () => {
    validateStoryCourses();
    for (const stage of STORY_STAGES) {
      const pits = getStoryPitDefinitions(stage.id, stage.lengthMeters);
      const widePits = pits.filter((pit) => pit.widthMeters === RUNNER_CONFIG.storyWidePitWidthMeters);
      expect(widePits).toHaveLength(1);
      expect(widePits[0].tutorialWarning).toBe(true);
      expect(widePits[0].distanceMeters).toBeLessThan(stage.lengthMeters);
      for (const hazard of getStoryHazardSchedule(stage.id)) {
        expect(isPitClearance(hazard.distanceMeters, widePits[0],
          RUNNER_CONFIG.pitHazardClearanceMeters + hazard.definition.width / 2 *
            RUNNER_CONFIG.metersPerWorldUnit)).toBe(false);
      }
    }
  });

  it('introduces Dawn City double jump in the latter half with safe recovery to the goal', () => {
    const stage = STORY_STAGES.find(({ id }) => id === 'dawn-city')!;
    const hazards = getStoryHazardSchedule(stage.id);
    const wall = hazards.find(({ definition }) => definition.kind === 'double-jump')!;
    expect(wall.distanceMeters).toBeGreaterThanOrEqual(stage.lengthMeters / 2);
    expect(wall.distanceMeters).toBeGreaterThanOrEqual(1_300);
    expect(stage.lengthMeters - hazards.at(-1)!.distanceMeters).toBeGreaterThanOrEqual(500);
    validateStoryCourses();
  });

  it('adds a compact challenge sequence and recovery stretch to every Story route', () => {
    validateStoryCourses();
    for (const stage of STORY_STAGES) {
      const hazards = getStoryHazardSchedule(stage.id);
      const groups: Array<Array<(typeof hazards)[number]>> = [];
      for (const hazard of hazards) {
        const group = groups.at(-1);
        if (!group || hazard.distanceMeters - group.at(-1)!.distanceMeters > 350) groups.push([hazard]);
        else group.push(hazard);
      }
      const hasChallengeAndRecovery = groups.some((group, groupIndex) => {
        if (group.length < 3) return false;
        const hasCompactActions = group.slice(0, 3).slice(1).every((hazard, index) => {
          const gap = hazard.distanceMeters - group[index].distanceMeters;
          return gap >= 220 && gap <= 320;
        });
        const recoveryEnd = groups[groupIndex + 1]?.[0].distanceMeters ?? stage.lengthMeters;
        return hasCompactActions && recoveryEnd - group.at(-1)!.distanceMeters >= 400;
      });
      expect(hasChallengeAndRecovery, `${stage.id} needs a short combo and a readable break`)
        .toBe(true);
    }
  });

  it('sizes the pit widths so one jump falls short and a timed double jump reaches across', () => {
    const singleFlightSeconds = 2 * Math.abs(RUNNER_CONFIG.jumpImpulseY) / RUNNER_CONFIG.gravityY;
    const doubleFlightSeconds = 3 * Math.abs(RUNNER_CONFIG.jumpImpulseY) / RUNNER_CONFIG.gravityY;
    const gatesBeforeFirstWidePit = RUNNER_GATE_DISTANCES_M.filter((distance) =>
      distance < RUNNER_CONFIG.endlessWidePitFirstDistanceMeters).length;
    const maxSingleEndlessRange = RUNNER_CONFIG.maxSpeedUnitsPerSecond *
      (1 + gatesBeforeFirstWidePit * RUNNER_CONFIG.gateSpeedBonusRatio) * 1.05 *
      singleFlightSeconds * RUNNER_CONFIG.metersPerWorldUnit;
    expect(maxSingleEndlessRange).toBeLessThan(RUNNER_CONFIG.widePitWidthMeters);

    const endlessChallengeSpeed = speedAtDistance('endless', RUNNER_CONFIG.endlessWidePitFirstDistanceMeters);
    expect(endlessChallengeSpeed * doubleFlightSeconds * RUNNER_CONFIG.metersPerWorldUnit)
      .toBeGreaterThanOrEqual(RUNNER_CONFIG.widePitWidthMeters);

    for (const stage of STORY_STAGES) {
      const width = RUNNER_CONFIG.storyWidePitWidthMeters;
      const pit = getStoryPitDefinitions(stage.id, stage.lengthMeters)
        .find((item) => item.widthMeters === width)!;
      const speed = speedAtDistance('story', pit.distanceMeters, stage.id);
      expect(speed * singleFlightSeconds * RUNNER_CONFIG.metersPerWorldUnit).toBeLessThan(width);
      expect(speed * doubleFlightSeconds * RUNNER_CONFIG.metersPerWorldUnit).toBeGreaterThanOrEqual(width);
    }
  });
});
