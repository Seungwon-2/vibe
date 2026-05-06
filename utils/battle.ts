import { getTypeEffectiveness, getEffectivenessLabel } from '@/const/typeEffectiveness';
import { OFFICIAL_ARTWORK_URL } from '@/const/pokemon';
import type { BattleMove, BattlePokemon, LogEntry, MoveDetail } from '@/scheme/battle';
import type { PokemonDetail } from '@/scheme/pokemon';

// ──────────────── 능력치 계산 (Lv.50, IV=31, EV=0) ────────────────

const LEVEL = 50;

export function calcHp(baseHp: number): number {
  return Math.floor(((2 * baseHp + 31) * LEVEL) / 100) + LEVEL + 10;
}

export function calcStat(baseStat: number): number {
  return Math.floor(((2 * baseStat + 31) * LEVEL) / 100) + 5;
}

// ──────────────── 기술 빌더 ────────────────

export function buildBattleMove(moveDetail: MoveDetail): BattleMove {
  const koName =
    moveDetail.names.find((n) => n.language.name === 'ko')?.name ?? moveDetail.name;
  const pp = moveDetail.pp ?? 10;
  return {
    name:        moveDetail.name,
    koreanName:  koName,
    power:       moveDetail.power ?? 50,
    pp,
    currentPp:   pp,
    accuracy:    moveDetail.accuracy ?? 100,
    type:        moveDetail.type.name,
    damageClass: moveDetail.damage_class.name === 'special' ? 'special' : 'physical',
  };
}

// ──────────────── 배틀 포켓몬 빌더 ────────────────

export function buildBattlePokemon(
  detail: PokemonDetail,
  moves: BattleMove[],
  koreanName: string,
): BattlePokemon {
  const base = (name: string) =>
    detail.stats.find((s) => s.stat.name === name)?.base_stat ?? 50;

  const maxHp = calcHp(base('hp'));

  return {
    id:             detail.id,
    name:           detail.name,
    koreanName,
    types:          detail.types.map((t) => t.type.name),
    maxHp,
    currentHp:      maxHp,
    attack:         calcStat(base('attack')),
    defense:        calcStat(base('defense')),
    specialAttack:  calcStat(base('special-attack')),
    specialDefense: calcStat(base('special-defense')),
    speed:          calcStat(base('speed')),
    moves,
    imageUrl:
      detail.sprites.other?.['official-artwork'].front_default ??
      OFFICIAL_ARTWORK_URL(detail.id),
  };
}

// ──────────────── 데미지 계산 ────────────────

export function calcDamage(
  attacker: BattlePokemon,
  move: BattleMove,
  defender: BattlePokemon,
): { damage: number; effectiveness: number; stab: boolean } {
  const isPhysical = move.damageClass === 'physical';
  const atk = isPhysical ? attacker.attack : attacker.specialAttack;
  const def = isPhysical ? defender.defense : defender.specialDefense;

  const base =
    Math.floor((((2 * LEVEL) / 5 + 2) * move.power * atk) / def) / 50 + 2;

  const effectiveness = getTypeEffectiveness(move.type, defender.types);
  const stab          = attacker.types.includes(move.type);
  const stabMod       = stab ? 1.5 : 1;
  const random        = 0.85 + Math.random() * 0.15;

  const damage = Math.max(1, Math.floor(base * stabMod * effectiveness * random));
  return { damage, effectiveness, stab };
}

// ──────────────── AI 기술 선택 ────────────────

export function selectAiMove(ai: BattlePokemon, target: BattlePokemon): BattleMove {
  const scored = ai.moves
    .filter((m) => m.currentPp > 0)
    .map((m) => ({
      move:  m,
      score: m.power * getTypeEffectiveness(m.type, target.types) * (ai.types.includes(m.type) ? 1.5 : 1),
    }));
  if (scored.length === 0) return ai.moves[0];
  return scored.reduce((a, b) => (a.score >= b.score ? a : b)).move;
}

// ──────────────── 턴 처리 ────────────────

let logId = 0;
function log(text: string, kind: LogEntry['kind']): LogEntry {
  return { id: logId++, text, kind };
}

export interface TurnResult {
  newPlayer: BattlePokemon;
  newEnemy:  BattlePokemon;
  newLog:    LogEntry[];
  winner:    'player' | 'enemy' | null;
}

export function processTurn(
  player:     BattlePokemon,
  playerMove: BattleMove,
  enemy:      BattlePokemon,
): TurnResult {
  const entries: LogEntry[] = [];

  // 깊은 복사
  let p = { ...player, moves: player.moves.map((m) => ({ ...m })) };
  let e = { ...enemy,  moves: enemy.moves.map((m)  => ({ ...m })) };

  const aiMove     = selectAiMove(e, p);
  const playerFirst = p.speed > e.speed || (p.speed === e.speed && Math.random() < 0.5);

  /** 공격 처리 → [updatedAttacker, updatedDefender] */
  function doAttack(
    att: BattlePokemon,
    move: BattleMove,
    def: BattlePokemon,
  ): [BattlePokemon, BattlePokemon] {
    // PP 차감
    const updAtt = {
      ...att,
      moves: att.moves.map((m) =>
        m.name === move.name ? { ...m, currentPp: Math.max(0, m.currentPp - 1) } : m,
      ),
    };

    entries.push(log(`${att.koreanName}이(가) ${move.koreanName}을(를) 사용했다!`, 'action'));

    // 명중 판정
    if (Math.random() * 100 > move.accuracy) {
      entries.push(log(`공격이 빗나갔다!`, 'damage'));
      return [updAtt, def];
    }

    const { damage, effectiveness, stab } = calcDamage(updAtt, move, def);
    if (stab) entries.push(log('자속 보정!', 'effectiveness'));
    const effText = getEffectivenessLabel(effectiveness);
    if (effText) entries.push(log(effText, 'effectiveness'));
    entries.push(log(`${def.koreanName}에게 ${damage} 데미지!`, 'damage'));

    const updDef = { ...def, currentHp: Math.max(0, def.currentHp - damage) };
    return [updAtt, updDef];
  }

  let winner: 'player' | 'enemy' | null = null;

  if (playerFirst) {
    [p, e] = doAttack(p, playerMove, e);
    if (e.currentHp <= 0) {
      entries.push(log(`${e.koreanName}이(가) 쓰러졌다!`, 'result'));
      winner = 'player';
    } else {
      [e, p] = doAttack(e, aiMove, p);
      if (p.currentHp <= 0) {
        entries.push(log(`${p.koreanName}이(가) 쓰러졌다!`, 'result'));
        winner = 'enemy';
      }
    }
  } else {
    [e, p] = doAttack(e, aiMove, p);
    if (p.currentHp <= 0) {
      entries.push(log(`${p.koreanName}이(가) 쓰러졌다!`, 'result'));
      winner = 'enemy';
    } else {
      [p, e] = doAttack(p, playerMove, e);
      if (e.currentHp <= 0) {
        entries.push(log(`${e.koreanName}이(가) 쓰러졌다!`, 'result'));
        winner = 'player';
      }
    }
  }

  return { newPlayer: p, newEnemy: e, newLog: entries, winner };
}

// ──────────────── 랜덤 기술 이름 선택 ────────────────

export function pickRandomMoveNames(
  allMoves: Array<{ move: { name: string; url: string } }>,
  count = 4,
): string[] {
  const shuffled = [...allMoves].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((m) => m.move.name);
}
