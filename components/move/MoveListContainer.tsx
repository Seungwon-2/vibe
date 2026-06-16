'use client';

import { useMemo, useState, type FormEvent } from 'react';

import { Search, X } from 'lucide-react';

import { PageContainer } from '@/components/layout/PageContainer';
import { MoveCard } from '@/components/move/MoveCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MOVE_DAMAGE_CLASSES, MOVE_DAMAGE_CLASS_LABELS } from '@/const/move';
import { GENERATIONS, POKEMON_TYPES, POKEMON_TYPE_COLORS, POKEMON_TYPE_LABELS } from '@/const/pokemon';
import { useMoveList } from '@/hooks/useMoveList';
import { cn } from '@/lib/utils';

export function MoveListContainer() {
  const {
    params,
    pageItems,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    isLoadingKorean,
    koreanTooMany,
    filteredItemsTotal,
    hasActiveFilter,
    handleSearch,
    handleTypeToggle,
    handleTypesClear,
    handleGenerationFilter,
    handleDamageClassFilter,
    handlePageChange,
    handleResetAll,
  } = useMoveList();

  const [keywordInput, setKeywordInput] = useState(params.moveKeyword);

  const filterSummary = useMemo(() => {
    const summary: string[] = [];

    if (params.moveKeyword) summary.push(`검색어: ${params.moveKeyword}`);
    if (params.moveTypes.length > 0) {
      summary.push(`타입: ${params.moveTypes.map((type) => POKEMON_TYPE_LABELS[type] ?? type).join(', ')}`);
    }
    if (params.moveGeneration > 0) {
      summary.push(`세대: ${GENERATIONS.find((item) => item.value === params.moveGeneration)?.label ?? params.moveGeneration}`);
    }
    if (params.moveDamageClass) {
      summary.push(
        `분류: ${MOVE_DAMAGE_CLASS_LABELS[params.moveDamageClass as keyof typeof MOVE_DAMAGE_CLASS_LABELS] ?? params.moveDamageClass}`,
      );
    }

    return summary;
  }, [params.moveDamageClass, params.moveGeneration, params.moveKeyword, params.moveTypes]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSearch(keywordInput);
  };

  const resetAll = () => {
    setKeywordInput('');
    handleResetAll();
  };

  return (
    <PageContainer>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm text-primary">Move Dex</p>
          <h1 className="text-3xl font-bold tracking-tight">기술 도감</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            타입, 세대, 물리/특수/변화 기준으로 포켓몬 기술을 탐색해보세요.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          총 <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span>개 기술
        </div>
      </div>

      <Card className="mb-6 border-primary/10">
        <CardContent className="space-y-5 p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="기술명, 영어명, 번호로 검색"
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">검색</Button>
              <Button type="button" variant="outline" onClick={resetAll}>
                초기화
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">타입 필터</p>
              {params.moveTypes.length > 0 && (
                <Button type="button" size="sm" variant="ghost" onClick={handleTypesClear}>
                  선택 해제
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {POKEMON_TYPES.map((type) => {
                const active = params.moveTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeToggle(type)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? cn('border-transparent text-white', POKEMON_TYPE_COLORS[type])
                        : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {POKEMON_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">
              <span>세대</span>
              <select
                value={String(params.moveGeneration)}
                onChange={(event) => handleGenerationFilter(Number(event.target.value))}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="0">전체 세대</option>
                {GENERATIONS.map((generation) => (
                  <option key={generation.value} value={generation.value}>
                    {generation.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold">
              <span>기술 분류</span>
              <select
                value={params.moveDamageClass}
                onChange={(event) => handleDamageClassFilter(event.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">전체 분류</option>
                {MOVE_DAMAGE_CLASSES.map((damageClass) => (
                  <option key={damageClass} value={damageClass}>
                    {MOVE_DAMAGE_CLASS_LABELS[damageClass]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>필터 대상 {filteredItemsTotal.toLocaleString()}개</span>
            {hasActiveFilter && (
              <>
                <span>•</span>
                <span className="flex flex-wrap gap-2">
                  {filterSummary.map((item) => (
                    <span key={item} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                      {item}
                    </span>
                  ))}
                </span>
                <Button type="button" size="sm" variant="ghost" onClick={resetAll}>
                  <X className="h-3.5 w-3.5" />
                  전체 초기화
                </Button>
              </>
            )}
          </div>

          {koreanTooMany && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              한글 검색은 필터 대상이 200개 이하일 때 정밀 검색됩니다. 타입/세대/분류를 더 좁혀보세요.
            </div>
          )}
          {isLoadingKorean && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
              한글 기술명을 확인하는 중입니다...
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Card key={index} className="h-full">
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pageItems.length > 0 ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {pageItems.map((item) => (
              <MoveCard key={item.id} id={item.id} name={item.name} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              다음
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed py-20 text-center">
          <p className="text-lg font-semibold">조건에 맞는 기술이 없습니다</p>
          <p className="mt-2 text-sm text-muted-foreground">검색어 또는 필터를 조정해 다시 시도해보세요.</p>
          {hasActiveFilter && (
            <Button type="button" variant="outline" className="mt-6" onClick={resetAll}>
              필터 초기화
            </Button>
          )}
        </div>
      )}
    </PageContainer>
  );
}
