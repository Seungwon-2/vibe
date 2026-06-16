import { z } from 'zod';

export const LocalizedName = z.object({
  name: z.string(),
  language: z.object({ name: z.string() }),
});

export type LocalizedName = z.infer<typeof LocalizedName>;

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
  capture_rate: z.number(),
  is_legendary: z.boolean(),
  is_mythical: z.boolean(),
  names: z.array(LocalizedName),
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

export const LocalizedNamedApiResource = z.object({
  id: z.number().optional(),
  name: z.string(),
  names: z.array(LocalizedName).optional(),
  form_names: z.array(LocalizedName).optional(),
});

export type LocalizedNamedApiResource = z.infer<typeof LocalizedNamedApiResource>;

export const PokemonFormDetail = z.object({
  id: z.number(),
  name: z.string(),
  form_name: z.string(),
  names: z.array(LocalizedName).optional(),
  form_names: z.array(LocalizedName).optional(),
});

export type PokemonFormDetail = z.infer<typeof PokemonFormDetail>;

// ──────────────── Evolution chain (재귀) ────────────────

export type EvolutionChainLink = {
  species: { name: string; url: string };
  evolution_details: Array<{
    min_level?: number | null;
    trigger: { name: string; url: string };
    item?: { name: string; url: string } | null;
    held_item?: { name: string; url: string } | null;
    known_move?: { name: string; url: string } | null;
    known_move_type?: { name: string; url: string } | null;
    location?: { name: string; url: string } | null;
    min_happiness?: number | null;
    min_beauty?: number | null;
    min_affection?: number | null;
    needs_overworld_rain?: boolean;
    party_species?: { name: string; url: string } | null;
    party_type?: { name: string; url: string } | null;
    relative_physical_stats?: number | null;
    time_of_day?: string;
    trade_species?: { name: string; url: string } | null;
    turn_upside_down?: boolean;
    gender?: number | null;
  }>;
  evolves_to: EvolutionChainLink[];
};

const EvolutionChainLinkSchema: z.ZodType<EvolutionChainLink> = z.lazy(() =>
  z.object({
    species: z.object({ name: z.string(), url: z.string() }),
    evolution_details: z.array(
      z.object({
        min_level: z.number().nullish(),
        trigger: z.object({ name: z.string(), url: z.string() }),
        item: z.object({ name: z.string(), url: z.string() }).nullish(),
        held_item: z.object({ name: z.string(), url: z.string() }).nullish(),
        known_move: z.object({ name: z.string(), url: z.string() }).nullish(),
        known_move_type: z.object({ name: z.string(), url: z.string() }).nullish(),
        location: z.object({ name: z.string(), url: z.string() }).nullish(),
        min_happiness: z.number().nullish(),
        min_beauty: z.number().nullish(),
        min_affection: z.number().nullish(),
        needs_overworld_rain: z.boolean().optional(),
        party_species: z.object({ name: z.string(), url: z.string() }).nullish(),
        party_type: z.object({ name: z.string(), url: z.string() }).nullish(),
        relative_physical_stats: z.number().nullish(),
        time_of_day: z.string().optional(),
        trade_species: z.object({ name: z.string(), url: z.string() }).nullish(),
        turn_upside_down: z.boolean().optional(),
        gender: z.number().nullish(),
      }),
    ),
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
  names: z.array(LocalizedName),
  effect_entries: z.array(
    z.object({
      effect: z.string(),
      short_effect: z.string(),
      language: z.object({ name: z.string() }),
    }),
  ).optional(),
  flavor_text_entries: z.array(
    z.object({
      flavor_text: z.string(),
      language: z.object({ name: z.string() }),
      version_group: z.object({ name: z.string() }).optional(),
    }),
  ).optional(),
  pokemon: z.array(
    z.object({
      is_hidden: z.boolean(),
      pokemon: z.object({
        name: z.string(),
        url: z.string(),
      }),
      slot: z.number(),
    }),
  ).optional(),
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
