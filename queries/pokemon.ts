import ky from 'ky';
import { queryOptions } from '@tanstack/react-query';

import { pokeapi } from '@/lib/pokeapi';
import {
  PokemonListResponse,
  PokemonDetail,
  PokemonSpecies,
  PokemonAbilityDetail,
  EvolutionChain,
  PokemonTypeResponse,
} from '@/scheme/pokemon';

// ──────────────── 전체 포켓몬 목록 (이름 + ID만) ────────────────

export function buildAllPokemonQuery() {
  return queryOptions({
    queryKey: ['/pokemon', 'all-1025'],
    queryFn: async () => {
      const data = await pokeapi
        .get('pokemon', { searchParams: { limit: 1025, offset: 0 } })
        .json<unknown>();
      return PokemonListResponse.parse(data);
    },
    staleTime: Infinity,
  });
}

// ──────────────── 포켓몬 상세 ────────────────

export function buildPokemonDetailQuery(id: number | string) {
  return queryOptions({
    queryKey: ['/pokemon', String(id)],
    queryFn: async () => {
      const data = await pokeapi.get(`pokemon/${id}`).json<unknown>();
      return PokemonDetail.parse(data);
    },
    staleTime: 1000 * 60 * 60,
  });
}

// ──────────────── 포켓몬 도감 설명 (한글명 + 분류 + 진화 체인 URL) ────────────────

export function buildPokemonSpeciesQuery(id: number | string) {
  return queryOptions({
    queryKey: ['/pokemon-species', String(id)],
    queryFn: async () => {
      const data = await pokeapi.get(`pokemon-species/${id}`).json<unknown>();
      return PokemonSpecies.parse(data);
    },
    staleTime: 1000 * 60 * 60,
  });
}

// ──────────────── 진화 체인 ────────────────

export function buildEvolutionChainQuery(url: string) {
  const id = url.match(/\/(\d+)\/?$/)?.[1] ?? '';
  return queryOptions({
    queryKey: ['/evolution-chain', id],
    queryFn: async () => {
      const data = await ky.get(url).json<unknown>();
      return EvolutionChain.parse(data);
    },
    staleTime: 1000 * 60 * 60,
    enabled: !!url,
  });
}

// ──────────────── 특성 (한글명 포함) ────────────────

export function buildPokemonAbilityQuery(name: string) {
  return queryOptions({
    queryKey: ['/ability', name],
    queryFn: async () => {
      const data = await pokeapi.get(`ability/${name}`).json<unknown>();
      return PokemonAbilityDetail.parse(data);
    },
    staleTime: Infinity,
    enabled: !!name,
  });
}

// ──────────────── 타입별 포켓몬 목록 ────────────────

export function buildPokemonTypeQuery(type: string) {
  return queryOptions({
    queryKey: ['/type', type],
    queryFn: async () => {
      const data = await pokeapi.get(`type/${type}`).json<unknown>();
      return PokemonTypeResponse.parse(data);
    },
    staleTime: 1000 * 60 * 60,
    enabled: !!type,
  });
}
