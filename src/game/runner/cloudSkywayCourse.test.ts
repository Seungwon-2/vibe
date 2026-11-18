import { describe, expect, it } from 'vitest';
import { getCharacterPassive } from '../characters/characterAbilities';
import { generatePickupSchedule, getPickupBodySize } from './CollectibleSpawner';
import { advanceRunner, createRunnerSnapshot, startRunner } from './RunnerSimulation';
import { RUNNER_CONFIG } from './runnerConfig';
import { STANDING_BODY_HEIGHT, STANDING_BODY_WIDTH } from './runnerPose';
import { getStoryStage } from './storyConfig';
import { getStoryHazardSchedule } from './storyCourses';
import { getStoryPitDefinitions } from './storyPitSchedule';

const stage = getStoryStage('cloud-skyway');
const { gravityY, jumpImpulseY, metersPerWorldUnit, storySpeedBoostRatio } = RUNNER_CONFIG;
const firstImpulse = -jumpImpulseY;
const pickupRadius = getPickupBodySize() / 2;
const schedule = generatePickupSchedule(stage.lengthMeters, stage.id);
const hazards = getStoryHazardSchedule(stage.id);
const rangPassive = getCharacterPassive('cogane-rang');
if (rangPassive.id !== 'rang-double-jump') throw new Error('Expected Rang’s second-jump passive');
const rangSecondImpulse = firstImpulse * rangPassive.doubleJumpVelocityMultiplier;

function traceJump(startMeters: number, speedMeters: number, secondJumpAt: number, secondImpulse: number) {
  const firstJumpHeight = firstImpulse * secondJumpAt - gravityY * secondJumpAt ** 2 / 2;
  const samples = [{ meters: startMeters, feetHeight: 0 }];
  // Sample the ballistic path at the same frequency as an Arcade world step.
  for (let frame = 1; ; frame += 1) {
    const time = frame / 60;
    const afterSecond = time - secondJumpAt;
    const feetHeight = afterSecond < 0 ? firstImpulse * time - gravityY * time ** 2 / 2
      : firstJumpHeight + secondImpulse * afterSecond - gravityY * afterSecond ** 2 / 2;
    samples.push({ meters: startMeters + time * speedMeters, feetHeight: Math.max(0, feetHeight) });
    if (feetHeight <= 0) return samples;
  }
}

function speedAt(distanceMeters: number, characterId: 'player-default' | 'goth-student' | 'cogane-rang') {
  let state = startRunner(createRunnerSnapshot(characterId, new Date(0), { mode: 'story', storyStageId: stage.id }));
  while (state.distanceMeters < distanceMeters) state = advanceRunner(state, 50).state;
  return state.speedUnitsPerSecond * metersPerWorldUnit;
}

