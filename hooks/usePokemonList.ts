import { useMemo, useCallback } from 'react';
import { useQueryStates } from 'nuqs';
import { useQuery, useQueries } from '@tanstack/react-query';

import {
  buildAllPokemonQuery,
  buildPokemonDetailQuery,
  buildPokemonSpeciesQuery,
  buildPokemonTypeQuery,
} from '@/queries/pokemon';
import { extractIdFromUrl } from '@/scheme/pokemon';
import { GENERATIONS, PAGE_SIZE, HEIGHT_CATEGORIES, WEIGHT_CATEGORIES } from '@/const/pokemon';
import { searchParamParsers } from '@/app/searchParams';

/** 한글 문자 포함 여부 */
function hasKorean(str: string) {
  return /[가-힣]/.test(str);
}

/** 한글 검색 허용 최대 범위 (초과 시 안내 메시지 표시) */
const KOREAN_SEARCH_LIMIT = 400;

export function usePokemonList() {
  const [params, setParams] = useQueryStates(searchParamParsers);

  // ── 전체 포켓몬 목록 ──
  const { data: allPokemon, isLoading: isLoadingAll } = useQuery(buildAllPokemonQuery());

  // ── 다중 타입 쿼리 (AND 교집합) ──
  const typeQueryResult = useQueries({
    queries: params.types.map((type) => ({
      ...buildPokemonTypeQuery(type),
      enabled: !!type,
    })),
    combine: (results) => ({
      data:
        results.length > 0 && results.every((r) => r.data !== undefined)
          ? results
              .map((r) => new Set(r.data?.pokemon.map((p) => p.pokemon.name) ?? []))
              .reduce((acc, set) => new Set([...acc].filter((name) => set.has(name))))
          : null,
      isLoading: results.some((r) => r.isLoading),
    }),
  });

  const typeNameSet: Set<string> | null =
    params.types.length > 0 ? (typeQueryResult.data ?? null) : null;

  // ── 세대 범위 ──
  const genRange = useMemo(() => {
    if (params.generation === 0) return null;
    return GENERATIONS.find((g) => g.value === params.generation) ?? null;
  }, [params.generation]);

  // ── 키/몸무게 카테고리 ──
  const heightRange = useMemo(
    () => HEIGHT_CATEGORIES.find((c) => c.value === params.heightCat) ?? null,
    [params.heightCat],
  );
  const weightRange = useMemo(
    () => WEIGHT_CATEGORIES.find((c) => c.value === params.weightCat) ?? null,
    [params.weightCat],
  );

  // ── 1차 필터: 세대 + 타입 (키워드 제외) ──
  // 한글 검색 시 여기서 species 데이터를 가져와야 하므로 키워드는 분리
  const genTypeFilteredItems = useMemo(() => {
    if (!allPokemon) return [];
    return allPokemon.results
      .map((item) => ({ name: item.name, id: extractIdFromUrl(item.url) }))
      .filter((p) => {
        if (genRange && (p.id < genRange.min || p.id > genRange.max)) return false;
        if (typeNameSet && !typeNameSet.has(p.name)) return false;
        return true;
      });
  }, [allPokemon, genRange, typeNameSet]);

  // ── 한글 키워드 → species 일괄 조회 ──
  const isKoreanKeyword   = hasKorean(params.keyword);
  const koreanSearchable  = isKoreanKeyword && genTypeFilteredItems.length <= KOREAN_SEARCH_LIMIT;
  const koreanTooMany     = isKoreanKeyword && genTypeFilteredItems.length > KOREAN_SEARCH_LIMIT;

  const koreanSpeciesResults = useQueries({
    queries: koreanSearchable
      ? genTypeFilteredItems.map(({ id }) => buildPokemonSpeciesQuery(id))
      : [],
  });

  const isLoadingKorean = koreanSearchable && koreanSpeciesResults.some((r) => r.isLoading);

  // 한글 이름 맵 { id → 한글명 }
  const koreanNameMap = useMemo(() => {
    const map = new Map<number, string>();
    if (!koreanSearchable) return map;
    koreanSpeciesResults.forEach((r, idx) => {
      const koName = r.data?.names.find((n) => n.language.name === 'ko')?.name;
      if (koName && genTypeFilteredItems[idx]) {
        map.set(genTypeFilteredItems[idx].id, koName);
      }
    });
    return map;
  }, [koreanSearchable, koreanSpeciesResults, genTypeFilteredItems]);

  // ── 2차 필터: 키워드 (영어 + 한글) ──
  const filteredItems = useMemo(() => {
    if (!params.keyword) return genTypeFilteredItems;
    const kw = params.keyword.toLowerCase().trim();

    return genTypeFilteredItems.filter((p) => {
      // 영어 이름 or 번호 매칭
      if (p.name.toLowerCase().includes(kw) || p.id.toString() === kw) return true;
      // 한글 이름 매칭 (캐싱된 데이터 기반)
      const koName = koreanNameMap.get(p.id) ?? '';
      if (koName.includes(kw)) return true;
      return false;
    });
  }, [genTypeFilteredItems, params.keyword, koreanNameMap]);

  // ── 3차 필터: 키/몸무게 — filteredItems 전체 대상 상세 조회 ──
  const needDetailFilter = !!params.heightCat || !!params.weightCat;

  const allDetailResults = useQueries({
    queries: needDetailFilter
      ? filteredItems.map(({ id }) => buildPokemonDetailQuery(id))
      : [],
  });

  const loadedCount          = needDetailFilter ? allDetailResults.filter((r) => !!r.data).length : 0;
  const isLoadingDetailFilter = needDetailFilter && allDetailResults.some((r) => r.isLoading);

  const hwFilteredItems = useMemo(() => {
    if (!needDetailFilter) return filteredItems;
    return filteredItems.filter((item, idx) => {
      const detail = allDetailResults[idx]?.data;
      if (!detail) return false;
      const heightM  = detail.height / 10;
      const weightKg = detail.weight / 10;
      if (heightRange && (heightM  < heightRange.min  || heightM  >= heightRange.max))  return false;
      if (weightRange && (weightKg < weightRange.min || weightKg >= weightRange.max)) return false;
      return true;
    });
  }, [needDetailFilter, filteredItems, allDetailResults, heightRange, weightRange]);

  // ── 페이지네이션 ──
  const totalCount  = isLoadingDetailFilter ? filteredItems.length : hwFilteredItems.length;
  const totalPages  = Math.max(1, Math.ceil(hwFilteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, params.page), totalPages);

  const pageItems = useMemo(() => {
    if (isLoadingDetailFilter) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return hwFilteredItems.slice(start, start + PAGE_SIZE);
  }, [hwFilteredItems, currentPage, isLoadingDetailFilter]);

  // ── 핸들러 ──

  const handleSearch = useCallback(
    (keyword: string) => void setParams({ keyword, page: 1 }),
    [setParams],
  );
  const handleTypeToggle = useCallback(
    (type: string) => {
      const next = params.types.includes(type)
        ? params.types.filter((t) => t !== type)
        : [...params.types, type];
      void setParams({ types: next, page: 1 });
    },
    [params.types, setParams],
  );
  const handleTypesClear     = useCallback(() => void setParams({ types: [], page: 1 }), [setParams]);
  const handleGenerationFilter = useCallback(
    (generation: number) => void setParams({ generation, page: 1 }),
    [setParams],
  );
  const handlePageChange     = useCallback((page: number) => void setParams({ page }), [setParams]);
  const handleHeightFilter   = useCallback(
    (heightCat: string) => void setParams({ heightCat, page: 1 }),
    [setParams],
  );
  const handleWeightFilter   = useCallback(
    (weightCat: string) => void setParams({ weightCat, page: 1 }),
    [setParams],
  );
  const handleResetAll       = useCallback(
    () => void setParams({ keyword: '', types: [], generation: 0, heightCat: '', weightCat: '', page: 1 }),
    [setParams],
  );

  const isLoading = isLoadingAll || typeQueryResult.isLoading;

  const hasActiveFilter =
    !!params.keyword ||
    params.types.length > 0 ||
    params.generation !== 0 ||
    !!params.heightCat ||
    !!params.weightCat;

  return {
    params,
    pageItems,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    isLoadingKorean,        // 한글 이름 로딩 중
    isLoadingDetailFilter,
    koreanTooMany,          // 한글 검색 범위 초과 안내
    loadedCount,
    filteredItemsTotal: filteredItems.length,
    hasActiveFilter,
    handleSearch,
    handleTypeToggle,
    handleTypesClear,
    handleGenerationFilter,
    handlePageChange,
    handleHeightFilter,
    handleWeightFilter,
    handleResetAll,
  };
}
