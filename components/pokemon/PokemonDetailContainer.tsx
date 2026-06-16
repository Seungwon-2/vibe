'use client';

import { useCallback, useMemo, useState } from 'react';

import { Dialog } from '@base-ui/react/dialog';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Volume2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { TypeBadge } from './TypeBadge';
import { EvolutionChainDisplay } from './EvolutionChain';
import { PokemonForms } from './PokemonForms';
import { usePokemonDetail } from '@/hooks/usePokemonDetail';
import {
  OFFICIAL_ARTWORK_URL,
  POKEMON_TYPES,
  POKEMON_TYPE_LABELS,
  STAT_LABELS,
} from '@/const/pokemon';
import { getTypeEffectiveness } from '@/const/typeEffectiveness';
import { PageContainer } from '@/components/layout/PageContainer';
import { cn } from '@/lib/utils';

const TOTAL_POKEMON = 1025;

interface PokemonDetailContainerProps {
  identifier: number | string;
}

export function PokemonDetailContainer({ identifier }: PokemonDetailContainerProps) {
  const {
    pokemon,
    species,
    evolutionChain,
    koreanName,
    koreanGenus,
    flavorText,
    abilityKoreanNames,
    abilityDetails,
    currentFormLabel,
    isLoading,
    isLoadingEvolution,
  } =
    usePokemonDetail(identifier);

  const [selectedAbilityName, setSelectedAbilityName] = useState<string | null>(null);

  const varieties = species?.varieties ?? [];
  const hasAlternateForms = varieties.some((v) => !v.is_default);
  const displayDexId = species?.id ?? pokemon?.id ?? null;
  const navigationDexId = displayDexId && displayDexId <= TOTAL_POKEMON ? displayDexId : null;

  const prevId = navigationDexId && navigationDexId > 1 ? navigationDexId - 1 : null;
  const nextId = navigationDexId && navigationDexId < TOTAL_POKEMON ? navigationDexId + 1 : null;

  const imageUrl =
    pokemon?.sprites.other?.['official-artwork'].front_default ??
    OFFICIAL_ARTWORK_URL(pokemon?.id ?? Number(identifier));

  const selectedAbility = useMemo(() => {
    if (!abilityDetails.length) return null;
    if (!selectedAbilityName) return null;
    return abilityDetails.find((ability) => ability.name === selectedAbilityName) ?? null;
  }, [abilityDetails, selectedAbilityName]);

  const generationLabel = useMemo(() => {
    const generationName = species?.generation.name;

    const generationMap: Record<string, string> = {
      'generation-i': '1세대',
      'generation-ii': '2세대',
      'generation-iii': '3세대',
      'generation-iv': '4세대',
      'generation-v': '5세대',
      'generation-vi': '6세대',
      'generation-vii': '7세대',
      'generation-viii': '8세대',
      'generation-ix': '9세대',
    };

    return generationName ? generationMap[generationName] ?? generationName : '-';
  }, [species?.generation.name]);

  const typeMatchup = useMemo(() => {
    if (!pokemon) {
      return {
        quadrupleWeaknesses: [] as string[],
        weaknesses: [] as string[],
        doubleResistances: [] as string[],
        resistances: [] as string[],
        immunities: [] as string[],
      };
    }

    const defenderTypes = pokemon.types.map((item) => item.type.name);

    const matchup = POKEMON_TYPES.reduce(
      (acc, attackType) => {
        const multiplier = getTypeEffectiveness(attackType, defenderTypes);

        if (multiplier >= 4) {
          acc.quadrupleWeaknesses.push(attackType);
        } else if (multiplier >= 2) {
          acc.weaknesses.push(attackType);
        } else if (multiplier === 0) {
          acc.immunities.push(attackType);
        } else if (multiplier <= 0.25) {
          acc.doubleResistances.push(attackType);
        } else if (multiplier < 1) {
          acc.resistances.push(attackType);
        }

        return acc;
      },
      {
        quadrupleWeaknesses: [] as string[],
        weaknesses: [] as string[],
        doubleResistances: [] as string[],
        resistances: [] as string[],
        immunities: [] as string[],
      },
    );

    return matchup;
  }, [pokemon]);

  const totalStats = useMemo(() => {
    return pokemon?.stats.reduce((sum, stat) => sum + stat.base_stat, 0) ?? 0;
  }, [pokemon]);

  const infoCards = useMemo(() => {
    if (!species || !pokemon) return [] as Array<{ label: string; value: string }>;

    return [
      { label: '분류', value: koreanGenus || '-' },
      { label: '세대', value: generationLabel },
      { label: '포획률', value: String(species.capture_rate) },
      {
        label: '희귀 구분',
        value: species.is_mythical ? '환상' : species.is_legendary ? '전설' : '일반',
      },
      { label: '기본 경험치', value: String(pokemon.base_experience ?? '-') },
      { label: '종족값 합계', value: String(totalStats) },
    ];
  }, [generationLabel, koreanGenus, pokemon, species, totalStats]);

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
          <p className="mt-2 text-muted-foreground">
            식별자 {String(identifier)}에 해당하는 포켓몬이 없습니다
          </p>
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
      <div className="mb-10 grid items-start gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {/* 이미지 */}
        <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-2xl bg-muted/30 md:max-w-xl">
          <Image
            src={imageUrl}
            alt={koreanName || pokemon.name}
            fill
            priority
            loading="eager"
            className="object-contain object-center p-4 md:p-6"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 55vw, 42vw"
          />
        </div>

        {/* 텍스트 정보 */}
        <div>
          {/* 번호 + 이름 */}
          {displayDexId && (
            <p className="mb-1 text-sm text-muted-foreground">#{String(displayDexId).padStart(4, '0')}</p>
          )}
          <h1 className="mb-1 text-4xl font-bold">
            {koreanName || pokemon.name}
          </h1>
          <p className="mb-1 capitalize text-lg text-muted-foreground">{pokemon.name}</p>
          {currentFormLabel && (
            <p className="mb-3 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              현재 폼 · {currentFormLabel}
            </p>
          )}
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
                const isSelected = selectedAbilityName === a.ability.name;
                return (
                  <button
                    key={a.ability.name}
                    type="button"
                    onClick={() => setSelectedAbilityName(a.ability.name)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm transition-colors',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted',
                      a.is_hidden && !isSelected && 'border-dashed text-muted-foreground',
                    )}
                  >
                    {koName ?? a.ability.name}
                    {a.is_hidden && ' (숨겨진 특성)'}
                  </button>
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
                    <span className="w-20 text-xs text-muted-foreground">{label}</span>
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

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-bold">추가 정보</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {infoCards.map((item) => (
              <div key={item.label} className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-1 text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">타입 상성 요약</h2>
          <div className="space-y-3 rounded-xl border bg-muted/10 p-4">
            {[
              {
                key: 'quad-weak',
                title: '4배 약점',
                types: typeMatchup.quadrupleWeaknesses,
                emptyText: '4배 약점이 없습니다.',
              },
              {
                key: 'weak',
                title: '2배 약점',
                types: typeMatchup.weaknesses,
                emptyText: '2배 약점이 없습니다.',
              },
              {
                key: 'resist',
                title: '반감 (0.5배)',
                types: typeMatchup.resistances,
                emptyText: '반감 타입이 없습니다.',
              },
              {
                key: 'double-resist',
                title: '강한 반감 (0.25배)',
                types: typeMatchup.doubleResistances,
                emptyText: '0.25배 반감 타입이 없습니다.',
              },
              {
                key: 'immune',
                title: '무효 (0배)',
                types: typeMatchup.immunities,
                emptyText: '무효 타입이 없습니다.',
              },
            ].map((section) => (
              <div key={section.key}>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">{section.title}</p>
                <div className="flex flex-wrap gap-2">
                  {section.types.length > 0 ? (
                    section.types.map((type) => (
                      <TypeBadge
                        key={`${section.key}-${type}`}
                        type={type}
                        className="px-3 py-1 text-sm"
                      />
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">{section.emptyText}</span>
                  )}
                </div>
              </div>
            ))}

            <p className="text-xs text-muted-foreground">
              {pokemon.types
                .map((item) => POKEMON_TYPE_LABELS[item.type.name] ?? item.type.name)
                .join(' / ')}
              타입 기준 방어 상성입니다.
            </p>
          </div>
        </section>
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
          <EvolutionChainDisplay chain={evolutionChain.chain} currentId={species?.id ?? pokemon.id} />
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
              baseEnglishName={species?.name ?? pokemon.name}
              koreanName={koreanName || pokemon.name}
              currentPokemonName={pokemon.name}
            />
          </section>
        </>
      )}

      <Dialog.Root
        open={!!selectedAbilityName && !!selectedAbility}
        onOpenChange={(open) => {
          if (!open) setSelectedAbilityName(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-background shadow-2xl outline-none">
              {selectedAbility && (
                <>
                  <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
                    <div>
                      <Dialog.Title className="text-lg font-bold">
                        {selectedAbility.koreanName ?? selectedAbility.englishName}
                      </Dialog.Title>
                      <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                        {selectedAbility.koreanName ? selectedAbility.englishName : selectedAbility.name} ·{' '}
                        {selectedAbility.isHidden ? '숨겨진 특성' : '기본 특성'}
                      </Dialog.Description>
                    </div>
                    <Dialog.Close className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <X className="h-4 w-4" />
                    </Dialog.Close>
                  </div>

                  <div className="max-h-[80vh] space-y-5 overflow-y-auto px-5 py-5">
                    <section>
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">특성 설명</p>
                      <p className="text-sm leading-relaxed">
                        {selectedAbility.isLoading
                          ? '특성 설명을 불러오는 중입니다...'
                          : selectedAbility.effectText || '등록된 특성 설명이 없습니다.'}
                      </p>
                    </section>

                    {selectedAbility.flavorText && (
                      <section>
                        <p className="mb-2 text-xs font-semibold text-muted-foreground">도감 문구</p>
                        <p className="rounded-xl bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
                          {selectedAbility.flavorText}
                        </p>
                      </section>
                    )}

                    <section>
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">이 특성을 가진 포켓몬</p>
                      {selectedAbility.relatedPokemon.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedAbility.relatedPokemon.map((relatedPokemon) => (
                            <Link
                              key={`${selectedAbility.name}-${relatedPokemon.id}`}
                              href={`/pokemon/${relatedPokemon.id}`}
                              onClick={() => setSelectedAbilityName(null)}
                              className={cn(
                                'rounded-full border px-3 py-1 text-xs transition-colors hover:bg-muted',
                                relatedPokemon.isHidden && 'border-dashed text-muted-foreground',
                              )}
                            >
                              #{String(relatedPokemon.id).padStart(4, '0')}{' '}
                              {relatedPokemon.koreanName ?? relatedPokemon.name}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          연관 포켓몬 정보를 불러오는 중이거나 데이터가 없습니다.
                        </p>
                      )}
                    </section>
                  </div>
                </>
              )}
            </Dialog.Popup>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    </PageContainer>
  );
}
