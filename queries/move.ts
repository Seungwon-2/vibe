import { queryOptions } from '@tanstack/react-query';

import { pokeapi } from '@/lib/pokeapi';
import {
  MoveDamageClassResponse,
  MoveDetail,
  MoveGenerationResponse,
  MoveListResponse,
  TypeMoveResponse,
} from '@/scheme/move';

export function buildAllMovesQuery() {
  return queryOptions({
    queryKey: ['/move', 'all'],
    queryFn: async () => {
      const data = await pokeapi
        .get('move', {
          searchParams: { limit: 2000, offset: 0 },
        })
        .json<unknown>();
      return MoveListResponse.parse(data);
    },
    staleTime: Infinity,
  });
}

/** 기술 상세 쿼리 (한글명, 위력, 타입 등) */
export function buildMoveDetailQuery(name: string | number) {
  return queryOptions({
    queryKey: ['/move', String(name)],
    queryFn: async () => {
      const data = await pokeapi.get(`move/${name}`).json<unknown>();
      return MoveDetail.parse(data);
    },
    staleTime: Infinity,
    enabled: !!name,
  });
}

export function buildMoveTypeQuery(type: string) {
  return queryOptions({
    queryKey: ['/type', type, 'moves'],
    queryFn: async () => {
      const data = await pokeapi.get(`type/${type}`).json<unknown>();
      return TypeMoveResponse.parse(data);
    },
    staleTime: 1000 * 60 * 60,
    enabled: !!type,
  });
}

export function buildMoveDamageClassQuery(damageClass: string) {
  return queryOptions({
    queryKey: ['/move-damage-class', damageClass],
    queryFn: async () => {
      const data = await pokeapi.get(`move-damage-class/${damageClass}`).json<unknown>();
      return MoveDamageClassResponse.parse(data);
    },
    staleTime: 1000 * 60 * 60,
    enabled: !!damageClass,
  });
}

export function buildMoveGenerationQuery(generation: number) {
  return queryOptions({
    queryKey: ['/generation', generation, 'moves'],
    queryFn: async () => {
      const data = await pokeapi.get(`generation/${generation}`).json<unknown>();
      return MoveGenerationResponse.parse(data);
    },
    staleTime: 1000 * 60 * 60,
    enabled: generation > 0,
  });
}
