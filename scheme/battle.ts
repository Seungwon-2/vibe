import { z } from 'zod';

// ──────────────── 기술 상세 (PokeAPI /move/{name}) ────────────────

export const MoveDetail = z.object({
  id:   z.number(),
  name: z.string(),
  power:    z.number().nullish(),
  pp:       z.number().nullish(),
  accuracy: z.number().nullish(),
  type:         z.object({ name: z.string() }),
  damage_class: z.object({ name: z.string() }), // physical | special | status
  names: z.array(
    z.object({
      name:     z.string(),
      language: z.object({ name: z.string() }),
    }),
  ),
});

export type MoveDetail = z.infer<typeof MoveDetail>;

// ──────────────── 배틀 전용 타입 (non-Zod) ────────────────

export type BattleMove = {
  name:        string;
  koreanName:  string;
  power:       number;
  pp:          number;
  currentPp:   number;
  accuracy:    number;
  type:        string;
  damageClass: 'physical' | 'special';
};

export type BattlePokemon = {
  id:             number;
  name:           string;         // 영어
  koreanName:     string;
  types:          string[];
  maxHp:          number;
  currentHp:      number;
  attack:         number;
  defense:        number;
  specialAttack:  number;
  specialDefense: number;
  speed:          number;
  moves:          BattleMove[];
  imageUrl:       string;
};

export type BattlePhase =
  | 'select'       // 포켓몬 선택 중
  | 'loading'      // 기술 로딩 중
  | 'player_turn'  // 플레이어 기술 선택 대기
  | 'animating'    // 턴 처리 중 (잠시 잠금)
  | 'game_over';   // 승부 결정

export type LogEntry = {
  id:   number;
  text: string;
  kind: 'action' | 'damage' | 'effectiveness' | 'result';
};

export type BattleState = {
  phase:  BattlePhase;
  player: BattlePokemon | null;
  enemy:  BattlePokemon | null;
  log:    LogEntry[];
  winner: 'player' | 'enemy' | null;
  turn:   number;
};