describe('Cloud Skyway aerial routes', () => {
  it.each([{ group: 'middle', count: 8, nextHazard: 'skyway-jump-04' },
    { group: 'late', count: 10, nextHazard: 'skyway-slide-07' }])(
    'keeps the $group arc reachable with landing space and an independent ground route', ({ group, count, nextHazard }) => {
      const coins = schedule.filter(({ id }) => id.startsWith(`skyway-air-${group}-`));
      expect(coins).toHaveLength(count);
      const first = coins[0];
      const last = coins.at(-1)!;
      const maxHeight = Math.max(...coins.map(({ heightUnits }) => heightUnits));
      expect(first.heightUnits).toBeLessThan(coins[1].heightUnits);
      expect(maxHeight).toBeGreaterThan(firstImpulse ** 2 / (2 * gravityY) + STANDING_BODY_HEIGHT + pickupRadius);
      const next = hazards.find(({ id }) => id === nextHazard)!;
      const pathHazards = hazards.filter(({ distanceMeters }) =>
        distanceMeters >= first.distanceMeters && distanceMeters <= last.distanceMeters);
      expect(pathHazards.map(({ definition }) => definition.kind)).toEqual(group === 'middle' ? [] : ['ground']);

      for (const { character, impulse, multiplier } of [
        { character: 'goth-student', impulse: firstImpulse, multiplier: 1 },
        { character: 'player-default', impulse: firstImpulse, multiplier: 1 + storySpeedBoostRatio },
        { character: 'cogane-rang', impulse: rangSecondImpulse, multiplier: 1 },
      ] as const) {
        const speed = speedAt(first.distanceMeters, character) * multiplier;
        const nextLeft = next.distanceMeters - (next.definition.width + STANDING_BODY_WIDTH) / 2 * metersPerWorldUnit;
        const reachable = Array.from({ length: 19 }, (_, index) => first.distanceMeters - 50 + index * 3)
          .some((start) => [0.34, 0.39, 0.44, 0.49].some((secondAt) => {
            const arc = traceJump(start, speed, secondAt, impulse);
            return arc.at(-1)!.meters + speed * 0.12 < nextLeft &&
              pathHazards.every((hazard) => arc.every(({ meters, feetHeight }) =>
                Math.abs(meters - hazard.distanceMeters) >
                  (hazard.definition.width + STANDING_BODY_WIDTH) / 2 * metersPerWorldUnit ||
                feetHeight >= hazard.definition.height + 4)) &&
              coins.every((coin) => arc.some(({ meters, feetHeight }) =>
                Math.abs(meters - coin.distanceMeters) < (STANDING_BODY_WIDTH / 2 + pickupRadius) * metersPerWorldUnit &&
                coin.heightUnits > feetHeight - pickupRadius &&
                coin.heightUnits < feetHeight + STANDING_BODY_HEIGHT + pickupRadius));
          }));
        expect(reachable, `${character} must collect the ${group} arc and land before the next hazard`).toBe(true);
      }
    });

  it('leaves enough reachable low coins and gives the two existing jump challenges landing cues', () => {
    const lowCoins = schedule.filter(({ kind, heightUnits }) =>
      kind === 'coin' && heightUnits <= STANDING_BODY_HEIGHT + pickupRadius);
    expect(lowCoins.length).toBeGreaterThanOrEqual(stage.coinTarget);
    const widePit = getStoryPitDefinitions(stage.id, stage.lengthMeters).find((pit) => pit.id.endsWith('-wide-pit'))!;
    expect(widePit.widthMeters).toBe(120);
    const pitLandingCoins = schedule.filter(({ id }) => id.startsWith('skyway-air-pit-'));
    expect(pitLandingCoins).toHaveLength(3);
    expect(pitLandingCoins[0].distanceMeters).toBeGreaterThan(widePit.distanceMeters + widePit.widthMeters / 2);
    expect(schedule.filter(({ id }) => id.startsWith('skyway-air-wall-'))).toHaveLength(3);
    expect(schedule.filter(({ kind }) => kind === 'giant').every(({ heightUnits }) =>
      heightUnits > STANDING_BODY_HEIGHT + pickupRadius)).toBe(true);
  });

  it('keeps original checkpoint object positions and selects the new layout for newly started runs', () => {
    expect(createRunnerSnapshot('player-default', new Date(0), { mode: 'story', storyStageId: stage.id })
      .storyCourseRevision).toBe(2);
    expect(getStoryHazardSchedule(stage.id, 1).map(({ distanceMeters }) => distanceMeters))
      .toEqual([180, 400, 620, 1100, 1320, 1540, 1760, 2280, 2920, 3140, 3360, 3580]);
    expect(getStoryPitDefinitions(stage.id, stage.lengthMeters, 1).at(-1)?.widthMeters)
      .toBe(RUNNER_CONFIG.storyWidePitWidthMeters);
    expect(generatePickupSchedule(stage.lengthMeters, stage.id, 1).some(({ id }) => id.startsWith('skyway-air-')))
      .toBe(false);
  });
});
