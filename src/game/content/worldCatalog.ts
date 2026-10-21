import type { BossDefinition, StageDefinition, WorldDefinition } from './stageTypes';

const ruinsGuardian: BossDefinition = {
  id: 'ruins-guardian',
  name: '바람 수호자',
  attackPattern: 'wind-sweep',
  commandKeys: ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT'],
  commands: [['ARROWUP', 'ARROWLEFT', 'ARROWRIGHT'], ['ARROWDOWN', 'ARROWRIGHT', 'ARROWUP']],
  commandInputLimitMs: 4_000,
  commandDelayMs: 5_000,
  groggyDurationMs: 3_000,
  rageAfterStomps: 2,
  speedMultiplier: 1.15,
  stompsToDefeat: 3,
  patrolDistance: 250,
};

const mineWarden: BossDefinition = {
  id: 'mine-warden',
  name: '수정 감시자',
  attackPattern: 'crystal-burst',
  commandKeys: ['W', 'A', 'S', 'D'],
  commands: [['W', 'A', 'D', 'S'], ['D', 'W', 'A', 'S', 'D']],
  commandInputLimitMs: 6_000,
  commandDelayMs: 5_000,
  groggyDurationMs: 3_000,
  rageAfterStomps: 2,
  speedMultiplier: 1.15,
  stompsToDefeat: 3,
  patrolDistance: 280,
};

function commonStage(
  id: string,
  worldId: StageDefinition['worldId'],
  ordinal: number,
  theme: StageDefinition['theme'],
  name: string,
  platforms: StageDefinition['platforms'],
  checkpoints: StageDefinition['checkpoints'],
  extras: Partial<StageDefinition> = {},
): StageDefinition {
  const width = extras.width ?? 1_800;
  const height = extras.height ?? 540;
  return {
    id,
    worldId,
    ordinal,
    theme,
    name,
    width,
    height,
    spawn: extras.spawn ?? { x: 90, y: height - 100 },
    exit: extras.exit ?? { x: width - 70, y: height - 80 },
    platforms,
    hazards: extras.hazards ?? [],
    coins: extras.coins ?? [{ id: `${id}-coin-1`, x: 240, y: height - 165 }],
    pickups: extras.pickups ?? [],
    enemies: extras.enemies ?? [{ id: `${id}-enemy-1`, x: 520, y: height - 62, patrolDistance: 120 }],
    checkpoints,
    ...extras,
  };
}

const ruinsStages: StageDefinition[] = [
  commonStage('ruins-1', 'windy-ruins', 1, 'ruins', '바람의 입구', [
    { x: 900, y: 522, width: 1_800, height: 36 },
    { x: 340, y: 410, width: 220, height: 20 }, { x: 710, y: 330, width: 200, height: 20 },
    { x: 1_080, y: 420, width: 240, height: 20 }, { x: 1_440, y: 320, width: 230, height: 20 },
  ], [{ id: 'ruins-1-checkpoint', x: 960, y: 465 }], {
    hazards: [{ id: 'ruins-1-pit', kind: 'pit', x: 610, y: 524, width: 105, height: 32 }],
    coins: [{ id: 'r1-c1', x: 340, y: 365 }, { id: 'r1-c2', x: 710, y: 285 }, { id: 'r1-c3', x: 1_440, y: 275 }],
    pickups: [{ id: 'r1-fast', x: 220, y: 440, kind: 'speed', multiplier: 1.25 }, { id: 'r1-slow', x: 610, y: 440, kind: 'speed', multiplier: 0.7 }],
  }),
  commonStage('ruins-2', 'windy-ruins', 2, 'ruins', '무너진 회랑', [
    { x: 900, y: 522, width: 1_800, height: 36 },
    { x: 430, y: 410, width: 240, height: 20 }, { x: 820, y: 300, width: 200, height: 20 },
    { x: 1_180, y: 390, width: 220, height: 20 }, { x: 1_510, y: 280, width: 220, height: 20 },
  ], [{ id: 'ruins-2-checkpoint', x: 1_000, y: 465 }], {
    hazards: [{ id: 'ruins-2-spikes', kind: 'spikes', x: 700, y: 505, width: 100, height: 22 }],
    coins: [{ id: 'r2-c1', x: 430, y: 365 }, { id: 'r2-c2', x: 820, y: 255 }, { id: 'r2-c3', x: 1_510, y: 235 }],
  }),
  commonStage('ruins-3', 'windy-ruins', 3, 'ruins', '회오리 절벽', [
    { x: 900, y: 522, width: 1_800, height: 36 },
    { x: 390, y: 390, width: 200, height: 20 }, { x: 700, y: 300, width: 190, height: 20 },
    { x: 1_050, y: 400, width: 220, height: 20 }, { x: 1_400, y: 290, width: 220, height: 20 },
  ], [{ id: 'ruins-3-checkpoint', x: 1_000, y: 465 }], {
    hazards: [{ id: 'ruins-3-pit', kind: 'pit', x: 1_210, y: 524, width: 120, height: 32 }],
    coins: [{ id: 'r3-c1', x: 390, y: 345 }, { id: 'r3-c2', x: 700, y: 255 }, { id: 'r3-c3', x: 1_400, y: 245 }],
    pickups: [{ id: 'r3-extra-life', x: 1_470, y: 245, kind: 'extraLife' }],
  }),
  commonStage('ruins-4', 'windy-ruins', 4, 'ruins', '수호자의 제단', [
    { x: 480, y: 522, width: 960, height: 36 },
    { x: 230, y: 410, width: 150, height: 20 }, { x: 730, y: 410, width: 150, height: 20 },
  ], [], {
    width: 960,
    enemies: [],
    coins: [{ id: 'r4-c1', x: 230, y: 365 }],
    boss: ruinsGuardian,
    spawn: { x: 100, y: 440 },
    exit: { x: 900, y: 440 },
  }),
];

