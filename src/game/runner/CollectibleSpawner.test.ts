import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { drawPickupArt, generatePickupSchedule, getPickupBodySize,
  CollectibleSpawner, PICKUP_PIT_CLEARANCE_METERS, PICKUP_SCHEDULE } from './CollectibleSpawner';
import { RUNNER_GROUND_Y, STANDING_BODY_HEIGHT } from './runnerPose';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import { getHazardDistance, getPatternForDistance, getPatternStartDistance, isGateClearance,
  METERS_PER_WORLD_UNIT } from './hazardPatterns';
import { getPitDefinitions, isPitClearance } from './PitSpawner';
import { getStoryPitDefinitions } from './storyPitSchedule';
import { STORY_STAGES } from './storyConfig';
import { getStoryHazardSchedule } from './storyCourses';
import { RUNNER_BIOMES } from '../visuals/runnerBiomes';
import { getHazardGeometry } from './CollisionSystem';
import type { HazardDefinition } from './hazardTypes';
import { RUNNER_PLAYER_X } from './RunnerPlayer';
import { createRunnerSnapshot, startRunner } from './RunnerSimulation';

const PICKUP_TEST_MARGIN_PX = 12;

function pickupOverlapsHazard(
  pickup: { distanceMeters: number; heightUnits: number },
  hazard: { distanceMeters: number; definition: HazardDefinition },
): boolean {
  const halfExtent = Math.max(getPickupBodySize('tokino-mary') / 2, 11);
  const centerY = RUNNER_GROUND_Y - pickup.heightUnits;
  const pickupTop = centerY - halfExtent - PICKUP_TEST_MARGIN_PX;
  const pickupBottom = centerY + halfExtent + PICKUP_TEST_MARGIN_PX;
  const geometry = getHazardGeometry(hazard.definition, 0);
  const hazardTop = geometry.y - PICKUP_TEST_MARGIN_PX;
  const hazardBottom = geometry.y + geometry.height + PICKUP_TEST_MARGIN_PX;
  if (pickupTop > hazardBottom || pickupBottom < hazardTop) return false;
  const halfWidthMeters = (halfExtent + hazard.definition.width / 2 + 2 * PICKUP_TEST_MARGIN_PX) *
    RUNNER_CONFIG.metersPerWorldUnit;
  return Math.abs(pickup.distanceMeters - hazard.distanceMeters) <= halfWidthMeters;
}

function makeGraphics() {
  const graphics = {
    fillStyle: vi.fn(() => graphics), lineStyle: vi.fn(() => graphics),
    fillCircle: vi.fn(() => graphics), strokeCircle: vi.fn(() => graphics),
    fillRoundedRect: vi.fn(() => graphics), strokeRoundedRect: vi.fn(() => graphics),
    fillEllipse: vi.fn(() => graphics), fillTriangle: vi.fn(() => graphics),
    lineBetween: vi.fn(() => graphics),
  };
  return graphics;
}

function makeDisplayObject() {
  const calls: Record<string, ReturnType<typeof vi.fn>> = {};
  const body = { setAllowGravity: vi.fn(), setImmovable: vi.fn(), setSize: vi.fn(), setCircle: vi.fn() };
  let proxy: Record<string, unknown>;
  proxy = new Proxy({ body } as Record<string, unknown>, {
    get: (_target, property) => {
      if (property === 'body') return body;
      if (typeof property !== 'string') return undefined;
      if (!calls[property]) calls[property] = vi.fn(() => proxy);
      return calls[property];
    },
  });
  return { display: proxy, calls, body };
}

function makeSpawnerScene() {
  const rectangles: ReturnType<typeof makeDisplayObject>[] = [];
  const graphics: ReturnType<typeof makeDisplayObject>[] = [];
  const texts: ReturnType<typeof makeDisplayObject>[] = [];
  const scene = {
    add: {
      rectangle: vi.fn(() => { const item = makeDisplayObject(); rectangles.push(item); return item.display; }),
      graphics: vi.fn(() => { const item = makeDisplayObject(); graphics.push(item); return item.display; }),
      text: vi.fn(() => { const item = makeDisplayObject(); texts.push(item); return item.display; }),
    },
    physics: { add: { existing: vi.fn(), overlap: vi.fn() } },
    time: { delayedCall: vi.fn((_delay: number, callback: () => void) => callback()) },
  };
  return { scene: scene as unknown as Phaser.Scene, rectangles, graphics, texts };
}

