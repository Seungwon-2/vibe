// ──────────────── 타입 ────────────────

export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

export const POKEMON_TYPE_LABELS: Record<string, string> = {
  normal: '노말',
  fire: '불꽃',
  water: '물',
  electric: '전기',
  grass: '풀',
  ice: '얼음',
  fighting: '격투',
  poison: '독',
  ground: '땅',
  flying: '비행',
  psychic: '에스퍼',
  bug: '벌레',
  rock: '바위',
  ghost: '고스트',
  dragon: '드래곤',
  dark: '악',
  steel: '강철',
  fairy: '페어리',
};

export const POKEMON_TYPE_COLORS: Record<string, string> = {
  normal: 'bg-gray-400 hover:bg-gray-500',
  fire: 'bg-orange-500 hover:bg-orange-600',
  water: 'bg-blue-500 hover:bg-blue-600',
  electric: 'bg-yellow-400 hover:bg-yellow-500',
  grass: 'bg-green-500 hover:bg-green-600',
  ice: 'bg-cyan-400 hover:bg-cyan-500',
  fighting: 'bg-red-600 hover:bg-red-700',
  poison: 'bg-purple-500 hover:bg-purple-600',
  ground: 'bg-yellow-600 hover:bg-yellow-700',
  flying: 'bg-indigo-400 hover:bg-indigo-500',
  psychic: 'bg-pink-500 hover:bg-pink-600',
  bug: 'bg-lime-500 hover:bg-lime-600',
  rock: 'bg-yellow-700 hover:bg-yellow-800',
  ghost: 'bg-indigo-700 hover:bg-indigo-800',
  dragon: 'bg-indigo-600 hover:bg-indigo-700',
  dark: 'bg-gray-700 hover:bg-gray-800',
  steel: 'bg-slate-400 hover:bg-slate-500',
  fairy: 'bg-pink-300 hover:bg-pink-400',
};

// ──────────────── 세대 ────────────────

export const GENERATIONS = [
  { label: '1세대', value: 1, min: 1, max: 151 },
  { label: '2세대', value: 2, min: 152, max: 251 },
  { label: '3세대', value: 3, min: 252, max: 386 },
  { label: '4세대', value: 4, min: 387, max: 493 },
  { label: '5세대', value: 5, min: 494, max: 649 },
  { label: '6세대', value: 6, min: 650, max: 721 },
  { label: '7세대', value: 7, min: 722, max: 809 },
  { label: '8세대', value: 8, min: 810, max: 905 },
  { label: '9세대', value: 9, min: 906, max: 1025 },
] as const;

export const TOTAL_POKEMON = 1025;

export const PAGE_SIZE = 20;

// ──────────────── 이미지 URL ────────────────

export const OFFICIAL_ARTWORK_URL = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

// ──────────────── 키 카테고리 (단위: m) ────────────────

export const HEIGHT_CATEGORIES = [
  { label: '~ 0.5m (아주 작은)', value: 'xs', min: 0,   max: 0.5 },
  { label: '0.5m ~ 1m (작은)',   value: 'sm', min: 0.5, max: 1   },
  { label: '1m ~ 2m (보통)',     value: 'md', min: 1,   max: 2   },
  { label: '2m ~ 4m (큰)',       value: 'lg', min: 2,   max: 4   },
  { label: '4m 이상 (거대)',     value: 'xl', min: 4,   max: Infinity },
] as const;

export type HeightCategory = (typeof HEIGHT_CATEGORIES)[number]['value'];

// ──────────────── 몸무게 카테고리 (단위: kg) ────────────────

export const WEIGHT_CATEGORIES = [
  { label: '~ 10kg (초경량)',      value: 'xs', min: 0,   max: 10  },
  { label: '10kg ~ 50kg (경량)',   value: 'sm', min: 10,  max: 50  },
  { label: '50kg ~ 100kg (중형)',  value: 'md', min: 50,  max: 100 },
  { label: '100kg ~ 300kg (중량)', value: 'lg', min: 100, max: 300 },
  { label: '300kg 이상 (초중량)',  value: 'xl', min: 300, max: Infinity },
] as const;

export type WeightCategory = (typeof WEIGHT_CATEGORIES)[number]['value'];

// ──────────────── 능력치 한글 라벨 ────────────────

export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: '공격',
  defense: '방어',
  'special-attack': '특공',
  'special-defense': '특방',
  speed: '스피드',
};
