import { z } from 'zod';

// ──────────────── List ────────────────

export const PokemonListItem = z.object({
  name: z.string(),
  url: z.string(),
});

export const PokemonListResponse = z.object({
  count: z.number(),
  results: z.array(PokemonListItem),
});

export type PokemonListItem = z.infer<typeof PokemonListItem>;
export type PokemonListResponse = z.infer<typeof PokemonListResponse>;

/** URL에서 pokemon ID를 추출합니다. */
export function extractIdFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? parseInt(match[1], 10) : 0;
}

// ──────────────── Detail ────────────────

export const PokemonDetail = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  base_experience: z.number().nullish(),
  sprites: z.object({
    front_default: z.string().nullish(),
    other: z
      .object({
        'official-artwork': z.object({
          front_default: z.string().nullish(),
        }),
      })
      .optional(),
  }),
  types: z.array(
    z.object({
      slot: z.number(),
      type: z.object({ name: z.string(), url: z.string() }),
    }),
  ),
  abilities: z.array(
    z.object({
      ability: z.object({ name: z.string(), url: z.string() }),
      is_hidden: z.boolean(),
      slot: z.number(),
    }),
  ),
  stats: z.array(
    z.object({
      base_stat: z.number(),
      stat: z.object({ name: z.string(), url: z.string() }),
    }),
  ),
  moves: z
    .array(z.object({ move: z.object({ name: z.string(), url: z.string() }) }))
    .optional(),
  species: z.object({ name: z.string(), url: z.string() }),
  cries: z
    .object({
      latest: z.string().nullish(),
      legacy: z.string().nullish(),
    })
    .optional(),
});

export type PokemonDetail = z.infer<typeof PokemonDetail>;

// ──────────────── Species ────────────────

export const PokemonSpecies = z.object({
  id: z.number(),
  name: z.string(),
  names: z.array(
    z.object({
      name: z.string(),
      language: z.object({ name: z.string() }),
    }),
  ),
  genera: z.array(
    z.object({
      genus: z.string(),
      language: z.object({ name: z.string() }),
    }),
  ),
  varieties: z.array(
    z.object({
      is_default: z.boolean(),
      pokemon: z.object({ name: z.string(), url: z.string() }),
    }),
  ).optional(),
  evolution_chain: z.object({ url: z.string() }),
  generation: z.object({ name: z.string(), url: z.string() }),
  flavor_text_entries: z
    .array(
      z.object({
        flavor_text: z.string(),
        language: z.object({ name: z.string() }),
        version: z.object({ name: z.string() }),
      }),
    )
    .optional(),
});

export type PokemonSpecies = z.infer<typeof PokemonSpecies>;

// ──────────────── Evolution chain (재귀) ────────────────

export type EvolutionChainLink = {
  species: { name: string; url: string };
  evolves_to: EvolutionChainLink[];
};

const EvolutionChainLinkSchema: z.ZodType<EvolutionChainLink> = z.lazy(() =>
  z.object({
    species: z.object({ name: z.string(), url: z.string() }),
    evolves_to: z.array(EvolutionChainLinkSchema),
  }),
);

export const EvolutionChain = z.object({
  id: z.number(),
  chain: EvolutionChainLinkSchema,
});

export type EvolutionChain = z.infer<typeof EvolutionChain>;

// ──────────────── Type endpoint ────────────────

export const PokemonTypeResponse = z.object({
  id: z.number(),
  name: z.string(),
  pokemon: z.array(
    z.object({
      pokemon: z.object({ name: z.string(), url: z.string() }),
      slot: z.number(),
    }),
  ),
});

export type PokemonTypeResponse = z.infer<typeof PokemonTypeResponse>;

// ──────────────── Ability (한글명 조회용) ────────────────

export const PokemonAbilityDetail = z.object({
  id: z.number(),
  name: z.string(),
  names: z.array(
    z.object({
      name: z.string(),
      language: z.object({ name: z.string() }),
    }),
  ),
});

export type PokemonAbilityDetail = z.infer<typeof PokemonAbilityDetail>;

// ──────────────── Search params ────────────────

export const PokemonListParams = z.object({
  keyword: z.string().default(''),
  type: z.string().default(''),
  generation: z.coerce.number().default(0),
  page: z.coerce.number().default(1),
});

export type PokemonListParams = z.infer<typeof PokemonListParams>;
