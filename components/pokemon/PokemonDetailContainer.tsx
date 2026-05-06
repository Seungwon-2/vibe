'use client';

import { useCallback } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { TypeBadge } from './TypeBadge';
import { EvolutionChainDisplay } from './EvolutionChain';
import { PokemonForms } from './PokemonForms';
import { usePokemonDetail } from '@/hooks/usePokemonDetail';
import { OFFICIAL_ARTWORK_URL, STAT_LABELS } from '@/const/pokemon';
import { PageContainer } from '@/components/layout/PageContainer';
import { cn } from '@/lib/utils';

const TOTAL_POKEMON = 1025;

interface PokemonDetailContainerProps {
  id: number;
}

export function PokemonDetailContainer({ id }: PokemonDetailContainerProps) {
  const { pokemon, species, evolutionChain, koreanName, koreanGenus, flavorText, abilityKoreanNames, isLoading, isLoadingEvolution } =
    usePokemonDetail(id);

  const varieties = species?.varieties ?? [];
  const hasAlternateForms = varieties.some((v) => !v.is_default);

  const prevId = id > 1 ? id - 1 : null;
  const nextId = id < TOTAL_POKEMON ? id + 1 : null;

  const imageUrl =
    pokemon?.sprites.other?.['official-artwork'].front_default ?? OFFICIAL_ARTWORK_URL(id);

  // ── 울음소리 재생 ──
  const cryUrl = pokemon?.cries?.latest;
  const handlePlayCry = useCallback(() => {
    if (!cryUrl) return;
    const audio = new Audio(cryUrl);
    audio.play().catch(() => {/* 재생 실패 무시 */});
  }, [cryUrl]);

  // ── 로딩 상태 ──
  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-9 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // ── 에러 상태 ──
  if (!pokemon) {
    return (
      <PageContainer>
        <div className="py-24 text-center">
          <p className="text-xl font-semibold">포켓몬을 찾을 수 없습니다</p>
          <p className="mt-2 text-muted-foreground">번호 #{id}에 해당하는 포켓몬이 없습니다</p>
          <Button render={<Link href="/" />} nativeButton={false} className="mt-6">
            목록으로 돌아가기
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 내비게이션 */}
      <div className="mb-6 flex items-center justify-between">
        <Button render={<Link href="/" />} nativeButton={false} variant="outline" size="sm">
          <ChevronLeft className="mr-1 h-4 w-4" />
          목록
        </Button>
        <div className="flex gap-2">
          {prevId && (
            <Button render={<Link href={`/pokemon/${prevId}`} />} nativeButton={false} variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
              #{String(prevId).padStart(4, '0')}
            </Button>
          )}
          {nextId && (
            <Button render={<Link href={`/pokemon/${nextId}`} />} nativeButton={false} variant="outline" size="sm">
              #{String(nextId).padStart(4, '0')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 메인 정보 */}
      <div className="mb-10 grid gap-8 md:grid-cols-2">
        {/* 이미지 */}
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-muted/30">
          <Image
            src={imageUrl}
            alt={koreanName || pokemon.name}
            fill
            priority
            className="object-contain p-6"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* 텍스트 정보 */}
        <div>
          {/* 번호 + 이름 */}
          <p className="mb-1 text-sm text-muted-foreground">#{String(pokemon.id).padStart(4, '0')}</p>
          <h1 className="mb-1 text-4xl font-bold">
            {koreanName || pokemon.name}
          </h1>
          <p className="mb-1 capitalize text-lg text-muted-foreground">{pokemon.name}</p>
          {koreanGenus && (
            <p className="mb-4 text-sm text-muted-foreground">{koreanGenus}</p>
          )}

          {/* 타입 + 울음소리 */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {pokemon.types.map((t) => (
              <TypeBadge key={t.type.name} type={t.type.name} className="px-3 py-1 text-sm" />
            ))}
            {cryUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayCry}
                className="ml-auto gap-1.5"
                title="울음소리 재생"
              >
                <Volume2 className="h-4 w-4" />
                울음소리
              </Button>
            )}
          </div>

          {/* 도감 설명 */}
          {flavorText && (
            <p className="mb-5 rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">{flavorText}</p>
          )}

          <Separator className="mb-5" />

          {/* 기본 정보 */}
          <div className="mb-5 grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="mb-1 text-xs text-muted-foreground">키</p>
              <p className="font-semibold">{(pokemon.height / 10).toFixed(1)}m</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="mb-1 text-xs text-muted-foreground">몸무게</p>
              <p className="font-semibold">{(pokemon.weight / 10).toFixed(1)}kg</p>
            </div>
          </div>

          {/* 특성 */}
          <div className="mb-5">
            <p className="mb-2 text-sm font-semibold">특성</p>
            <div className="flex flex-wrap gap-2">
              {pokemon.abilities.map((a) => {
                const koName = abilityKoreanNames.get(a.ability.name);
                return (
                  <span
                    key={a.ability.name}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm',
                      a.is_hidden && 'border-dashed text-muted-foreground',
                    )}
                  >
                    {koName ?? a.ability.name}
                    {a.is_hidden && ' (숨겨진 특성)'}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 기본 능력치 */}
          <div>
            <p className="mb-3 text-sm font-semibold">기본 능력치</p>
            <div className="space-y-2">
              {pokemon.stats.map((s) => {
                const label = STAT_LABELS[s.stat.name] ?? s.stat.name;
                const pct = Math.min(100, Math.round((s.base_stat / 255) * 100));
                return (
                  <div key={s.stat.name} className="flex items-center gap-3">
                    <span className="w-10 text-xs text-muted-foreground">{label}</span>
                    <span className="w-8 text-right text-sm font-medium">{s.base_stat}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted h-2">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 진화 체인 */}
      <Separator className="mb-8" />
      <section>
        <h2 className="mb-4 text-xl font-bold">진화 정보</h2>
        {isLoadingEvolution ? (
          <div className="flex justify-center gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : evolutionChain ? (
          <EvolutionChainDisplay chain={evolutionChain.chain} currentId={id} />
        ) : (
          <p className="text-sm text-muted-foreground">진화 정보를 불러오는 중입니다...</p>
        )}
      </section>

      {/* 메가진화 / 폼 체인지 */}
      {hasAlternateForms && (
        <>
          <Separator className="mb-8 mt-4" />
          <section>
            <h2 className="mb-6 text-xl font-bold">메가진화 / 폼 체인지</h2>
            <PokemonForms
              varieties={varieties}
              baseEnglishName={pokemon.name}
              koreanName={koreanName || pokemon.name}
            />
          </section>
        </>
      )}
    </PageContainer>
  );
}
