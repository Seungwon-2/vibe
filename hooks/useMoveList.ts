import { useMemo, useCallback } from 'react';
import { useQueryStates } from 'nuqs';
import { useQuery, useQueries } from '@tanstack/react-query';

import { searchParamParsers } from '@/app/searchParams';
import { PAGE_SIZE } from '@/const/pokemon';
import {
  buildAllMovesQuery,
  buildMoveDamageClassQuery,
  buildMoveDetailQuery,
  buildMoveGenerationQuery,
  buildMoveTypeQuery,
} from '@/queries/move';
import { extractMoveIdFromUrl } from '@/scheme/move';

function hasKorean(value: string) {
  return /[가-힣]/.test(value);
}

const KOREAN_SEARCH_LIMIT = 200;

export function useMoveList() {
  const [params, setParams] = useQueryStates(searchParamParsers);

  const { data: allMoves, isLoading: isLoadingAll } = useQuery(buildAllMovesQuery());

  const typeQueryResult = useQueries({
    queries: params.moveTypes.map((type) => ({
      ...buildMoveTypeQuery(type),
      enabled: !!type,
    })),
    combine: (results) => ({
      data:
        results.length > 0 && results.every((result) => result.data !== undefined)
          ? results
              .map((result) => new Set(result.data?.moves.map((item) => item.name) ?? []))
              .reduce((acc, set) => new Set([...acc].filter((name) => set.has(name))))
          : null,
      isLoading: results.some((result) => result.isLoading),
    }),
  });

  const moveTypeNameSet: Set<string> | null =
    params.moveTypes.length > 0 ? (typeQueryResult.data ?? null) : null;

  const { data: generationData, isLoading: isLoadingGeneration } = useQuery({
    ...buildMoveGenerationQuery(params.moveGeneration),
    enabled: params.moveGeneration > 0,
  });

  const generationNameSet = useMemo(() => {
    if (!generationData) return null;
    return new Set(generationData.moves.map((item) => item.name));
  }, [generationData]);

  const { data: damageClassData, isLoading: isLoadingDamageClass } = useQuery({
    ...buildMoveDamageClassQuery(params.moveDamageClass),
    enabled: !!params.moveDamageClass,
  });

  const damageClassNameSet = useMemo(() => {
    if (!damageClassData) return null;
    return new Set(damageClassData.moves.map((item) => item.name));
  }, [damageClassData]);

  const baseFilteredItems = useMemo(() => {
    if (!allMoves) return [];

    return allMoves.results
      .map((item) => ({
        id: extractMoveIdFromUrl(item.url),
        name: item.name,
        url: item.url,
      }))
      .filter((item) => {
        if (moveTypeNameSet && !moveTypeNameSet.has(item.name)) return false;
        if (generationNameSet && !generationNameSet.has(item.name)) return false;
        if (damageClassNameSet && !damageClassNameSet.has(item.name)) return false;
        return true;
      });
  }, [allMoves, moveTypeNameSet, generationNameSet, damageClassNameSet]);

  const isKoreanKeyword = hasKorean(params.moveKeyword);
  const koreanSearchable = isKoreanKeyword && baseFilteredItems.length <= KOREAN_SEARCH_LIMIT;
  const koreanTooMany = isKoreanKeyword && baseFilteredItems.length > KOREAN_SEARCH_LIMIT;

  const koreanDetailResults = useQueries({
    queries: koreanSearchable
      ? baseFilteredItems.map((item) => buildMoveDetailQuery(item.id))
      : [],
  });

  const isLoadingKorean = koreanSearchable && koreanDetailResults.some((result) => result.isLoading);

  const koreanNameMap = useMemo(() => {
    const map = new Map<number, string>();

    if (!koreanSearchable) return map;

    koreanDetailResults.forEach((result, index) => {
      const koreanName = result.data?.names.find((name) => name.language.name === 'ko')?.name;
      const item = baseFilteredItems[index];

      if (item && koreanName) {
        map.set(item.id, koreanName);
      }
    });

    return map;
  }, [baseFilteredItems, koreanDetailResults, koreanSearchable]);

  const filteredItems = useMemo(() => {
    const keyword = params.moveKeyword.trim().toLowerCase();
    if (!keyword) return baseFilteredItems;

    return baseFilteredItems.filter((item) => {
      if (item.name.toLowerCase().includes(keyword)) return true;
      if (item.id.toString() === keyword) return true;

      const koreanName = koreanNameMap.get(item.id) ?? '';
      return koreanName.includes(keyword);
    });
  }, [baseFilteredItems, koreanNameMap, params.moveKeyword]);

  const totalCount = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, params.movePage), totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  const handleSearch = useCallback(
    (moveKeyword: string) => {
      void setParams({ moveKeyword, movePage: 1 });
    },
    [setParams],
  );

  const handleTypeToggle = useCallback(
    (moveType: string) => {
      const next = params.moveTypes.includes(moveType)
        ? params.moveTypes.filter((item) => item !== moveType)
        : [...params.moveTypes, moveType];

      void setParams({ moveTypes: next, movePage: 1 });
    },
    [params.moveTypes, setParams],
  );

  const handleTypesClear = useCallback(
    () => void setParams({ moveTypes: [], movePage: 1 }),
    [setParams],
  );

  const handleGenerationFilter = useCallback(
    (moveGeneration: number) => {
      void setParams({ moveGeneration, movePage: 1 });
    },
    [setParams],
  );

  const handleDamageClassFilter = useCallback(
    (moveDamageClass: string) => {
      void setParams({ moveDamageClass, movePage: 1 });
    },
    [setParams],
  );

  const handlePageChange = useCallback(
    (movePage: number) => {
      void setParams({ movePage });
    },
    [setParams],
  );

  const handleResetAll = useCallback(
    () => {
      void setParams({
        moveKeyword: '',
        moveTypes: [],
        moveGeneration: 0,
        moveDamageClass: '',
        movePage: 1,
      });
    },
    [setParams],
  );

  const isLoading =
    isLoadingAll ||
    typeQueryResult.isLoading ||
    isLoadingGeneration ||
    isLoadingDamageClass;

  const hasActiveFilter =
    !!params.moveKeyword ||
    params.moveTypes.length > 0 ||
    params.moveGeneration !== 0 ||
    !!params.moveDamageClass;

  return {
    params,
    pageItems,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    isLoadingKorean,
    koreanTooMany,
    filteredItemsTotal: baseFilteredItems.length,
    hasActiveFilter,
    handleSearch,
    handleTypeToggle,
    handleTypesClear,
    handleGenerationFilter,
    handleDamageClassFilter,
    handlePageChange,
    handleResetAll,
  };
}