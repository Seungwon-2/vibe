import { z } from 'zod';

export const MoveListItem = z.object({
  name: z.string(),
  url: z.string(),
});

export const MoveListResponse = z.object({
  count: z.number(),
  results: z.array(MoveListItem),
});

export type MoveListItem = z.infer<typeof MoveListItem>;
export type MoveListResponse = z.infer<typeof MoveListResponse>;

export function extractMoveIdFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? parseInt(match[1], 10) : 0;
}

const LocalizedName = z.object({
  name: z.string(),
  language: z.object({ name: z.string() }),
});

const NamedApiResource = z.object({
  name: z.string(),
  url: z.string(),
});

export const MoveDetail = z.object({
  id: z.number(),
  name: z.string(),
  accuracy: z.number().nullish(),
  power: z.number().nullish(),
  pp: z.number().nullish(),
  priority: z.number(),
  effect_chance: z.number().nullish(),
  type: NamedApiResource,
  damage_class: NamedApiResource,
  generation: NamedApiResource,
  target: NamedApiResource,
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
  learned_by_pokemon: z.array(NamedApiResource).optional(),
  meta: z.object({
    ailment: NamedApiResource.nullish(),
    ailment_chance: z.number().nullish(),
    category: NamedApiResource.nullish(),
    crit_rate: z.number().nullish(),
    drain: z.number().nullish(),
    flinch_chance: z.number().nullish(),
    healing: z.number().nullish(),
    max_hits: z.number().nullish(),
    max_turns: z.number().nullish(),
    min_hits: z.number().nullish(),
    min_turns: z.number().nullish(),
    stat_chance: z.number().nullish(),
  }).nullish(),
});

export type MoveDetail = z.infer<typeof MoveDetail>;

const MoveSetItem = z.object({
  name: z.string(),
  url: z.string(),
});

export const MoveGenerationResponse = z.object({
  id: z.number(),
  name: z.string(),
  moves: z.array(MoveSetItem),
});

export const MoveDamageClassResponse = z.object({
  id: z.number(),
  name: z.string(),
  moves: z.array(MoveSetItem),
});

export const TypeMoveResponse = z.object({
  id: z.number(),
  name: z.string(),
  moves: z.array(MoveSetItem),
});

export type MoveGenerationResponse = z.infer<typeof MoveGenerationResponse>;
export type MoveDamageClassResponse = z.infer<typeof MoveDamageClassResponse>;
export type TypeMoveResponse = z.infer<typeof TypeMoveResponse>;