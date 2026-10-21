export type WorldId = 'windy-ruins' | 'luminous-mine';
export type StageTheme = 'ruins' | 'mine';
export type CommandKey = 'ARROWUP' | 'ARROWDOWN' | 'ARROWLEFT' | 'ARROWRIGHT' | 'W' | 'A' | 'S' | 'D';

export type PlatformDefinition = { x: number; y: number; width: number; height: number };
export type HazardDefinition = { id: string; kind: 'spikes' | 'pit'; x: number; y: number; width: number; height: number };
export type CoinDefinition = { id: string; x: number; y: number };
export type PickupDefinition = { id: string; x: number; y: number; kind: 'speed' | 'extraLife'; multiplier?: number };
export type EnemySpawn = { id: string; x: number; y: number; patrolDistance: number };
export type CheckpointDefinition = { id: string; x: number; y: number };

export type BossDefinition = {
  id: 'ruins-guardian' | 'mine-warden';
  name: string;
  attackPattern: 'wind-sweep' | 'crystal-burst';
  commandKeys: CommandKey[];
  commands: CommandKey[][];
  commandInputLimitMs: number;
  commandDelayMs: number;
  groggyDurationMs: number;
  rageAfterStomps: number;
  speedMultiplier: number;
  stompsToDefeat: number;
  patrolDistance: number;
};

export type StageDefinition = {
  id: string;
  worldId: WorldId;
  ordinal: number;
  theme: StageTheme;
  name: string;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  exit: { x: number; y: number };
  platforms: PlatformDefinition[];
  hazards: HazardDefinition[];
  coins: CoinDefinition[];
  pickups: PickupDefinition[];
  enemies: EnemySpawn[];
  checkpoints: CheckpointDefinition[];
  timeLimitSeconds?: number;
  fallRule?: 'lose-life-at-checkpoint' | 'restart-at-base';
  persistCoinsOnFall?: boolean;
  boss?: BossDefinition;
};

export type WorldDefinition = {
  id: WorldId;
  name: string;
  subtitle: string;
  theme: StageTheme;
  stages: StageDefinition[];
};

export const INPUT_KEYS: CommandKey[] = [
  'ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'W', 'A', 'S', 'D',
];
