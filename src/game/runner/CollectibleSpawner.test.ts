import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { drawPickupArt, generatePickupSchedule, getPickupBodySize,
  CollectibleSpawner, PICKUP_PIT_CLEARANCE_METERS, PICKUP_SCHEDULE } from './CollectibleSpawner';
import { RUNNER_GROUND_Y, STANDING_BODY_HEIGHT } from './runnerPose';
import { RUNNER_CONFIG, RUNNER_GATE_DISTANCES_M } from './runnerConfig';
import { getDenseWaveSchedule, getHazardDistance, getPatternForDistance, getPatternStartDistance, isGateClearance,
  MAX_RUN_SPEED_UNITS_PER_SECOND, METERS_PER_WORLD_UNIT } from './hazardPatterns';
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
  pickup: { distanceMeters: number; heightUnits: number; guideAction?: 'jump' | 'slide'; guideHazardId?: string },
  hazard: { id: string; distanceMeters: number; definition: HazardDefinition },
): boolean {
  if (pickup.guideAction === 'slide' && pickup.guideHazardId === hazard.id) return false;
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

  it('generates a stable Endless safe-route coin stream with 75m cadence and no timer pickups', () => {
    const generated = generatePickupSchedule(15_000);
    expect(generated).toEqual(PICKUP_SCHEDULE);
    const safe = generated.filter((item) => !item.optionalJump && !item.guideAction && item.kind !== 'giant');
    expect(safe[0]).toMatchObject({ distanceMeters: 160, heightUnits: 52, optionalJump: false });
    const knownHazards: { id: string; distanceMeters: number; definition: HazardDefinition }[] = [];
    for (let patternIndex = 0; ; patternIndex += 1) {
      const start = getPatternStartDistance(patternIndex);
      if (start > 15_000) break;
      for (const hazard of getPatternForDistance(start).obstacles) {
        knownHazards.push({ id: `endless-${patternIndex}-${hazard.id}`,
          distanceMeters: getHazardDistance(patternIndex, hazard), definition: hazard });
      }
    }
    const knownPits = getPitDefinitions(15_000);
    for (let index = 1; index < safe.length; index += 1) {
      const previous = safe[index - 1].distanceMeters;
      const current = safe[index].distanceMeters;
      const gap = current - previous;
      expect(gap).toBeGreaterThanOrEqual(RUNNER_CONFIG.safePickupMinimumGapMeters);
      if (gap > RUNNER_CONFIG.safePickupMaximumGapMeters) {
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
    expect(generated.some((item) => item.kind === 'time')).toBe(false);
    expect(safe.every((item) => item.kind === 'coin' && item.id.startsWith('safe-'))).toBe(true);
  });

  it('keeps the authored Story safe-route cadence at 90m', () => {
    expect(RUNNER_CONFIG.safePickupSpacingMeters).toBe(90);
    for (const stage of STORY_STAGES) {
      const safe = generatePickupSchedule(stage.lengthMeters, stage.id)
        .filter((item) => !item.optionalJump && !item.guideAction && item.kind !== 'giant');
      expect(safe.some((item) => item.kind === 'time'), `${stage.id} should retain speed-boost pickups`).toBe(true);
      expect(safe.length, `${stage.id} should retain its safe-route pickups`).toBeGreaterThan(0);
      for (const item of safe) {
        const slotIndex = Number(item.id.slice(item.kind === 'time' ? 'time-'.length : 'safe-'.length));
        const target = 160 + slotIndex * RUNNER_CONFIG.safePickupSpacingMeters;
        expect(Math.abs(item.distanceMeters - target), `${stage.id}:${item.id}`).toBeLessThanOrEqual(25);
      }
    }
  });

  it('keeps optional coins elevated and omits unsafe positions', () => {
    const optional = PICKUP_SCHEDULE.filter((pickup) => pickup.guideAction === 'jump');
    expect(optional.length).toBeGreaterThan(0);
    expect(optional.every((pickup) => pickup.kind === 'coin' && pickup.heightUnits === 132)).toBe(true);
    expect(optional.every((pickup) => pickup.optionalJump)).toBe(true);
    expect(optional.length).toBeLessThan(60); // unsafe authored slots are omitted
  });

  it('adds deterministic three-coin strings for jump and slide routes in Endless and every Story course', () => {
    const schedules = [generatePickupSchedule(15_000), ...STORY_STAGES.map((stage) =>
      generatePickupSchedule(stage.lengthMeters, stage.id))];
    for (const [scheduleIndex, schedule] of schedules.entries()) {
      expect(schedule).toEqual([...schedule].sort((a, b) =>
        a.distanceMeters - b.distanceMeters || a.id.localeCompare(b.id)));
      for (let leftIndex = 0; leftIndex < schedule.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < schedule.length; rightIndex += 1) {
          const left = schedule[leftIndex];
          const right = schedule[rightIndex];
          const sameGuideLine = left.guideAction !== undefined &&
            left.guideAction === right.guideAction && left.guideHazardId === right.guideHazardId;
          const minimumGap = left.kind === 'giant' || right.kind === 'giant'
            ? RUNNER_CONFIG.pickupObjectClearanceMeters
            : RUNNER_CONFIG.pickupCoinVisualClearanceMeters;
          expect(Math.abs(right.distanceMeters - left.distanceMeters) >= minimumGap || sameGuideLine,
            `${left.id} and ${right.id} overlap in schedule ${scheduleIndex}`).toBe(true);
        }
      }
      for (const action of ['jump', 'slide'] as const) {
        const lines = new Map<string, (typeof schedule)[number][]>();
        for (const pickup of schedule.filter((item) => item.guideAction === action)) {
          const row = lines.get(pickup.guideHazardId!) ?? [];
          row.push(pickup);
          lines.set(pickup.guideHazardId!, row);
        }
        expect(lines.size, `${action} strings should appear in schedule ${scheduleIndex}`).toBeGreaterThan(0);
        for (const row of lines.values()) {
          expect(row).toHaveLength(3);
          const distances = row.map(({ distanceMeters }) => distanceMeters).sort((a, b) => a - b);
          expect(distances[1] - distances[0]).toBe(RUNNER_CONFIG.postJumpCoinRowSpacingMeters);
          expect(distances[2] - distances[1]).toBe(RUNNER_CONFIG.postJumpCoinRowSpacingMeters);
          expect(row.every(({ kind, heightUnits, optionalJump }) => kind === 'coin' &&
            (action === 'jump' ? heightUnits === 132 && optionalJump : heightUnits === 14 && !optionalJump)))
            .toBe(true);
        }
      }
    }
  });

  it('schedules giant pickups deterministically outside course hazards, landmarks, and other pickups', () => {
    const generated = generatePickupSchedule(15_000);
    const giants = generated.filter(({ kind }) => kind === 'giant');
    expect(giants.length).toBeGreaterThan(5);
    expect(giants).toEqual(generatePickupSchedule(15_000).filter(({ kind }) => kind === 'giant'));
    expect(giants.every(({ heightUnits, optionalJump }) => heightUnits === 52 && !optionalJump)).toBe(true);
    for (const giant of giants) {
      const matchedWave = Array.from({ length: 100 }, (_, index) => getDenseWaveSchedule(index))
        .find(({ waveStartMeters }) => Math.abs(giant.distanceMeters -
          (waveStartMeters - RUNNER_CONFIG.giantPickupLeadMeters)) <=
          RUNNER_CONFIG.giantPickupSearchRadiusMeters);
      expect(matchedWave, `giant at ${giant.distanceMeters}m must be tied to a dense wave`).toBeDefined();
      expect(giant.distanceMeters).toBeLessThan(matchedWave!.waveStartMeters);
      expect((matchedWave!.patternDistances.at(-1)! - giant.distanceMeters) /
        (MAX_RUN_SPEED_UNITS_PER_SECOND * RUNNER_CONFIG.metersPerWorldUnit))
        .toBeLessThanOrEqual(RUNNER_CONFIG.giantDurationMs / 1_000);
    }
    for (const giant of giants) {
      expect(generated.filter((item) => item.id !== giant.id).every((item) =>
        Math.abs(item.distanceMeters - giant.distanceMeters) >= 30)).toBe(true);
    }
  });

  it('places Story giants only before authored obstacle groups covered by the effect', () => {
    for (const stage of STORY_STAGES) {
      const generated = generatePickupSchedule(stage.lengthMeters, stage.id);
      const hazards = [...getStoryHazardSchedule(stage.id)].sort((a, b) =>
        a.distanceMeters - b.distanceMeters);
      const groups: typeof hazards[] = [];
      for (const hazard of hazards) {
        const group = groups.at(-1);
        if (!group || hazard.distanceMeters - group.at(-1)!.distanceMeters > 350) groups.push([hazard]);
        else group.push(hazard);
      }
      const targets = groups.filter((group) => group.length >= 2).map((group) => ({
        startMeters: group[0].distanceMeters,
        endMeters: group.at(-1)!.distanceMeters,
      }));
      const giants = generated.filter((pickup) => pickup.kind === 'giant');
      const pits = getStoryPitDefinitions(stage.id, stage.lengthMeters + PICKUP_PIT_CLEARANCE_METERS);
      for (const giant of giants) {
        const target = targets.find(({ startMeters, endMeters }) =>
          giant.distanceMeters < startMeters &&
          Math.abs(giant.distanceMeters - (startMeters - RUNNER_CONFIG.giantPickupLeadMeters)) <=
            RUNNER_CONFIG.giantPickupSearchRadiusMeters &&
          (endMeters - giant.distanceMeters) /
            (MAX_RUN_SPEED_UNITS_PER_SECOND * RUNNER_CONFIG.metersPerWorldUnit) <=
              RUNNER_CONFIG.giantDurationMs / 1_000);
        expect(target, `${stage.id} giant at ${giant.distanceMeters}m must cover an authored group`)
          .toBeDefined();
        for (const pit of pits) {
          const halfWidthMeters = (getPickupBodySize('tokino-mary') / 2 + PICKUP_TEST_MARGIN_PX) *
            RUNNER_CONFIG.metersPerWorldUnit;
          expect(isPitClearance(giant.distanceMeters, pit,
            PICKUP_PIT_CLEARANCE_METERS + halfWidthMeters)).toBe(false);
        }
      }
      expect(giants.length).toBeLessThanOrEqual(targets.length);
    }
  });

  it('keeps every pickup outside low and overhead hazard art and collision bounds', () => {
    const maxDistance = PICKUP_SCHEDULE.at(-1)!.distanceMeters;
    const hazards: { id: string; distanceMeters: number; definition: HazardDefinition }[] = [];
    for (let patternIndex = 0; ; patternIndex += 1) {
      const start = getPatternStartDistance(patternIndex);
      if (start > maxDistance) break;
      for (const hazard of getPatternForDistance(start).obstacles) {
        hazards.push({ id: `endless-${patternIndex}-${hazard.id}`,
          distanceMeters: getHazardDistance(patternIndex, hazard), definition: hazard });
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
  it('uses the same pickup sensor size for every character without catching upper coins on the ground', () => {
    expect(getPickupBodySize('player-default')).toBe(64);
    expect(getPickupBodySize('hanayo-hiyori')).toBe(64);
    expect(getPickupBodySize('tokino-mary')).toBe(64);
    expect(getPickupBodySize('goth-student')).toBe(64);
    expect(getPickupBodySize('cogane-rang')).toBe(64);
    const upper = PICKUP_SCHEDULE.find((pickup) => pickup.optionalJump);
    expect(upper).toBeDefined();
    const upperBottom = RUNNER_GROUND_Y - upper!.heightUnits + getPickupBodySize('hanayo-hiyori') / 2;
    const standingTop = RUNNER_GROUND_Y - STANDING_BODY_HEIGHT;
    expect(upperBottom).toBeLessThan(standingTop);
  });
});

describe('Mary pickup magnet', () => {
  const snapshotAt = (characterId: 'tokino-mary' | 'player-default', distanceMeters: number,
    story = false) => ({
    ...startRunner(createRunnerSnapshot(characterId, new Date('2026-11-03T00:00:00.000Z'), story
      ? { mode: 'story', storyStageId: 'dawn-city' }
      : {})),
    phase: 'running' as const,
    distanceMeters,
    worldDistance: distanceMeters * RUNNER_CONFIG.metersPerWorldUnit,
  });

  function activePickup(spawner: CollectibleSpawner, id: string) {
    return (spawner as unknown as { active: Array<{
      definition: { id: string; kind: string; distanceMeters: number };
      box: { setPosition: ReturnType<typeof vi.fn> };
      magnetStarted: boolean;
      sparkle: { setVisible: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> } | null;
    }> }).active.find(({ definition }) => definition.id === id)!;
  }

  it('pulls a nearby coin toward Mary over 300ms, follows her moving center, and cleans its sparkle', () => {
    const mock = makeSpawnerScene();
    const body = { center: { x: RUNNER_PLAYER_X, y: 432 } };
    const player = { x: RUNNER_PLAYER_X, y: RUNNER_GROUND_Y, body } as unknown as Phaser.Physics.Arcade.Sprite;
    const spawner = new CollectibleSpawner(mock.scene, player, vi.fn(), 'tokino-mary');
    const beforeSchedule = [...PICKUP_SCHEDULE];

    spawner.update(snapshotAt('tokino-mary', 120), 100);
    const coin = activePickup(spawner, 'safe-0');
    expect(coin.definition).toMatchObject({ kind: 'coin', distanceMeters: 160 });
    expect(coin.magnetStarted).toBe(true);
    const firstPosition = coin.box.setPosition.mock.calls.at(-1)!;
    expect(firstPosition[0]).toBeGreaterThan(RUNNER_PLAYER_X);
    expect(firstPosition[0]).toBeLessThan(290); // Normal projected x is 290px; magnet moves it left.
    expect(coin.sparkle).not.toBeNull();
    expect((mock.scene.physics.add.existing as unknown as ReturnType<typeof vi.fn>).mock.calls.length)
      .toBe(mock.rectangles.length); // The sparkle remains a display-only Graphics object.

    body.center.x = RUNNER_PLAYER_X + 10;
    body.center.y = 410;
    spawner.update(snapshotAt('tokino-mary', 130), 200);
    expect(coin.box.setPosition).toHaveBeenLastCalledWith(RUNNER_PLAYER_X + 10, 410);
    expect(coin.sparkle!.setVisible).toHaveBeenCalledWith(false);
    expect(PICKUP_SCHEDULE).toEqual(beforeSchedule);

    const sparkle = coin.sparkle!;
    spawner.destroy();
    expect(sparkle.destroy).toHaveBeenCalledOnce();
  });

  it('pulls Story time pickups but never attracts a giant pickup', () => {
    const storyTime = generatePickupSchedule(2_500, 'dawn-city').find(({ kind }) => kind === 'time');
    expect(storyTime).toBeDefined();
    const storyMock = makeSpawnerScene();
    const storyPlayer = { x: RUNNER_PLAYER_X, y: RUNNER_GROUND_Y,
      body: { center: { x: RUNNER_PLAYER_X, y: RUNNER_GROUND_Y - 52 } } } as unknown as Phaser.Physics.Arcade.Sprite;
    const storySpawner = new CollectibleSpawner(storyMock.scene, storyPlayer, vi.fn(), 'tokino-mary');
    storySpawner.update(snapshotAt('tokino-mary', storyTime!.distanceMeters - 30, true), 16);
    expect(activePickup(storySpawner, storyTime!.id).magnetStarted).toBe(true);
    storySpawner.destroy();

    const giant = PICKUP_SCHEDULE.find(({ kind }) => kind === 'giant');
    expect(giant).toBeDefined();
    const endlessMock = makeSpawnerScene();
    const endlessPlayer = { x: RUNNER_PLAYER_X, y: RUNNER_GROUND_Y,
      body: { center: { x: RUNNER_PLAYER_X, y: RUNNER_GROUND_Y - 52 } } } as unknown as Phaser.Physics.Arcade.Sprite;
    const endlessSpawner = new CollectibleSpawner(endlessMock.scene, endlessPlayer, vi.fn(), 'tokino-mary');
    endlessSpawner.update(snapshotAt('tokino-mary', giant!.distanceMeters - 30), 16);
    expect(activePickup(endlessSpawner, giant!.id).magnetStarted).toBe(false);
    expect(activePickup(endlessSpawner, giant!.id).sparkle).toBeNull();
    endlessSpawner.destroy();
  });

  it('does not start outside 150px or for non-Mary characters', () => {
    const maryMock = makeSpawnerScene();
    const maryPlayer = { x: RUNNER_PLAYER_X, y: RUNNER_GROUND_Y,
      body: { center: { x: RUNNER_PLAYER_X, y: RUNNER_GROUND_Y - 52 } } } as unknown as Phaser.Physics.Arcade.Sprite;
    const mary = new CollectibleSpawner(maryMock.scene, maryPlayer, vi.fn(), 'tokino-mary');
    mary.update(snapshotAt('tokino-mary', 109), 16); // First coin is 153px horizontally and 0px vertically away.
    expect(activePickup(mary, 'safe-0').magnetStarted).toBe(false);
    mary.destroy();

    const rinMock = makeSpawnerScene();
    const rinPlayer = { x: RUNNER_PLAYER_X, y: RUNNER_GROUND_Y,
      body: { center: { x: RUNNER_PLAYER_X, y: RUNNER_GROUND_Y - 52 } } } as unknown as Phaser.Physics.Arcade.Sprite;
    const rin = new CollectibleSpawner(rinMock.scene, rinPlayer, vi.fn(), 'player-default');
    rin.update(snapshotAt('player-default', 120), 100);
    expect(activePickup(rin, 'safe-0').magnetStarted).toBe(false);
    expect(activePickup(rin, 'safe-0').sparkle).toBeNull();
    rin.destroy();
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
      expect(giant.fillCircle).not.toHaveBeenCalled();
      expect(giant.strokeCircle).not.toHaveBeenCalled();
      expect(giant.fillTriangle).toHaveBeenCalledTimes(10);
      expect(giant.fillStyle).toHaveBeenCalledWith(0x9b5de5, 1);
      expect(giant.fillStyle).toHaveBeenCalledWith(0xff77b7, 0.96);
      expect(giant.lineStyle).toHaveBeenCalledWith(2, 0xffffff, 1);
      expect(giant.lineBetween).toHaveBeenCalledWith(0, -18, 4, -4);
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
