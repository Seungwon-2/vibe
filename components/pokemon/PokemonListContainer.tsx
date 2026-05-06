'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Shuffle, SlidersHorizontal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { PokemonCard } from './PokemonCard';
import { usePokemonList } from '@/hooks/usePokemonList';
import {
  POKEMON_TYPES,
  POKEMON_TYPE_LABELS,
  POKEMON_TYPE_COLORS,
  GENERATIONS,
  HEIGHT_CATEGORIES,
  WEIGHT_CATEGORIES,
} from '@/const/pokemon';
import { cn } from '@/lib/utils';

export function PokemonListContainer() {
  const router = useRouter();
  const {
    params,
    pageItems,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    isLoadingKorean,
    isLoadingDetailFilter,
    koreanTooMany,
    loadedCount,
    filteredItemsTotal,
    hasActiveFilter,
    handleSearch,
    handleTypeToggle,
    handleTypesClear,
    handleGenerationFilter,
    handlePageChange,
    handleHeightFilter,
    handleWeightFilter,
    handleResetAll,
  } = usePokemonList();

  // 검색창 로컬 상태 + 디바운스
  const [localKeyword, setLocalKeyword] = useState(params.keyword);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 고급 필터 패널 토글 (URL에 heightCat/weightCat 있으면 기본 열림)
  const [showAdvanced, setShowAdvanced] = useState(
    () => !!params.heightCat || !!params.weightCat,
  );

  useEffect(() => {
    setLocalKeyword(params.keyword);
  }, [params.keyword]);

  const handleInputChange = useCallback(
    (value: string) => {
      setLocalKeyword(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => handleSearch(value), 350);
    },
    [handleSearch],
  );

  const handleRandom = useCallback(() => {
    const randomId = Math.floor(Math.random() * 1025) + 1;
    router.push(`/pokemon/${randomId}`);
  }, [router]);

  // 선택된 타입 수 표시 레이블
  const typesLabel =
    params.types.length === 0
      ? '전체 타입'
      : params.types.length === 1
        ? POKEMON_TYPE_LABELS[params.types[0]] ?? params.types[0]
        : `${params.types.length}개 타입`;

  return (
    <PageContainer>
      {/* ── 헤더 ── */}
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="포켓몬 도감" description="이름 또는 번호로 포켓몬을 검색하세요" />
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced((v) => !v)}
            className={cn('gap-2', showAdvanced && 'bg-muted')}
          >
            <SlidersHorizontal className="h-4 w-4" />
            고급 필터
          </Button>
          <Button variant="outline" size="sm" onClick={handleRandom} className="gap-2">
            <Shuffle className="h-4 w-4" />
            랜덤
          </Button>
        </div>
      </div>

      {/* ── 검색창 ── */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="포켓몬 이름 또는 번호로 검색..."
          className="pl-10"
          value={localKeyword}
          onChange={(e) => handleInputChange(e.target.value)}
        />
      </div>

      {/* ── 세대 필터 ── */}
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          variant={params.generation === 0 ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleGenerationFilter(0)}
        >
          전체
        </Button>
        {GENERATIONS.map((gen) => (
          <Button
            key={gen.value}
            variant={params.generation === gen.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleGenerationFilter(gen.value)}
          >
            {gen.label}
          </Button>
        ))}
      </div>

      {/* ── 타입 필터 (다중 선택 OR) ── */}
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Badge
          className={cn(
            'cursor-pointer',
            params.types.length === 0
              ? 'bg-foreground text-background hover:bg-foreground/80'
              : 'bg-muted text-foreground hover:bg-muted/80',
          )}
          onClick={handleTypesClear}
        >
          전체 타입
        </Badge>
        {POKEMON_TYPES.map((type) => {
          const selected = params.types.includes(type);
          return (
            <Badge
              key={type}
              className={cn(
                POKEMON_TYPE_COLORS[type],
                'cursor-pointer text-white transition-all',
                selected && 'ring-2 ring-offset-1 ring-foreground scale-110',
              )}
              onClick={() => handleTypeToggle(type)}
            >
              {POKEMON_TYPE_LABELS[type]}
            </Badge>
          );
        })}
      </div>
      {params.types.length > 0 && (
        <p className="mb-3 text-xs text-muted-foreground">
          선택된 타입: {typesLabel} (AND 조건 — 선택한 모든 타입을 동시에 가진 포켓몬)
        </p>
      )}
      {params.types.length === 0 && <div className="mb-4" />}

      {/* ── 고급 필터 (키 / 몸무게) ── */}
      {showAdvanced && (
        <div className="mb-5 rounded-xl border bg-muted/30 p-4 space-y-4">
          {/* 키 필터 */}
          <div>
            <p className="mb-2 text-sm font-semibold">키 (Height)</p>
            <div className="flex flex-wrap gap-2">
              <Badge
                className={cn(
                  'cursor-pointer',
                  !params.heightCat
                    ? 'bg-foreground text-background hover:bg-foreground/80'
                    : 'bg-muted text-foreground hover:bg-muted/80',
                )}
                onClick={() => handleHeightFilter('')}
              >
                전체
              </Badge>
              {HEIGHT_CATEGORIES.map((cat) => (
                <Badge
                  key={cat.value}
                  className={cn(
                    'cursor-pointer transition-all',
                    params.heightCat === cat.value
                      ? 'bg-sky-500 text-white ring-2 ring-sky-700 scale-110'
                      : 'bg-sky-100 text-sky-800 hover:bg-sky-200',
                  )}
                  onClick={() =>
                    handleHeightFilter(params.heightCat === cat.value ? '' : cat.value)
                  }
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* 몸무게 필터 */}
          <div>
            <p className="mb-2 text-sm font-semibold">몸무게 (Weight)</p>
            <div className="flex flex-wrap gap-2">
              <Badge
                className={cn(
                  'cursor-pointer',
                  !params.weightCat
                    ? 'bg-foreground text-background hover:bg-foreground/80'
                    : 'bg-muted text-foreground hover:bg-muted/80',
                )}
                onClick={() => handleWeightFilter('')}
              >
                전체
              </Badge>
              {WEIGHT_CATEGORIES.map((cat) => (
                <Badge
                  key={cat.value}
                  className={cn(
                    'cursor-pointer transition-all',
                    params.weightCat === cat.value
                      ? 'bg-amber-500 text-white ring-2 ring-amber-700 scale-110'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200',
                  )}
                  onClick={() =>
                    handleWeightFilter(params.weightCat === cat.value ? '' : cat.value)
                  }
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 한글 검색 안내 ── */}
      {koreanTooMany && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          ⚠️ 한글 검색은 세대 또는 타입 필터로 범위를 400마리 이하로 줄인 후 사용하세요.
        </p>
      )}

      {/* ── 결과 수 + 진행 표시 + 필터 초기화 ── */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? '불러오는 중...'
            : isLoadingKorean
              ? '한글 이름 로딩 중...'
              : isLoadingDetailFilter
                ? `상세 데이터 로딩 중... (${loadedCount} / ${filteredItemsTotal})`
                : `${totalCount.toLocaleString()}마리`}
        </p>
        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={handleResetAll} className="gap-1 text-xs">
            <X className="h-3 w-3" />
            필터 초기화
          </Button>
        )}
      </div>

      {/* ── 포켓몬 그리드 ── */}
      {isLoadingDetailFilter ? (
        /* 키/몸무게 상세 로딩 중 스켈레톤 */
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border">
              <div className="p-4">
                <Skeleton className="mb-3 aspect-square w-full rounded-lg" />
                <Skeleton className="mb-1 h-3 w-12" />
                <Skeleton className="mb-2 h-4 w-24" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading && pageItems.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-xl font-semibold">검색 결과가 없습니다</p>
          <p className="mt-2 text-muted-foreground">다른 검색어나 필터를 시도해보세요</p>
          <Button variant="outline" className="mt-6" onClick={handleResetAll}>
            필터 초기화
          </Button>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {pageItems.map(({ id, name }: { id: number; name: string }) => (
            <PokemonCard key={id} id={id} name={name} />
          ))}
        </div>
      )}

      {/* ── 페이지네이션 ── */}
      {!isLoadingDetailFilter && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
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
      )}
    </PageContainer>
  );
}