const mineStages: StageDefinition[] = [
  commonStage('mine-1', 'luminous-mine', 5, 'mine', '발광 광맥', [
    { x: 900, y: 522, width: 1_800, height: 36 },
    { x: 400, y: 410, width: 240, height: 20 }, { x: 820, y: 320, width: 210, height: 20 },
    { x: 1_190, y: 420, width: 230, height: 20 }, { x: 1_520, y: 300, width: 230, height: 20 },
  ], [{ id: 'mine-1-checkpoint', x: 1_000, y: 465 }], {
    hazards: [{ id: 'mine-1-pit', kind: 'pit', x: 650, y: 524, width: 115, height: 32 }],
    coins: [{ id: 'm1-c1', x: 400, y: 365 }, { id: 'm1-c2', x: 820, y: 275 }, { id: 'm1-c3', x: 1_520, y: 255 }],
  }),
  commonStage('mine-2', 'luminous-mine', 6, 'mine', '수정 운반로', [
    { x: 900, y: 522, width: 1_800, height: 36 },
    { x: 350, y: 410, width: 210, height: 20 }, { x: 720, y: 300, width: 210, height: 20 },
    { x: 1_080, y: 390, width: 220, height: 20 }, { x: 1_460, y: 280, width: 230, height: 20 },
  ], [{ id: 'mine-2-checkpoint', x: 1_000, y: 465 }], {
    hazards: [{ id: 'mine-2-spikes', kind: 'spikes', x: 1_280, y: 505, width: 110, height: 22 }],
    coins: [{ id: 'm2-c1', x: 350, y: 365 }, { id: 'm2-c2', x: 720, y: 255 }, { id: 'm2-c3', x: 1_460, y: 235 }],
    pickups: [{ id: 'm2-fast', x: 550, y: 440, kind: 'speed', multiplier: 1.2 }],
  }),
  commonStage('mine-3', 'luminous-mine', 7, 'mine', '끝없는 승강로', [
    { x: 480, y: 1_470, width: 960, height: 36 },
    { x: 210, y: 1_330, width: 170, height: 20 }, { x: 520, y: 1_210, width: 170, height: 20 },
    { x: 790, y: 1_080, width: 170, height: 20 }, { x: 480, y: 950, width: 170, height: 20 },
    { x: 190, y: 820, width: 160, height: 20 }, { x: 500, y: 690, width: 170, height: 20 },
    { x: 790, y: 560, width: 170, height: 20 }, { x: 500, y: 430, width: 170, height: 20 },
    { x: 200, y: 300, width: 170, height: 20 }, { x: 500, y: 170, width: 960, height: 24 },
  ], [], {
    width: 960,
    height: 1_500,
    spawn: { x: 100, y: 1_385 },
    exit: { x: 500, y: 110 },
    timeLimitSeconds: 120,
    fallRule: 'restart-at-base',
    persistCoinsOnFall: true,
    enemies: [],
    hazards: [],
    coins: [
      { id: 'm3-c1', x: 210, y: 1_280 }, { id: 'm3-c2', x: 790, y: 1_030 },
      { id: 'm3-c3', x: 190, y: 770 }, { id: 'm3-c4', x: 790, y: 510 }, { id: 'm3-c5', x: 200, y: 250 },
    ],
  }),
  commonStage('mine-4', 'luminous-mine', 8, 'mine', '심층 감시실', [
    { x: 480, y: 522, width: 960, height: 36 },
    { x: 240, y: 410, width: 160, height: 20 }, { x: 720, y: 410, width: 160, height: 20 },
  ], [], {
    width: 960,
    enemies: [],
    coins: [{ id: 'm4-c1', x: 240, y: 365 }],
    boss: mineWarden,
    spawn: { x: 100, y: 440 },
    exit: { x: 900, y: 440 },
  }),
];

export const worlds: WorldDefinition[] = [
  { id: 'windy-ruins', name: '바람의 고대 유적', subtitle: '모래바람 속에 잠든 수호자', theme: 'ruins', stages: ruinsStages },
  { id: 'luminous-mine', name: '발광하는 지하 광산', subtitle: '깊은 갱도와 수정 감시자', theme: 'mine', stages: mineStages },
];

export const stageCatalog: StageDefinition[] = worlds.flatMap((world) => world.stages);

export function getStage(stageId: string): StageDefinition {
  const stage = stageCatalog.find((candidate) => candidate.id === stageId);
  if (!stage) throw new Error(`Unknown stage id: ${stageId}`);
  return stage;
}

export function getStageByOrdinal(ordinal: number): StageDefinition | undefined {
  return stageCatalog.find((stage) => stage.ordinal === ordinal);
}
