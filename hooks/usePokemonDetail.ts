import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';

import {
  buildPokemonDetailQuery,
  buildPokemonSpeciesQuery,
  buildEvolutionChainQuery,
  buildPokemonAbilityQuery,
} from '@/queries/pokemon';

export function usePokemonDetail(id: number | string) {
  const { data: pokemon, isLoading: isLoadingPokemon } = useQuery(buildPokemonDetailQuery(id));
  const { data: species, isLoading: isLoadingSpecies } = useQuery(buildPokemonSpeciesQuery(id));

  const evolutionChainUrl = species?.evolution_chain.url ?? '';
  const { data: evolutionChain, isLoading: isLoadingEvolution } = useQuery({
    ...buildEvolutionChainQuery(evolutionChainUrl),
    enabled: !!evolutionChainUrl,
  });

  // ── 특성 한글명 ──
  const abilityResults = useQueries({
    queries:
      pokemon?.abilities.map((a) => ({
        ...buildPokemonAbilityQuery(a.ability.name),
        enabled: !!a.ability.name,
      })) ?? [],
  });

  const abilityKoreanNames = useMemo(() => {
    const map = new Map<string, string>();
    pokemon?.abilities.forEach((a, idx) => {
      const koName = abilityResults[idx]?.data?.names.find(
        (n) => n.language.name === 'ko',
      )?.name;
      if (koName) map.set(a.ability.name, koName);
    });
    return map;
  }, [pokemon?.abilities, abilityResults]);

  // ── 한글 텍스트 ──
  const koreanName   = species?.names.find((n) => n.language.name === 'ko')?.name ?? '';
  const koreanGenus  = species?.genera.find((g) => g.language.name === 'ko')?.genus ?? '';
  const flavorText   =
    species?.flavor_text_entries
      ?.filter((e) => e.language.name === 'ko')
      .at(-1)
      ?.flavor_text.replace(/\f|\n/g, ' ') ?? '';

  const isLoading = isLoadingPokemon || isLoadingSpecies;

  return {
    pokemon,
    species,
    evolutionChain,
    koreanName,
    koreanGenus,
    flavorText,
    abilityKoreanNames,
    isLoading,
    isLoadingEvolution,
  };
}
