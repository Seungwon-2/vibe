'use client';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { PageContainer } from '@/components/layout/PageContainer';
import { TypeBadge } from '@/components/pokemon/TypeBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MOVE_DAMAGE_CLASSES,
  MOVE_DAMAGE_CLASS_LABELS,
  MOVE_DAMAGE_CLASS_STYLES,
  getMoveGenerationLabel,
  getMoveTargetLabel,
} from '@/const/move';
import { buildMoveDetailQuery } from '@/queries/move';
import { cn } from '@/lib/utils';

interface MoveDetailContainerProps {
  identifier: number | string;
}

const TOTAL_MOVES = 919;

function normalizeText(value?: string | null) {
  return value?.replace(/\$effect_chance/g, '효과 확률').replace(/\n|\f/g, ' ') ?? '-';
}

function extractPokemonId(url: string) {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

export function MoveDetailContainer({ identifier }: MoveDetailContainerProps) {
  const { data: move, isLoading } = useQuery(buildMoveDetailQuery(identifier));

  const koreanName = move?.names.find((item) => item.language.name === 'ko')?.name;
  const englishName = move?.name ?? String(identifier);
  const displayName = koreanName ?? englishName;
  const flavorText = normalizeText(
    move?.flavor_text_entries?.find((entry) => entry.language.name === 'ko')?.flavor_text ??
      move?.flavor_text_entries?.find((entry) => entry.language.name === 'en')?.flavor_text,
  );
  const effectText = normalizeText(
    move?.effect_entries?.find((entry) => entry.language.name === 'ko')?.short_effect ??
      move?.effect_entries?.find((entry) => entry.language.name === 'en')?.short_effect,
  );
  const damageClassName = move?.damage_class.name;
  const damageClassKey =
    damageClassName &&
    MOVE_DAMAGE_CLASSES.includes(damageClassName as (typeof MOVE_DAMAGE_CLASSES)[number])
      ? (damageClassName as (typeof MOVE_DAMAGE_CLASSES)[number])
      : null;

  const prevId = move && move.id > 1 ? move.id - 1 : null;
  const nextId = move && move.id < TOTAL_MOVES ? move.id + 1 : null;
  const learnedByPokemon =
    move?.learned_by_pokemon
      ?.map((pokemon) => ({
        id: extractPokemonId(pokemon.url),
        name: pokemon.name,
      }))
      .filter((pokemon) => pokemon.id !== null)
      .slice(0, 18) ?? [];

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-6 flex items-center justify-between gap-2">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <Card>
            <CardContent className="space-y-4 p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-28" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-28 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid grid-cols-2 gap-3 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (!move) {
    return (
      <PageContainer>
        <div className="py-24 text-center">
          <p className="text-xl font-semibold">기술 정보를 찾을 수 없습니다</p>
          <p className="mt-2 text-muted-foreground">식별자 {String(identifier)}에 해당하는 기술이 없습니다.</p>
          <Button className="mt-6" render={<Link href="/move" />}>
            기술 도감으로 돌아가기
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" render={<Link href="/move" />}>
          <ChevronLeft className="h-4 w-4" />
          목록
        </Button>

        <div className="flex gap-2">
          {prevId && (
            <Button variant="outline" size="sm" render={<Link href={`/move/${prevId}`} />}>
              <ChevronLeft className="h-4 w-4" />
              #{String(prevId).padStart(4, '0')}
            </Button>
          )}
          {nextId && (
            <Button variant="outline" size="sm" render={<Link href={`/move/${nextId}`} />}>
              #{String(nextId).padStart(4, '0')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <Card className="border-primary/10">
          <CardContent className="space-y-5 p-5">
            <div>
              <p className="text-sm text-muted-foreground">기술 #{String(move.id).padStart(4, '0')}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">{displayName}</h1>
              <p className="mt-2 text-sm capitalize text-muted-foreground">{englishName}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <TypeBadge type={move.type.name} className="text-sm" />
              {damageClassKey && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                    MOVE_DAMAGE_CLASS_STYLES[damageClassKey],
                  )}
                >
                  {MOVE_DAMAGE_CLASS_LABELS[damageClassKey]}
                </span>
              )}
            </div>

            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="mb-2 text-sm font-semibold">기술 설명</p>
              <p className="text-sm leading-6 text-muted-foreground">{flavorText}</p>
            </div>

            <div className="rounded-2xl bg-primary/5 p-4">
              <p className="mb-2 text-sm font-semibold text-primary">효과 요약</p>
              <p className="text-sm leading-6 text-muted-foreground">{effectText}</p>
            </div>

            <Card className="bg-background/70 py-0">
              <CardHeader className="border-b py-4">
                <CardTitle className="text-base">배울 수 있는 포켓몬</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {learnedByPokemon.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {learnedByPokemon.map((pokemon) => (
                      <Link
                        key={`${pokemon.id}-${pokemon.name}`}
                        href={`/pokemon/${pokemon.id}`}
                        className="rounded-full border px-3 py-1 text-xs font-medium capitalize text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {pokemon.name.replace(/-/g, ' ')}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">배울 수 있는 포켓몬 정보가 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card>
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-4">
              {[
                { label: '위력', value: move.power ?? '-' },
                { label: '명중', value: move.accuracy ?? '-' },
                { label: 'PP', value: move.pp ?? '-' },
                { label: '우선도', value: move.priority },
                { label: '세대', value: getMoveGenerationLabel(move.generation.name) },
                { label: '대상', value: getMoveTargetLabel(move.target.name) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">부가 효과</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-4">
              {[
                { label: '효과 확률', value: move.effect_chance ?? '-' },
                { label: '급소 보정', value: move.meta?.crit_rate ?? '-' },
                { label: '풀죽음 확률', value: move.meta?.flinch_chance ?? '-' },
                { label: '상태이상 확률', value: move.meta?.ailment_chance ?? '-' },
                { label: '최소 타수', value: move.meta?.min_hits ?? '-' },
                { label: '최대 타수', value: move.meta?.max_hits ?? '-' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}