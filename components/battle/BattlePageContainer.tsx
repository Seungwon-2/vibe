'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useQuery, useQueries } from '@tanstack/react-query';
import { RefreshCw, Search, Swords } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { TypeBadge } from '@/components/pokemon/TypeBadge';

import {
  buildAllPokemonQuery,
  buildPokemonDetailQuery,
  buildPokemonSpeciesQuery,
} from '@/queries/pokemon';
import { buildMoveDetailQuery } from '@/queries/move';
import { buildBattleMove, buildBattlePokemon, pickRandomMoveNames, processTurn } from '@/utils/battle';
import { OFFICIAL_ARTWORK_URL } from '@/const/pokemon';
import { cn } from '@/lib/utils';

import type { BattlePhase, BattlePokemon, LogEntry } from '@/scheme/battle';

// ──────────────── 내부 타입 ────────────────

type PickedPokemon = { id: number; name: string };

const MOVES_PER      = 4;   // 배틀에 사용할 기술 수
const CANDIDATES_PER = 12;  // 후보 기술 수 (power > 0 필터 후 4개 추림)

// ──────────────── 포켓몬 검색 콤보박스 ────────────────

function PokemonCombobox({
  label,
  selected,
  onSelect,
  allPokemon,
  disabled,
}: {
  label: string;
  selected: PickedPokemon | null;
  onSelect: (p: PickedPokemon) => void;
  allPokemon: Array<{ name: string; url: string }>;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allPokemon
      .filter((p) => p.name.includes(q))
      .slice(0, 8)
      .map((p) => ({
        id:   parseInt(p.url.match(/\/(\d+)\/?$/)?.[1] ?? '0', 10),
        name: p.name,
      }));
  }, [query, allPokemon]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="포켓몬 이름 입력 (영어)"
          value={query}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {/* 드롭다운 */}
      {open && options.length > 0 && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border bg-background shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.id}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
              onMouseDown={() => { onSelect(opt); setQuery(opt.name); setOpen(false); }}
            >
              <Image
                src={OFFICIAL_ARTWORK_URL(opt.id)}
                alt={opt.name}
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="capitalize">#{String(opt.id).padStart(4, '0')} {opt.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 선택된 포켓몬 */}
      {selected && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
          <Image
            src={OFFICIAL_ARTWORK_URL(selected.id)}
            alt={selected.name}
            width={48}
            height={48}
            className="object-contain"
          />
          <span className="capitalize text-sm font-medium">
            #{String(selected.id).padStart(4, '0')} {selected.name}
          </span>
        </div>
      )}
    </div>
  );
}

// ──────────────── HP 바 ────────────────

