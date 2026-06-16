import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';

import {
  buildPokemonDetailQuery,
  buildPokemonSpeciesQuery,
  buildPokemonSpeciesByUrlQuery,
  buildEvolutionChainQuery,
  buildPokemonAbilityQuery,
  buildPokemonFormQuery,
} from '@/queries/pokemon';

export function usePokemonDetail(id: number | string) {
  const { data: pokemon, isLoading: isLoadingPokemon } = useQuery(buildPokemonDetailQuery(id));
  const speciesUrl = pokemon?.species.url ?? '';
  const { data: species, isLoading: isLoadingSpecies } = useQuery({
    ...buildPokemonSpeciesByUrlQuery(speciesUrl),
    enabled: !!speciesUrl,
  });

  const evolutionChainUrl = species?.evolution_chain.url ?? '';
  const { data: evolutionChain, isLoading: isLoadingEvolution } = useQuery({
    ...buildEvolutionChainQuery(evolutionChainUrl),
    enabled: !!evolutionChainUrl,
  });

  const isAlternateForm = !!species && !!pokemon && pokemon.name !== species.name;
  const currentFormName = isAlternateForm ? pokemon?.name ?? '' : '';
  const { data: currentForm } = useQuery({
    ...buildPokemonFormQuery(currentFormName),
    enabled: !!currentFormName,
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

  const relatedPokemonIds = useMemo(() => {
    const ids = new Set<number>();

    abilityResults.forEach((result) => {
      result.data?.pokemon?.slice(0, 12).forEach((item) => {
        const pokemonId = Number(item.pokemon.url.match(/\/(\d+)\/?$/)?.[1] ?? 0);
        if (pokemonId > 0) ids.add(pokemonId);
      });
    });

    return [...ids];
  }, [abilityResults]);

  const relatedPokemonSpeciesResults = useQueries({
    queries: relatedPokemonIds.map((pokemonId) => ({
      ...buildPokemonSpeciesQuery(pokemonId),
      enabled: pokemonId > 0,
    })),
  });

  const relatedPokemonKoreanNames = useMemo(() => {
    const map = new Map<number, string>();

    relatedPokemonIds.forEach((pokemonId, idx) => {
      const koreanRelatedName = relatedPokemonSpeciesResults[idx]?.data?.names.find(
        (name) => name.language.name === 'ko',
      )?.name;

      if (koreanRelatedName) {
        map.set(pokemonId, koreanRelatedName);
      }
    });

    return map;
  }, [relatedPokemonIds, relatedPokemonSpeciesResults]);

  const abilityDetails = useMemo(() => {
    return (
      pokemon?.abilities.map((ability, idx) => {
        const detail = abilityResults[idx]?.data;

        const koreanName = detail?.names.find((n) => n.language.name === 'ko')?.name ?? null;
        const englishName = detail?.names.find((n) => n.language.name === 'en')?.name ?? ability.ability.name;

        const effectText =
          detail?.effect_entries
            ?.find((entry) => entry.language.name === 'ko')
            ?.short_effect.replace(/\f|\n/g, ' ') ??
          detail?.effect_entries
            ?.find((entry) => entry.language.name === 'en')
            ?.short_effect.replace(/\f|\n/g, ' ') ??
          '';

        const flavorText =
          detail?.flavor_text_entries
            ?.filter((entry) => entry.language.name === 'ko')
            .at(-1)
            ?.flavor_text.replace(/\f|\n/g, ' ') ?? '';

        const relatedPokemon =
          detail?.pokemon
            ?.slice(0, 12)
            .map((item) => ({
              id: Number(item.pokemon.url.match(/\/(\d+)\/?$/)?.[1] ?? 0),
              name: item.pokemon.name,
              koreanName:
                relatedPokemonKoreanNames.get(
                  Number(item.pokemon.url.match(/\/(\d+)\/?$/)?.[1] ?? 0),
                ) ?? null,
              isHidden: item.is_hidden,
            }))
            .filter((item) => item.id > 0) ?? [];

        return {
          key: ability.ability.name,
          name: ability.ability.name,
          koreanName,
          englishName,
          isHidden: ability.is_hidden,
          effectText,
          flavorText,
          relatedPokemon,
          isLoading: abilityResults[idx]?.isLoading ?? false,
        };
      }) ?? []
    );
  }, [pokemon?.abilities, abilityResults, relatedPokemonKoreanNames]);

  // ── 한글 텍스트 ──
  const koreanName   = species?.names.find((n) => n.language.name === 'ko')?.name ?? '';
  const koreanGenus  = species?.genera.find((g) => g.language.name === 'ko')?.genus ?? '';
  const flavorText   =
    species?.flavor_text_entries
      ?.filter((e) => e.language.name === 'ko')
      .at(-1)
      ?.flavor_text.replace(/\f|\n/g, ' ') ?? '';

  const isLoading = isLoadingPokemon || isLoadingSpecies;
  const currentFormLabel =
    currentForm?.form_names?.find((entry) => entry.language.name === 'ko')?.name ??
    currentForm?.names?.find((entry) => entry.language.name === 'ko')?.name ??
    currentForm?.names?.find((entry) => entry.language.name === 'en')?.name ??
    null;

  return {
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
  };
}