describe('authored collectible schedule', () => {
  it('uses unique stable IDs and increasing absolute distances', () => {
    expect(new Set(PICKUP_SCHEDULE.map((pickup) => pickup.id)).size).toBe(PICKUP_SCHEDULE.length);
    const sorted = [...PICKUP_SCHEDULE].sort((a, b) => a.distanceMeters - b.distanceMeters);
    expect(PICKUP_SCHEDULE).toEqual(sorted);
    expect(PICKUP_SCHEDULE[0].distanceMeters).toBe(160);
    expect(PICKUP_SCHEDULE.at(-1)?.distanceMeters).toBeLessThanOrEqual(15_000);
    expect(PICKUP_SCHEDULE.length).toBeGreaterThan(70);
  });

  it('generates a stable safe-route stream with 100–150m cadence and time items replacing coins', () => {
    const generated = generatePickupSchedule(15_000);
    expect(generated).toEqual(PICKUP_SCHEDULE);
    const safe = generated.filter((item) => !item.optionalJump && item.kind !== 'giant');
    expect(safe[0]).toMatchObject({ distanceMeters: 160, heightUnits: 52, optionalJump: false });
    const knownHazards: { distanceMeters: number; definition: HazardDefinition }[] = [];
    for (let patternIndex = 0; ; patternIndex += 1) {
      const start = getPatternStartDistance(patternIndex);
      if (start > 15_000) break;
      for (const hazard of getPatternForDistance(start).obstacles) {
        knownHazards.push({ distanceMeters: getHazardDistance(patternIndex, hazard), definition: hazard });
      }
    }
    const knownPits = getPitDefinitions(15_000);
    for (let index = 1; index < safe.length; index += 1) {
      const previous = safe[index - 1].distanceMeters;
      const current = safe[index].distanceMeters;
      const gap = current - previous;
      expect(gap).toBeGreaterThanOrEqual(100);
      if (gap > 150) {
        const pickupHalfWidthMeters = (getPickupBodySize('tokino-mary') / 2 + PICKUP_TEST_MARGIN_PX) *
          RUNNER_CONFIG.metersPerWorldUnit;
        const nearestDistance = (distance: number) => Math.max(previous, Math.min(current, distance));
        const blocked = knownHazards.some((hazard) => pickupOverlapsHazard({
          distanceMeters: nearestDistance(hazard.distanceMeters), heightUnits: 52,
        }, hazard)) || knownPits.some((pit) => isPitClearance(nearestDistance(pit.distanceMeters), pit,
          PICKUP_PIT_CLEARANCE_METERS + pickupHalfWidthMeters)) ||
          RUNNER_GATE_DISTANCES_M.some((gate) => isGateClearance(nearestDistance(gate), gate, pickupHalfWidthMeters));
        expect(blocked, `the ${gap}m safe-pickup gap has no hazard or course landmark`).toBe(true);
      }
    }
    expect(Math.max(...safe.slice(1).map((item, index) => item.distanceMeters - safe[index].distanceMeters)))
      .toBeLessThanOrEqual(700); // nearby pit and gate clear zones can remove several safe-route slots.
    const timeItems = safe.filter((item) => item.kind === 'time');
    expect(timeItems.length).toBeGreaterThan(0);
    for (const item of timeItems) {
      const slotIndex = Number(item.id.slice('time-'.length));
      const target = 160 + slotIndex * RUNNER_CONFIG.safePickupSpacingMeters;
      expect(Math.abs(item.distanceMeters - target)).toBeLessThanOrEqual(75);
    }
  });

  it('keeps optional coins elevated and omits unsafe positions', () => {
    const optional = PICKUP_SCHEDULE.filter((pickup) => pickup.optionalJump);
    expect(optional.length).toBeGreaterThan(0);
    expect(optional.every((pickup) => pickup.kind === 'coin' && pickup.heightUnits === 116)).toBe(true);
    expect(optional.length).toBeLessThan(25); // unsafe authored slots are omitted
  });

  it('schedules giant pickups deterministically outside course hazards, landmarks, and other pickups', () => {
    const generated = generatePickupSchedule(15_000);
    const giants = generated.filter(({ kind }) => kind === 'giant');
    expect(giants.length).toBeGreaterThan(5);
    expect(giants).toEqual(generatePickupSchedule(15_000).filter(({ kind }) => kind === 'giant'));
    expect(giants.every(({ heightUnits, optionalJump }) => heightUnits === 52 && !optionalJump)).toBe(true);
    const wavePeriod = (RUNNER_CONFIG.densePatternsPerSection - 1) *
      RUNNER_CONFIG.densePatternSpacingMeters + RUNNER_CONFIG.denseRecoveryGapMeters;
    const maxEffectiveMetersPerSecond = 469.21875 * RUNNER_CONFIG.metersPerWorldUnit;
    for (const giant of giants) {
      const matchedWave = Array.from({ length: 20 }, (_, index) =>
        RUNNER_CONFIG.denseSectionStartMeters + index * wavePeriod,
      ).find((waveStart) => Math.abs(giant.distanceMeters -
        (waveStart - RUNNER_CONFIG.giantPickupLeadMeters)) <= RUNNER_CONFIG.giantPickupSearchRadiusMeters);
      expect(matchedWave, `giant at ${giant.distanceMeters}m must be tied to a dense wave`).toBeDefined();
      expect(giant.distanceMeters).toBeLessThan(matchedWave!);
      expect((matchedWave! + (RUNNER_CONFIG.densePatternsPerSection - 1) *
        RUNNER_CONFIG.densePatternSpacingMeters - giant.distanceMeters) /
        maxEffectiveMetersPerSecond).toBeLessThanOrEqual(RUNNER_CONFIG.giantDurationMs / 1_000);
    }
    for (const giant of giants) {
      expect(generated.filter((item) => item.id !== giant.id).every((item) =>
        Math.abs(item.distanceMeters - giant.distanceMeters) >= 30)).toBe(true);
    }
  });

  it('keeps every pickup outside low and overhead hazard art and collision bounds', () => {
    const maxDistance = PICKUP_SCHEDULE.at(-1)!.distanceMeters;
    const hazards: { distanceMeters: number; definition: HazardDefinition }[] = [];
    for (let patternIndex = 0; ; patternIndex += 1) {
      const start = getPatternStartDistance(patternIndex);
      if (start > maxDistance) break;
      for (const hazard of getPatternForDistance(start).obstacles) {
        hazards.push({ distanceMeters: getHazardDistance(patternIndex, hazard), definition: hazard });
      }
    }

    const pits = getPitDefinitions(maxDistance + PICKUP_PIT_CLEARANCE_METERS);
    for (const pickup of PICKUP_SCHEDULE) {
      for (const hazard of hazards) {
        expect(pickupOverlapsHazard(pickup, hazard),
          `${pickup.id} overlaps a ${hazard.definition.kind} hazard at ${hazard.distanceMeters}m`,
        ).toBe(false);
      }
      for (const pit of pits) {
        const pickupHalfWidthMeters = (getPickupBodySize('tokino-mary') / 2 + PICKUP_TEST_MARGIN_PX) *
          RUNNER_CONFIG.metersPerWorldUnit;
        expect(isPitClearance(pickup.distanceMeters, pit,
          PICKUP_PIT_CLEARANCE_METERS + pickupHalfWidthMeters),
          `${pickup.id} overlaps pit clearance at ${pit.distanceMeters}m`).toBe(false);
      }
      for (const gate of RUNNER_GATE_DISTANCES_M) {
        const halfWidthMeters = (getPickupBodySize('tokino-mary') / 2 + PICKUP_TEST_MARGIN_PX) *
          RUNNER_CONFIG.metersPerWorldUnit;
        expect(isGateClearance(pickup.distanceMeters, gate, halfWidthMeters),
          `${pickup.id} overlaps gate at ${gate}m`).toBe(false);
      }
    }
  });

  it('checks every Story pickup against the selected stage\'s fixed pits', () => {
    for (const stage of STORY_STAGES) {
      const generated = generatePickupSchedule(stage.lengthMeters, stage.id);
      const hazards = getStoryHazardSchedule(stage.id);
      const pits = getStoryPitDefinitions(stage.id, stage.lengthMeters + PICKUP_PIT_CLEARANCE_METERS);
      expect(new Set(generated.map(({ id }) => id)).size).toBe(generated.length);
      expect(generated).toEqual([...generated].sort((a, b) =>
        a.distanceMeters - b.distanceMeters || a.id.localeCompare(b.id)));
      for (const pickup of generated) {
        expect(pickup.distanceMeters).toBeLessThanOrEqual(stage.lengthMeters);
        for (const pit of pits) {
          const halfWidthMeters = (getPickupBodySize('tokino-mary') / 2 + PICKUP_TEST_MARGIN_PX) *
            RUNNER_CONFIG.metersPerWorldUnit;
          expect(isPitClearance(pickup.distanceMeters, pit,
            PICKUP_PIT_CLEARANCE_METERS + halfWidthMeters),
          `${stage.id} ${pickup.id} overlaps pit clearance at ${pit.distanceMeters}m`).toBe(false);
        }
        for (const hazard of hazards) {
          expect(pickupOverlapsHazard(pickup, hazard),
            `${stage.id} ${pickup.id} overlaps hazard at ${hazard.distanceMeters}m`).toBe(false);
        }
      }
      for (const kind of ['coin', 'time', 'giant'] as const) {
        const pickups = generated.filter((pickup) => pickup.kind === kind);
        expect(pickups.every((pickup) => pickup.distanceMeters <= stage.lengthMeters)).toBe(true);
      }
    }
  });

  it('keeps five milestone gates separate from pickups', () => {
    expect(RUNNER_GATE_DISTANCES_M).toEqual([2000, 4000, 6000, 8000, 10000]);
    for (const distance of RUNNER_GATE_DISTANCES_M) {
      const halfWidthMeters = (getPickupBodySize('tokino-mary') / 2 + PICKUP_TEST_MARGIN_PX) *
        RUNNER_CONFIG.metersPerWorldUnit;
      expect(PICKUP_SCHEDULE.every((pickup) =>
        !isGateClearance(pickup.distanceMeters, distance, halfWidthMeters))).toBe(true);
    }
  });
});