function HpBar({ current, max, reversed }: { current: number; max: number; reversed?: boolean }) {
  const pct   = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className={cn('flex items-center gap-2', reversed && 'flex-row-reverse')}>
      <span className="w-24 shrink-0 text-xs text-muted-foreground">
        {reversed ? `${current} / ${max}` : `${current} / ${max}`}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ──────────────── 배틀 포켓몬 카드 ────────────────

function BattleCard({ pokemon, isPlayer }: { pokemon: BattlePokemon; isPlayer: boolean }) {
  return (
    <div className={cn('flex gap-4', !isPlayer && 'flex-row-reverse')}>
      <div className={cn('relative h-32 w-32 shrink-0 rounded-xl bg-muted/30', !isPlayer && 'scale-x-[-1]')}>
        <Image src={pokemon.imageUrl} alt={pokemon.koreanName} fill className="object-contain p-2" sizes="128px" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className={cn('flex flex-wrap items-center gap-2', !isPlayer && 'flex-row-reverse')}>
          <span className="text-lg font-bold">{pokemon.koreanName}</span>
          <span className="text-xs capitalize text-muted-foreground">{pokemon.name}</span>
          {isPlayer && <Badge variant="outline" className="text-xs">내 포켓몬</Badge>}
        </div>
        <HpBar current={pokemon.currentHp} max={pokemon.maxHp} reversed={!isPlayer} />
        <div className={cn('flex flex-wrap gap-1', !isPlayer && 'justify-end')}>
          {pokemon.types.map((t) => <TypeBadge key={t} type={t} />)}
        </div>
      </div>
    </div>
  );
}

// ──────────────── 기술 버튼 ────────────────

const TYPE_BORDER: Record<string, string> = {
  fire: 'border-orange-400',   water: 'border-blue-400',
  grass: 'border-green-400',   electric: 'border-yellow-400',
  psychic: 'border-pink-400',  ice: 'border-cyan-300',
  dragon: 'border-indigo-500', dark: 'border-gray-600',
  normal: 'border-gray-400',   fighting: 'border-red-500',
  poison: 'border-purple-400', ground: 'border-yellow-600',
  flying: 'border-indigo-300', bug: 'border-lime-400',
  rock: 'border-yellow-700',   ghost: 'border-indigo-700',
  steel: 'border-slate-400',   fairy: 'border-pink-300',
};

function MoveButtons({
  moves,
  onSelect,
  disabled,
}: {
  moves: BattlePokemon['moves'];
  onSelect: (i: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {moves.map((move, i) => (
        <button
          key={move.name}
          disabled={disabled || move.currentPp <= 0}
          onClick={() => onSelect(i)}
          className={cn(
            'rounded-xl border-2 p-3 text-left transition-all',
            'hover:bg-muted focus:outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-40',
            TYPE_BORDER[move.type] ?? 'border-border',
          )}
        >
          <p className="text-sm font-semibold">{move.koreanName}</p>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
            {move.type} · {move.damageClass === 'physical' ? '물리' : '특수'} · 위력 {move.power}
          </p>
          <p className="text-xs text-muted-foreground">PP {move.currentPp}/{move.pp}</p>
        </button>
      ))}
    </div>
  );
}

// ──────────────── 배틀 로그 ────────────────

const LOG_STYLE: Record<LogEntry['kind'], string> = {
  action:        'text-foreground',
  damage:        'font-medium text-orange-600 dark:text-orange-400',
  effectiveness: 'italic text-blue-600 dark:text-blue-400',
  result:        'font-bold text-red-600 dark:text-red-400',
};

function BattleLog({ entries }: { entries: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [entries]);

  return (
    <div className="h-36 overflow-y-auto rounded-xl bg-muted/30 p-3 text-sm">
      {entries.map((entry) => (
        <p key={entry.id} className={cn('mb-0.5 leading-snug', LOG_STYLE[entry.kind])}>{entry.text}</p>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

// ──────────────────────────────────────────────────────
// ──────────────── BattlePageContainer ─────────────────
// ──────────────────────────────────────────────────────

export function BattlePageContainer() {
  const [playerPick, setPlayerPick] = useState<PickedPokemon | null>(null);
  const [enemyPick,  setEnemyPick]  = useState<PickedPokemon | null>(null);
  const [phase,      setPhase]      = useState<BattlePhase>('select');

  const [battlePlayer, setBattlePlayer] = useState<BattlePokemon | null>(null);
  const [battleEnemy,  setBattleEnemy]  = useState<BattlePokemon | null>(null);
  const [battleLog,    setBattleLog]    = useState<LogEntry[]>([]);
  const [winner,       setWinner]       = useState<'player' | 'enemy' | null>(null);

  const [playerMoveNames, setPlayerMoveNames] = useState<string[]>([]);
  const [enemyMoveNames,  setEnemyMoveNames]  = useState<string[]>([]);

  // ── 쿼리
  const allPokemonQ    = useQuery(buildAllPokemonQuery());
  const playerSpeciesQ = useQuery({ ...buildPokemonSpeciesQuery(playerPick?.id ?? 0), enabled: playerPick != null });
  const enemySpeciesQ  = useQuery({ ...buildPokemonSpeciesQuery(enemyPick?.id ?? 0),  enabled: enemyPick  != null });

  const playerDetailQ = useQuery({
    ...buildPokemonDetailQuery(playerPick?.id ?? 0),
    enabled: phase === 'loading' && playerPick != null,
  });
  const enemyDetailQ = useQuery({
    ...buildPokemonDetailQuery(enemyPick?.id ?? 0),
    enabled: phase === 'loading' && enemyPick != null,
  });

  const allMoveNames = useMemo(
    () => [...playerMoveNames, ...enemyMoveNames],
    [playerMoveNames, enemyMoveNames],
  );
  const moveResults = useQueries({ queries: allMoveNames.map(buildMoveDetailQuery) });

  // ── Effect 1: 상세 로드 완료 → 후보 기술 12개 랜덤 선택
  useEffect(() => {
    if (phase !== 'loading') return;
    if (!playerDetailQ.data || !enemyDetailQ.data) return;
    if (playerMoveNames.length > 0) return;
    // CANDIDATES_PER개 후보를 가져와서 power>0 필터 후 4개 사용
    setPlayerMoveNames(pickRandomMoveNames(playerDetailQ.data.moves ?? [], CANDIDATES_PER));
    setEnemyMoveNames(pickRandomMoveNames(enemyDetailQ.data.moves ?? [], CANDIDATES_PER));
  }, [phase, playerDetailQ.data, enemyDetailQ.data, playerMoveNames.length]);

  // ── Effect 2: 기술 로드 완료 → power>0 필터 후 배틀 시작
  useEffect(() => {
    if (phase !== 'loading') return;
    if (playerMoveNames.length === 0 || enemyMoveNames.length === 0) return;
    const total = playerMoveNames.length + enemyMoveNames.length;
    if (moveResults.length < total || !moveResults.every((r) => r.data != null)) return;

    // 후보에서 실제 데미지 기술(power > 0)만 추려 4개 선택
    const pCandidates = moveResults.slice(0, playerMoveNames.length);
    const eCandidates = moveResults.slice(playerMoveNames.length);

    const pickValid = (candidates: typeof moveResults) => {
      const valid = candidates.filter((r) => (r.data?.power ?? 0) > 0).slice(0, MOVES_PER);
      // 유효한 기술이 4개 미만이면 나머지는 후보에서 보충 (status move 포함)
      if (valid.length < MOVES_PER) {
        const extra = candidates.filter((r) => (r.data?.power ?? 0) === 0);
        return [...valid, ...extra].slice(0, MOVES_PER).map((r) => buildBattleMove(r.data!));
      }
      return valid.map((r) => buildBattleMove(r.data!));
    };

    const pMovesBuilt = pickValid(pCandidates);
    const eMovesBuilt = pickValid(eCandidates);

    const pKo = playerSpeciesQ.data?.names.find((n) => n.language.name === 'ko')?.name ?? playerPick?.name ?? '';
    const eKo = enemySpeciesQ.data?.names.find((n) => n.language.name === 'ko')?.name ?? enemyPick?.name ?? '';

    setBattlePlayer(buildBattlePokemon(playerDetailQ.data!, pMovesBuilt, pKo));
    setBattleEnemy(buildBattlePokemon(enemyDetailQ.data!, eMovesBuilt, eKo));
    setBattleLog([{ id: -1, text: `⚔️ ${pKo} vs ${eKo}! 대전 시작!`, kind: 'result' }]);
    setPhase('player_turn');
  }, [phase, moveResults, playerMoveNames.length, enemyMoveNames.length]);

  // ── 기술 사용
  const handlePlayerMove = useCallback((moveIdx: number) => {
    if (phase !== 'player_turn' || !battlePlayer || !battleEnemy) return;
    const move = battlePlayer.moves[moveIdx];
    if (!move || move.currentPp <= 0) return;

    setPhase('animating');
    const result = processTurn(battlePlayer, move, battleEnemy);
    setBattlePlayer(result.newPlayer);
    setBattleEnemy(result.newEnemy);
    setBattleLog((prev) => [...prev, ...result.newLog]);

    if (result.winner) {
      setWinner(result.winner);
      setPhase('game_over');
    } else {
      setTimeout(() => setPhase('player_turn'), 700);
    }
  }, [phase, battlePlayer, battleEnemy]);

  // ── 리셋
  const handleReset = useCallback((keepPokemon = false) => {
    if (!keepPokemon) { setPlayerPick(null); setEnemyPick(null); }
    setBattlePlayer(null);
    setBattleEnemy(null);
    setBattleLog([]);
    setWinner(null);
    setPlayerMoveNames([]);
    setEnemyMoveNames([]);
    setPhase('select');
  }, []);

  // ───── 렌더: 포켓몬 선택 ─────
  if (phase === 'select') {
    return (
      <PageContainer>
        <PageHeader title="모의 대전" description="포켓몬 두 마리를 선택하고 기술 배치 후 배틀을 시작하세요" />
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <PokemonCombobox
            label="내 포켓몬"
            selected={playerPick}
            onSelect={setPlayerPick}
            allPokemon={allPokemonQ.data?.results ?? []}
            disabled={allPokemonQ.isLoading}
          />
          <PokemonCombobox
            label="상대 포켓몬"
            selected={enemyPick}
            onSelect={setEnemyPick}
            allPokemon={allPokemonQ.data?.results ?? []}
            disabled={allPokemonQ.isLoading}
          />
        </div>
        <div className="text-center">
          <Button
            size="lg"
            className="gap-2 px-10"
            disabled={!playerPick || !enemyPick}
            onClick={() => {
              setPlayerMoveNames([]);
              setEnemyMoveNames([]);
              setPhase('loading');
            }}
          >
            <Swords className="h-5 w-5" />
            대전 시작!
          </Button>
          {(!playerPick || !enemyPick) && (
            <p className="mt-2 text-sm text-muted-foreground">양쪽 포켓몬을 모두 선택해주세요</p>
          )}
        </div>
      </PageContainer>
    );
  }

  // ───── 렌더: 기술 로딩 ─────
  if (phase === 'loading') {
    const movesLoaded = moveResults.filter((r) => r.data != null).length;
    const totalMoves  = playerMoveNames.length + enemyMoveNames.length;
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-6 py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-center">
            <p className="text-lg font-semibold">기술 배정 중...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {!playerDetailQ.data || !enemyDetailQ.data
                ? '포켓몬 정보 로딩 중...'
                : playerMoveNames.length === 0
                  ? '기술 목록 준비 중...'
                  : `기술 상세 로딩 중... (${movesLoaded} / ${totalMoves})`}
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ───── 렌더: 배틀 / 게임오버 ─────
  if (!battlePlayer || !battleEnemy) return null;

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <PageHeader
          title="⚔️ 배틀 중"
          description={`${battlePlayer.koreanName} vs ${battleEnemy.koreanName}`}
        />
        <Button variant="ghost" size="sm" onClick={() => handleReset(false)} className="gap-1 text-xs">
          <RefreshCw className="h-3 w-3" />
          처음으로
        </Button>
      </div>

      {/* 상대 포켓몬 (위) */}
      <div className="mb-3 rounded-xl border bg-card p-4 shadow-sm">
        <BattleCard pokemon={battleEnemy} isPlayer={false} />
      </div>

      {/* 내 포켓몬 (아래) */}
      <div className="mb-4 rounded-xl border bg-card p-4 shadow-sm">
        <BattleCard pokemon={battlePlayer} isPlayer={true} />
      </div>

      {/* 배틀 로그 */}
      <div className="mb-4">
        <BattleLog entries={battleLog} />
      </div>

      {/* 기술 선택 or 결과 */}
      {phase === 'game_over' ? (
        <div className="rounded-xl border bg-muted/30 p-6 text-center">
          <p className="mb-1 text-3xl font-bold">
            {winner === 'player' ? '🎉 승리!' : '💀 패배...'}
          </p>
          <p className="mb-6 text-muted-foreground">
            {winner === 'player'
              ? `${battlePlayer.koreanName}이(가) 이겼습니다!`
              : `${battleEnemy.koreanName}에게 졌습니다...`}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => handleReset(true)} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              기술 재배정 후 재도전
            </Button>
            <Button variant="outline" onClick={() => handleReset(false)} className="gap-2">
              포켓몬 바꾸기
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">
            {phase === 'animating' ? '처리 중...' : '기술을 선택하세요'}
          </p>
          <MoveButtons
            moves={battlePlayer.moves}
            onSelect={handlePlayerMove}
            disabled={phase === 'animating'}
          />
        </div>
      )}
    </PageContainer>
  );
}
