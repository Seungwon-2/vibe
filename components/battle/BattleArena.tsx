'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { BattleCanvasEffects, AMBIENT_TYPES } from './BattleCanvasEffects';
import type { BattlePokemon } from '@/scheme/battle';

type ActionState = {
  stepIndex: number;
  attackerSide: 'player' | 'enemy' | null;
  moveType: string | null;
  animState: 'idle' | 'attacking' | 'hit' | 'evade';
  isCritical: boolean;
  faintedSide?: 'player' | 'enemy' | null;
};

const BACKGROUNDS = [
  { value: '/backgrounds/bg_grass.png', label: '푸른 초원' },
  { value: '/backgrounds/bg_water.png', label: '시원한 바다' },
  { value: '/backgrounds/bg_cave.png', label: '신비한 동굴' },
  { value: '/backgrounds/bg_volcano.png', label: '뜨거운 화산' },
  { value: '/backgrounds/bg_forest.png', label: '깊은 숲' },
  { value: '/backgrounds/bg_ruins.png', label: '고대 유적' },
  { value: '/backgrounds/bg_desert.png', label: '모래 사막' },
  { value: '/backgrounds/bg_sky.png', label: '푸른 하늘' },
];

const EFFECT_LABELS: Record<string, string> = {
  cherryBlossom: '벚꽃 흩날림',
  snow: '내리는 눈',
  rain: '거센 빗줄기',
  embers: '타오르는 불씨',
  shootingStars: '떨어지는 유성',
  magicSparkles: '마법의 가루',
};

function MiniHpBar({ current, max, name, level = 50 }: { current: number; max: number; name: string; level?: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500';
  
  return (
    <div className="w-48 sm:w-64 rounded-xl border-2 border-slate-800 bg-white/90 p-2 shadow-md backdrop-blur-sm">
      <div className="flex items-end justify-between px-1 mb-1">
        <span className="font-bold text-slate-900">{name}</span>
        <span className="text-xs font-bold text-slate-700">Lv{level}</span>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-slate-800 p-1">
        <span className="text-[10px] font-black text-yellow-400 pl-1 leading-none">HP</span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-r-full bg-slate-600 border border-slate-800">
          <div className={cn('h-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-0.5 text-right text-[10px] font-bold text-slate-800 px-1">
        {current} / {max}
      </div>
    </div>
  );
}

export function BattleArena({
  battlePlayer,
  battleEnemy,
  actionState,
  playerImageRef,
  enemyImageRef,
}: {
  battlePlayer: BattlePokemon;
  battleEnemy: BattlePokemon;
  actionState: ActionState;
  playerImageRef: React.RefObject<HTMLDivElement | null>;
  enemyImageRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [bgImage, setBgImage] = useState<string>('');
  const [ambientType, setAmbientType] = useState<typeof AMBIENT_TYPES[number]>(AMBIENT_TYPES[0]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBgImage(BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)].value);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAmbientType(AMBIENT_TYPES[Math.floor(Math.random() * AMBIENT_TYPES.length)]);
  }, []);

  const pAttacking = actionState.attackerSide === 'player' && actionState.animState === 'attacking';
  const pEvasion = actionState.attackerSide === 'enemy' && actionState.animState === 'evade';
  const pHit = actionState.attackerSide === 'enemy' && actionState.animState === 'hit';

  const eAttacking = actionState.attackerSide === 'enemy' && actionState.animState === 'attacking';
  const eEvasion = actionState.attackerSide === 'player' && actionState.animState === 'evade';
  const eHit = actionState.attackerSide === 'player' && actionState.animState === 'hit';

  return (
    <div 
      className={cn(
        "relative w-full aspect-video sm:h-[480px] sm:aspect-auto overflow-hidden rounded-2xl border-4 border-slate-800 bg-slate-900 shadow-2xl transition-transform",
        (pHit || eHit) && "animate-shake-screen"
      )}
    >
      {/* 픽셀 배경 */}
      {bgImage && (
        <Image 
          src={bgImage} 
          alt="Battle Background" 
          fill 
          className="object-cover pixelated opacity-90" 
          priority 
        />
      )}

      {/* 캔버스 이펙트 */}
      <BattleCanvasEffects actionState={actionState} playerRef={playerImageRef} enemyRef={enemyImageRef} ambientType={ambientType} />

      {/* 배경/이펙트 선택 컨트롤 (좌상단) */}
      <div className="absolute left-2 top-2 z-20 flex gap-2">
        <select 
          className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-white backdrop-blur-sm outline-none focus:ring-1 focus:ring-white"
          value={bgImage}
          onChange={(e) => setBgImage(e.target.value)}
        >
          {BACKGROUNDS.map((bg) => (
            <option key={bg.value} value={bg.value}>{bg.label}</option>
          ))}
        </select>

        <select 
          className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-white backdrop-blur-sm outline-none focus:ring-1 focus:ring-white"
          value={ambientType}
          onChange={(e) => setAmbientType(e.target.value as typeof AMBIENT_TYPES[number])}
        >
          {AMBIENT_TYPES.map((type) => (
            <option key={type} value={type}>{EFFECT_LABELS[type]}</option>
          ))}
        </select>
      </div>

      {/* 상대 포켓몬 (우상단) */}
      <div className="absolute right-4 top-4 sm:right-12 sm:top-8 flex flex-col items-end z-10 gap-4">
        <MiniHpBar current={battleEnemy.currentHp} max={battleEnemy.maxHp} name={battleEnemy.koreanName} />
        <div 
          ref={enemyImageRef}
          className={cn(
            "relative h-32 w-32 sm:h-40 sm:w-40 transition-transform duration-300",
            eAttacking && "animate-attack-enemy",
            eHit && "animate-shake-hit brightness-150 sepia",
            eEvasion && "animate-evade opacity-50",
            battleEnemy.currentHp <= 0 && "opacity-0 scale-50 transition-all duration-700"
          )}
        >
          {/* 상대방은 좌우 반전 안함 - 보통 스프라이트가 우측 하단을 향함 */}
          <Image src={battleEnemy.imageUrl} alt={battleEnemy.koreanName} fill className="object-contain drop-shadow-xl filter" sizes="160px" />
        </div>
      </div>

      {/* 내 포켓몬 (좌하단) */}
      <div className="absolute left-4 bottom-4 sm:left-12 sm:bottom-8 flex flex-col-reverse sm:flex-col items-start z-10 gap-4">
        <div 
          ref={playerImageRef}
          className={cn(
            "relative h-40 w-40 sm:h-56 sm:w-56 transition-transform duration-300",
            pAttacking && "animate-attack-player",
            pHit && "animate-shake-hit brightness-150 sepia",
            pEvasion && "animate-evade opacity-50",
            battlePlayer.currentHp <= 0 && "opacity-0 scale-50 transition-all duration-700"
          )}
        >
          {/* 내 포켓몬은 등을 보여야 하므로 보통 더 크게 렌더링하거나 뒷모습 스프라이트 사용. 여기선 공식 아트웍을 우상단으로 향하게 좌우반전 */}
          <Image src={battlePlayer.imageUrl} alt={battlePlayer.koreanName} fill className="object-contain drop-shadow-xl scale-x-[-1] filter" sizes="224px" />
        </div>
        <MiniHpBar current={battlePlayer.currentHp} max={battlePlayer.maxHp} name={battlePlayer.koreanName} />
      </div>
    </div>
  );
}