describe('pickup collision radius', () => {
  it('reserves pickup-radius expansion for Mary without catching upper coins on the ground', () => {
    expect(getPickupBodySize('player-default')).toBe(64);
    expect(getPickupBodySize('hanayo-hiyori')).toBe(64);
    expect(getPickupBodySize('tokino-mary')).toBe(86);
    const upper = PICKUP_SCHEDULE.find((pickup) => pickup.optionalJump);
    expect(upper).toBeDefined();
    const upperBottom = RUNNER_GROUND_Y - upper!.heightUnits + getPickupBodySize('hanayo-hiyori') / 2;
    const standingTop = RUNNER_GROUND_Y - STANDING_BODY_HEIGHT;
    expect(upperBottom).toBeLessThan(standingTop);
  });
});

describe('themed pickup art', () => {
  it('keeps coin and clock silhouettes distinct and outlined in every biome', () => {
    for (const biome of RUNNER_BIOMES) {
      const coin = makeGraphics();
      drawPickupArt(coin as unknown as Phaser.GameObjects.Graphics, 'coin', biome);
      expect(coin.fillCircle).toHaveBeenCalledWith(0, 0, 11);
      expect(coin.strokeCircle).toHaveBeenCalledWith(0, 0, 11);
      expect(coin.lineStyle).toHaveBeenCalledWith(2, biome.palette.hazardContrast, 0.96);

      const time = makeGraphics();
      drawPickupArt(time as unknown as Phaser.GameObjects.Graphics, 'time', biome);
      expect(time.fillRoundedRect).not.toHaveBeenCalled();
      expect(time.strokeRoundedRect).not.toHaveBeenCalled();
      expect(time.fillTriangle).toHaveBeenCalledTimes(2);
      expect(time.lineBetween).toHaveBeenCalledWith(0, -11, 10, 0);
      expect(time.lineBetween).toHaveBeenCalledWith(-10, 0, 0, -11);
      expect(time.fillStyle).toHaveBeenCalledWith(biome.palette.pickupTime);
      expect(time.fillStyle).not.toHaveBeenCalledWith(biome.palette.pickupCoin);
      expect(time.lineStyle).toHaveBeenCalledWith(2, biome.palette.hazardContrast, 0.96);

      const giant = makeGraphics();
      drawPickupArt(giant as unknown as Phaser.GameObjects.Graphics, 'giant', biome);
      expect(giant.fillCircle).toHaveBeenCalledWith(0, 0, 11);
      expect(giant.fillTriangle).toHaveBeenCalledTimes(4);
      expect(giant.fillStyle).toHaveBeenCalledWith(0xffd66e);
    }
  });

  it('preserves pickup sensor sizes and gate/pickup scrolling positions', () => {
    const mock = makeSpawnerScene();
    const spawner = new CollectibleSpawner(mock.scene, {} as Phaser.Physics.Arcade.Sprite,
      vi.fn(), 'player-default');
    const snapshot = (distanceMeters: number) => ({
      ...startRunner(createRunnerSnapshot('player-default')),
      phase: 'running' as const,
      distanceMeters,
      worldDistance: distanceMeters * RUNNER_CONFIG.metersPerWorldUnit,
    });

    spawner.update(snapshot(0));
    expect((mock.scene.add.rectangle as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      0, 0, getPickupBodySize('player-default'), getPickupBodySize('player-default'), 0xffffff, 0,
    );
    const firstPickupX = RUNNER_PLAYER_X + PICKUP_SCHEDULE[0].distanceMeters / METERS_PER_WORLD_UNIT;
    expect(mock.rectangles[0].calls.setPosition).toHaveBeenCalledWith(firstPickupX,
      RUNNER_GROUND_Y - PICKUP_SCHEDULE[0].heightUnits);

    spawner.update(snapshot(1_780));
    const gateArt = mock.graphics.find(({ calls }) => calls.setDepth?.mock.calls[0]?.[0] === -5);
    expect(gateArt).toBeDefined();
    expect(gateArt!.calls.setPosition).toHaveBeenCalledWith(
      RUNNER_PLAYER_X + (2_000 - 1_780) / METERS_PER_WORLD_UNIT, RUNNER_GROUND_Y,
    );
    expect((mock.scene.physics.add.overlap as ReturnType<typeof vi.fn>).mock.calls.length)
      .toBe(mock.rectangles.length);
    spawner.destroy();
  });
});
