'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import {
  Download,
  Palette,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

import pokemonNames from '@/const/pokemonNames.json';
import { buildPokemonDetailQuery } from '@/queries/pokemon';
import {
  OFFICIAL_ARTWORK_URL,
  POKEMON_TYPES,
  POKEMON_TYPE_COLORS,
  POKEMON_TYPE_LABELS,
  type PokemonType,
} from '@/const/pokemon';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type AvatarId = 'male' | 'female' | 'bitna' | 'gwanghwi';
type ThemeId = 'sunset' | 'ocean' | 'forest' | 'royal';
type BackgroundId = 'grass' | 'forest' | 'water' | 'sky' | 'cave' | 'desert' | 'ruins' | 'volcano';
type CardStyleId = 'cinematic' | 'classic';
type RegionName = (typeof REGION_OPTIONS)[number];

interface TrainerProfile {
  trainerName: string;
  title: string;
  region: RegionName;
  favoriteType: PokemonType;
  avatarId: AvatarId;
  themeId: ThemeId;
  backgroundId: BackgroundId;
  cardStyle: CardStyleId;
  partnerIds: Array<number | null>;
}

interface CardTheme {
  id: ThemeId;
  label: string;
  gradientClassName: string;
  accentClassName: string;
  previewClassName: string;
  overlayStyle: string;
  shellColor: string;
  headerColor: string;
  infoBarColor: string;
}

interface BackgroundOption {
  id: BackgroundId;
  label: string;
  imageUrl: string;
}

interface AvatarOption {
  id: AvatarId;
  label: string;
  description: string;
  imageUrl?: string;
}

interface PokemonOption {
  id: number;
  name: string;
}

interface CardStyleOption {
  id: CardStyleId;
  label: string;
  description: string;
}

const STORAGE_KEY = 'pokemon-world.trainer-card';
const MAX_PARTY_SIZE = 6;

const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'male', label: '남성 트레이너', description: '캡과 재킷이 강조된 주인공풍 남성 트레이너' },
  { id: 'female', label: '여성 트레이너', description: '리본 캡과 부츠 스타일의 주인공풍 여성 트레이너' },
  {
    id: 'bitna',
    label: '빛나',
    description: '신오지방 여성 주인공 빛나 이미지를 카드에 표시합니다.',
    imageUrl: '/trainers/bitna.png',
  },
  {
    id: 'gwanghwi',
    label: '광휘',
    description: '신오지방 남성 주인공 광휘 이미지를 카드에 표시합니다.',
    imageUrl: '/trainers/gwanghwi.png',
  },
];

const CARD_STYLE_OPTIONS: CardStyleOption[] = [
  {
    id: 'cinematic',
    label: '감성형 카드',
    description: '배경과 그라디언트 연출이 강조된 현재 스타일입니다.',
  },
  {
    id: 'classic',
    label: '원작형 카드',
    description: '포켓몬 트레이너 카드 원작 UI에 가깝게 정돈한 클래식 스타일입니다.',
  },
];

const REGION_OPTIONS = [
  '관동',
  '성도',
  '호연',
  '신오',
  '하나',
  '칼로스',
  '알로라',
  '가라르',
  '팔데아',
] as const;

const POKEMON_TYPE_ACCENT_RGB: Record<PokemonType, string> = {
  normal: '148, 163, 184',
  fire: '249, 115, 22',
  water: '59, 130, 246',
  electric: '250, 204, 21',
  grass: '34, 197, 94',
  ice: '34, 211, 238',
  fighting: '220, 38, 38',
  poison: '168, 85, 247',
  ground: '202, 138, 4',
  flying: '129, 140, 248',
  psychic: '236, 72, 153',
  bug: '132, 204, 22',
  rock: '161, 98, 7',
  ghost: '67, 56, 202',
  dragon: '79, 70, 229',
  dark: '51, 65, 85',
  steel: '148, 163, 184',
  fairy: '244, 114, 182',
};

const CARD_THEMES: CardTheme[] = [
  {
    id: 'sunset',
    label: '선셋 오렌지',
    gradientClassName: 'from-orange-500/85 via-rose-500/80 to-purple-700/90',
    accentClassName: 'bg-orange-400',
    previewClassName: 'from-orange-400 to-rose-500',
    overlayStyle:
      'linear-gradient(135deg, rgba(249,115,22,0.42) 0%, rgba(244,63,94,0.34) 48%, rgba(88,28,135,0.52) 100%)',
    shellColor: 'rgba(69, 45, 34, 0.28)',
    headerColor: 'rgba(120, 63, 42, 0.72)',
    infoBarColor: 'rgba(149, 78, 56, 0.6)',
  },
  {
    id: 'ocean',
    label: '오션 블루',
    gradientClassName: 'from-sky-500/80 via-cyan-500/75 to-blue-900/90',
    accentClassName: 'bg-cyan-300',
    previewClassName: 'from-cyan-400 to-blue-500',
    overlayStyle:
      'linear-gradient(135deg, rgba(14,165,233,0.34) 0%, rgba(6,182,212,0.28) 45%, rgba(30,58,138,0.5) 100%)',
    shellColor: 'rgba(22, 49, 74, 0.28)',
    headerColor: 'rgba(25, 78, 119, 0.7)',
    infoBarColor: 'rgba(29, 103, 138, 0.58)',
  },
  {
    id: 'forest',
    label: '포레스트 그린',
    gradientClassName: 'from-emerald-500/80 via-lime-500/70 to-green-950/90',
    accentClassName: 'bg-lime-300',
    previewClassName: 'from-lime-400 to-emerald-500',
    overlayStyle:
      'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(132,204,22,0.24) 50%, rgba(20,83,45,0.46) 100%)',
    shellColor: 'rgba(32, 66, 44, 0.28)',
    headerColor: 'rgba(47, 94, 55, 0.72)',
    infoBarColor: 'rgba(63, 116, 72, 0.58)',
  },
  {
    id: 'royal',
    label: '로열 퍼플',
    gradientClassName: 'from-fuchsia-500/80 via-violet-500/75 to-slate-950/90',
    accentClassName: 'bg-fuchsia-300',
    previewClassName: 'from-fuchsia-400 to-violet-500',
    overlayStyle:
      'linear-gradient(135deg, rgba(217,70,239,0.34) 0%, rgba(139,92,246,0.3) 46%, rgba(15,23,42,0.52) 100%)',
    shellColor: 'rgba(50, 33, 74, 0.28)',
    headerColor: 'rgba(84, 52, 126, 0.72)',
    infoBarColor: 'rgba(98, 65, 146, 0.58)',
  },
];

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: 'grass', label: '초원', imageUrl: '/backgrounds/bg_grass.png' },
  { id: 'forest', label: '숲', imageUrl: '/backgrounds/bg_forest.png' },
  { id: 'water', label: '호수', imageUrl: '/backgrounds/bg_water.png' },
  { id: 'sky', label: '하늘', imageUrl: '/backgrounds/bg_sky.png' },
  { id: 'cave', label: '동굴', imageUrl: '/backgrounds/bg_cave.png' },
  { id: 'desert', label: '사막', imageUrl: '/backgrounds/bg_desert.png' },
  { id: 'ruins', label: '유적', imageUrl: '/backgrounds/bg_ruins.png' },
  { id: 'volcano', label: '화산', imageUrl: '/backgrounds/bg_volcano.png' },
];

const POKEMON_NAME_MAP = pokemonNames as Record<string, string>;
const POKEMON_OPTIONS: PokemonOption[] = Object.entries(POKEMON_NAME_MAP)
  .map(([id, name]) => ({ id: Number(id), name }))
  .sort((a, b) => a.id - b.id);

const defaultProfile: TrainerProfile = {
  trainerName: '포켓몬 마스터',
  title: '도감 완성을 꿈꾸는 트레이너',
  region: '관동',
  favoriteType: 'electric',
  avatarId: 'male',
  themeId: 'sunset',
  backgroundId: 'grass',
  cardStyle: 'cinematic',
  partnerIds: [25, 6, 149, 448, 282, 94],
};

const SELECT_CLASS_NAME =
  'h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30';

function isPokemonType(value: unknown): value is PokemonType {
  return typeof value === 'string' && POKEMON_TYPES.includes(value as PokemonType);
}

function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === 'string' && AVATAR_OPTIONS.some((avatar) => avatar.id === value);
}

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && CARD_THEMES.some((theme) => theme.id === value);
}

function isBackgroundId(value: unknown): value is BackgroundId {
  return typeof value === 'string' && BACKGROUND_OPTIONS.some((background) => background.id === value);
}

function isCardStyleId(value: unknown): value is CardStyleId {
  return typeof value === 'string' && CARD_STYLE_OPTIONS.some((style) => style.id === value);
}

function isRegionName(value: unknown): value is RegionName {
  return typeof value === 'string' && REGION_OPTIONS.includes(value as RegionName);
}

function sanitizeText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : fallback;
}

function normalizePokemonId(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return null;
  }

  if (value < 1 || value > POKEMON_OPTIONS.length) {
    return null;
  }

  return value;
}

function normalizePartnerIds(value: unknown): Array<number | null> {
  const rawIds = Array.isArray(value) ? value.slice(0, MAX_PARTY_SIZE) : [];
  const seen = new Set<number>();

  return Array.from({ length: MAX_PARTY_SIZE }, (_, index) => {
    const normalizedId = normalizePokemonId(rawIds[index]);

    if (normalizedId === null || seen.has(normalizedId)) {
      return null;
    }

    seen.add(normalizedId);
    return normalizedId;
  });
}

function normalizeProfile(value: unknown): TrainerProfile {
  if (!value || typeof value !== 'object') {
    return defaultProfile;
  }

  const candidate = value as Partial<Record<keyof TrainerProfile, unknown>>;

  return {
    trainerName: sanitizeText(candidate.trainerName, defaultProfile.trainerName, 12),
    title: sanitizeText(candidate.title, defaultProfile.title, 40),
    region: isRegionName(candidate.region) ? candidate.region : defaultProfile.region,
    favoriteType: isPokemonType(candidate.favoriteType)
      ? candidate.favoriteType
      : defaultProfile.favoriteType,
    avatarId: isAvatarId(candidate.avatarId) ? candidate.avatarId : defaultProfile.avatarId,
    themeId: isThemeId(candidate.themeId) ? candidate.themeId : defaultProfile.themeId,
    backgroundId: isBackgroundId(candidate.backgroundId)
      ? candidate.backgroundId
      : defaultProfile.backgroundId,
    cardStyle: isCardStyleId(candidate.cardStyle) ? candidate.cardStyle : defaultProfile.cardStyle,
    partnerIds: normalizePartnerIds(candidate.partnerIds),
  };
}

function getPokemonName(id: number) {
  return POKEMON_NAME_MAP[String(id)] ?? `포켓몬 ${id}`;
}

function getTypeBadgeClassName(type: PokemonType) {
  return POKEMON_TYPE_COLORS[type]?.split(' ')[0] ?? 'bg-zinc-500';
}

function getPokemonSlotAccentStyle(type?: PokemonType) {
  if (!type) {
    return undefined;
  }

  const rgb = POKEMON_TYPE_ACCENT_RGB[type];

  return {
    borderColor: `rgba(${rgb}, 0.9)`,
    backgroundColor: `rgba(${rgb}, 0.7)`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32)',
  };
}

function buildTrainerCardCode(profile: TrainerProfile) {
  const seedNumbers = [
    profile.region.length * 317,
    ...profile.partnerIds.map((id, index) => (id ?? (index + 1) * 29) * (index + 3)),
  ];

  return Array.from({ length: 3 }, (_, chunkIndex) => {
    const start = chunkIndex * 2;
    const chunkTotal = seedNumbers
      .slice(start, start + 3)
      .reduce((total, value) => total + value, 0);

    return String((chunkTotal % 9000) + 1000).padStart(4, '0');
  }).join('-');
}

function TrainerAvatar({
  avatarId,
  accentClassName,
  className,
}: {
  avatarId: AvatarId;
  accentClassName: string;
  className?: string;
}) {
  const avatar = AVATAR_OPTIONS.find((option) => option.id === avatarId);

  if (avatar?.imageUrl) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-[28px] border border-white/20 bg-white/10 p-2 backdrop-blur-sm',
          className,
        )}
      >
        <div
          className={cn(
            'absolute inset-x-4 top-3 h-10 rounded-full opacity-70 blur-2xl',
            accentClassName,
          )}
        />
        <div className="absolute inset-x-5 bottom-3 h-5 rounded-full bg-black/25 blur-md" />
        <Image
          src={avatar.imageUrl}
          alt={avatar.label}
          fill
          sizes="(max-width: 768px) 160px, 220px"
          unoptimized
          className="object-contain p-2 drop-shadow-[0_10px_18px_rgba(15,23,42,0.45)]"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-white/20 bg-white/10 p-2 backdrop-blur-sm',
        className,
      )}
    >
      <svg viewBox="0 0 160 320" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`trainer-${avatarId}-shine`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`trainer-${avatarId}-skin`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe8c7" />
            <stop offset="100%" stopColor="#f0c79e" />
          </linearGradient>
          <linearGradient id={`trainer-${avatarId}-legwear`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id={`trainer-${avatarId}-shoe`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>

        <ellipse cx="80" cy="302" rx="44" ry="10" fill="rgba(15,23,42,0.28)" />

        {avatarId === 'male' ? (
          <>
            <path d="M46 47c3-12 13-23 27-28 14-6 30-5 42 1 11 5 19 14 23 27l-12 6c-3-9-9-16-18-20-10-5-24-5-35-1-10 4-18 12-23 24L46 47Z" fill="#0f172a" />
            <path d="M49 49c8-8 18-13 30-15 14-1 30 1 42 11l-2 12H54l-5-8Z" fill="#ef4444" />
            <path d="M52 53c8-7 18-12 29-13 14-1 26 2 36 9v8H56l-4-4Z" fill="#f8fafc" />
            <path d="M52 58h67l-3 19H54l-2-19Z" fill="#111827" />
            <circle cx="80" cy="81" r="24" fill={`url(#trainer-${avatarId}-skin)`} />
            <path d="M58 74c4-17 18-28 35-28 10 0 20 4 28 12-7-2-14-3-21-3-22 0-35 8-42 19Z" fill="#1f2937" />
            <circle cx="71" cy="82" r="2.8" fill="#2d1b0f" />
            <circle cx="89" cy="82" r="2.8" fill="#2d1b0f" />
            <path d="M72 95c5 4 11 4 16 0" stroke="#8b5e3c" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M67 103c4 2 8 3 13 3s10-1 14-3l-1 8H68l-1-8Z" fill="#f8fafc" opacity="0.92" />
            <path d="M57 118c11-11 35-13 47 0l10 86H46l11-86Z" className={cn('text-white', accentClassName)} fill="currentColor" />
            <path d="M70 118h20l9 14H61l9-14Z" fill="#f8fafc" />
            <path d="M78 118h4v26h-4z" fill="#1e293b" />
            <path d="M61 133h38" stroke="rgba(255,255,255,0.45)" strokeWidth="4" strokeLinecap="round" />
            <path d="M46 128c2-9 8-16 16-20l6 11c-7 4-11 11-13 18l-7-9Z" fill="#0f172a" />
            <path d="M114 128c-2-9-8-16-16-20l-6 11c7 4 11 11 13 18l9-9Z" fill="#0f172a" />
            <path d="M50 134 30 185l18 9 24-45-22-15Z" fill="#1f2937" />
            <path d="M110 134 130 185l-18 9-24-45 22-15Z" fill="#1f2937" />
            <path d="M61 205h38l9 58H52l9-58Z" fill={`url(#trainer-${avatarId}-legwear)`} />
            <path d="M68 205v58" stroke="rgba(255,255,255,0.16)" strokeWidth="3" />
            <path d="M92 205v58" stroke="rgba(255,255,255,0.16)" strokeWidth="3" />
            <path d="M70 149c7 6 13 9 20 11" stroke="#facc15" strokeWidth="8" strokeLinecap="round" opacity="0.95" />
            <circle cx="102" cy="154" r="7" fill="#f8fafc" />
            <circle cx="102" cy="154" r="3" fill="#ef4444" />
            <path d="M60 262 48 300h20l13-34" fill="#111827" />
            <path d="M100 262 112 300H92l-13-34" fill="#111827" />
            <path d="M48 297h28v10H44c0-5 2-8 4-10Z" fill={`url(#trainer-${avatarId}-shoe)`} />
            <path d="M84 297h28c2 2 4 5 4 10H84v-10Z" fill={`url(#trainer-${avatarId}-shoe)`} />
          </>
        ) : (
          <>
            <path d="M41 58c2-16 13-31 31-37 18-7 39-4 55 9 9 7 15 16 18 29l-12 4c-2-11-8-19-16-25-12-9-28-12-42-7-13 4-22 14-28 31l-6-4Z" fill="#581c87" />
            <path d="M63 42c7-6 18-10 29-10 12 0 22 4 30 12-5 6-12 10-21 12-14 4-28 0-38-14Z" fill="#f472b6" />
            <path d="M78 30c8 0 16 2 22 7l-11 12-17-11c2-5 4-8 6-8Z" fill="#f8fafc" />
            <circle cx="80" cy="83" r="24" fill={`url(#trainer-${avatarId}-skin)`} />
            <path d="M56 74c8-14 20-21 35-21 14 0 25 5 34 15-8-2-15-3-22-3-19 0-34 4-47 9Z" fill="#6b21a8" />
            <path d="M54 78c3 18 14 30 26 30 18 0 31-8 44-28l2 12c-8 16-26 28-47 28-14 0-25-9-29-23l4-19Z" fill="#7c2d92" opacity="0.8" />
            <circle cx="71" cy="84" r="2.8" fill="#2d1b0f" />
            <circle cx="89" cy="84" r="2.8" fill="#2d1b0f" />
            <path d="M72 97c5 4 11 4 16 0" stroke="#8b5e3c" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M54 120c10-12 42-12 52 0l8 72H46l8-72Z" className={cn('text-white', accentClassName)} fill="currentColor" />
            <path d="M63 120h34l10 10H53l10-10Z" fill="#f8fafc" opacity="0.95" />
            <path d="M80 120c10 0 18 9 18 19v53H62v-53c0-10 8-19 18-19Z" fill="rgba(255,255,255,0.18)" />
            <path d="M59 136c8 6 30 6 43 0" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
            <path d="M48 125 29 181l16 10 22-45-19-21Z" fill="#7c2d92" />
            <path d="M112 125 131 181l-16 10-22-45 19-21Z" fill="#7c2d92" />
            <path d="M61 192h38l18 76H43l18-76Z" fill={`url(#trainer-${avatarId}-legwear)`} />
            <path d="M61 192c6 7 13 11 19 11s13-4 19-11" fill="#f8fafc" opacity="0.22" />
            <path d="M80 192v76" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
            <path d="M100 162c8 4 16 10 23 17" stroke="#f9a8d4" strokeWidth="7" strokeLinecap="round" opacity="0.95" />
            <circle cx="51" cy="164" r="8" fill="#f8fafc" />
            <circle cx="51" cy="164" r="4" fill="#ec4899" />
            <path d="M58 268 45 300h23l18-34" fill="#0f172a" />
            <path d="M102 268 115 300H92l-18-34" fill="#0f172a" />
            <path d="M46 297h30v10H41c0-4 2-8 5-10Z" fill={`url(#trainer-${avatarId}-shoe)`} />
            <path d="M84 297h30c3 2 5 6 5 10H84v-10Z" fill={`url(#trainer-${avatarId}-shoe)`} />
          </>
        )}

        <path
          d="M35 30c18-23 72-30 94 0"
          fill="none"
          stroke={`url(#trainer-${avatarId}-shine)`}
          strokeWidth="10"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}

export function MyPageContainer() {
  const [profile, setProfile] = useState<TrainerProfile>(defaultProfile);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [partySearchTerms, setPartySearchTerms] = useState<string[]>(() =>
    Array.from({ length: MAX_PARTY_SIZE }, () => ''),
  );
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem(STORAGE_KEY);

      if (savedProfile) {
        setProfile(normalizeProfile(JSON.parse(savedProfile)));
      }
    } catch {
      toast.error('저장된 트레이너 카드를 불러오지 못했어요. 기본 설정으로 시작합니다.');
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [isHydrated, profile]);

  const selectedTheme =
    CARD_THEMES.find((theme) => theme.id === profile.themeId) ?? CARD_THEMES[0];
  const selectedBackground =
    BACKGROUND_OPTIONS.find((background) => background.id === profile.backgroundId) ??
    BACKGROUND_OPTIONS[0];
  const selectedAvatar =
    AVATAR_OPTIONS.find((avatar) => avatar.id === profile.avatarId) ?? AVATAR_OPTIONS[0];

  const selectedPokemonDetails = useQueries({
    queries: profile.partnerIds.map((id) => ({
      ...buildPokemonDetailQuery(id ?? 0),
      enabled: id !== null,
    })),
  });

  const selectedPokemon = useMemo(
    () =>
      profile.partnerIds.map((id, index) => {
        if (!id) {
          return null;
        }

        const primaryType = selectedPokemonDetails[index]?.data?.types[0]?.type.name as PokemonType | undefined;

        return {
          id,
          name: getPokemonName(id),
          imageUrl: OFFICIAL_ARTWORK_URL(id),
          primaryType,
        };
      }),
    [profile.partnerIds, selectedPokemonDetails],
  );

  const trainerCardCode = useMemo(() => buildTrainerCardCode(profile), [profile]);

  const selectedCount = profile.partnerIds.filter((id) => id !== null).length;

  function updateProfile<K extends keyof TrainerProfile>(key: K, value: TrainerProfile[K]) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [key]: value,
    }));
  }

  function updatePartySlot(index: number, nextValue: string) {
    const nextPokemonId = nextValue ? Number(nextValue) : null;

    setPartySearchTerms((currentTerms) =>
      currentTerms.map((term, slotIndex) => (slotIndex === index ? '' : term)),
    );

    setProfile((currentProfile) => ({
      ...currentProfile,
      partnerIds: currentProfile.partnerIds.map((pokemonId, slotIndex) => {
        if (slotIndex !== index) {
          return pokemonId;
        }

        return Number.isInteger(nextPokemonId) ? nextPokemonId : null;
      }),
    }));
  }

  function handleSave() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    toast.success('트레이너 카드 설정을 저장했어요.');
  }

  function handleReset() {
    setProfile(defaultProfile);
    setPartySearchTerms(Array.from({ length: MAX_PARTY_SIZE }, () => ''));
    window.localStorage.removeItem(STORAGE_KEY);
    toast.success('트레이너 카드가 기본 설정으로 초기화되었어요.');
  }

  async function handleDownload() {
    if (!cardRef.current) {
      return;
    }

    try {
      setIsDownloading(true);

      const sourceNode = cardRef.current;
      const { width, height } = sourceNode.getBoundingClientRect();
      const sourceWidth = Math.round(width);
      const sourceHeight = Math.round(height);
      const exportWidth = 1500;
      const exportHeight = 1100;
      const exportScale = 2;
      const exportWrapper = document.createElement('div');
      const clonedNode = sourceNode.cloneNode(true) as HTMLDivElement;

      exportWrapper.setAttribute('aria-hidden', 'true');
      exportWrapper.style.position = 'fixed';
      exportWrapper.style.left = '0';
      exportWrapper.style.top = '0';
      exportWrapper.style.width = `${sourceWidth}px`;
      exportWrapper.style.height = `${sourceHeight}px`;
      exportWrapper.style.padding = '0';
      exportWrapper.style.margin = '0';
      exportWrapper.style.overflow = 'visible';
      exportWrapper.style.pointerEvents = 'none';
      exportWrapper.style.zIndex = '-1';
      exportWrapper.style.background = 'transparent';
      exportWrapper.style.opacity = '0';

      clonedNode.style.width = `${sourceWidth}px`;
      clonedNode.style.height = `${sourceHeight}px`;
      clonedNode.style.maxWidth = 'none';
      clonedNode.style.aspectRatio = 'auto';
      clonedNode.style.margin = '0';
      clonedNode.style.position = 'relative';
      clonedNode.style.left = '0';
      clonedNode.style.top = '0';
      clonedNode.style.transform = 'none';
      clonedNode.style.boxShadow = 'none';

      exportWrapper.appendChild(clonedNode);
      document.body.appendChild(exportWrapper);

      try {
        await document.fonts.ready;

        const dataUrl = await toPng(clonedNode, {
          cacheBust: true,
          pixelRatio: 1,
          backgroundColor: '#0f172a',
          width: sourceWidth,
          height: sourceHeight,
          canvasWidth: exportWidth * exportScale,
          canvasHeight: exportHeight * exportScale,
          style: {
            width: `${sourceWidth}px`,
            height: `${sourceHeight}px`,
          },
        });

        const link = document.createElement('a');
        link.download = `${profile.trainerName.replace(/\s+/g, '-') || 'trainer-card'}.png`;
        link.href = dataUrl;
        link.click();
      } finally {
        exportWrapper.remove();
      }

      toast.success('트레이너 카드를 PNG로 저장했어요.');
    } catch {
      toast.error('PNG 다운로드 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <PageContainer className="bg-gradient-to-b from-background via-background to-muted/40">
      <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-6">
        <PageHeader
          title="마이페이지"
          description="트레이너 이름, 파티, 카드 색상을 직접 꾸미고 나만의 트레이너 카드를 PNG로 저장해 보세요."
        />

        <div className="flex min-h-0 flex-1 flex-col-reverse gap-6">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  트레이너 기본 정보
                </CardTitle>
                <CardDescription>
                  카드에 표시될 이름, 칭호, 지역, 대표 타입을 설정합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">트레이너 이름</span>
                  <Input
                    value={profile.trainerName}
                    maxLength={12}
                    placeholder="예: 레드"
                    onChange={(event) => updateProfile('trainerName', event.target.value.slice(0, 12))}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium">활동 지역</span>
                  <select
                    className={SELECT_CLASS_NAME}
                    value={profile.region}
                    onChange={(event) => updateProfile('region', event.target.value as RegionName)}
                  >
                    {REGION_OPTIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-medium">한 줄 소개</span>
                  <Input
                    value={profile.title}
                    maxLength={40}
                    placeholder="예: 번개처럼 빠른 스피드 배틀 전문가"
                    onChange={(event) => updateProfile('title', event.target.value.slice(0, 40))}
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-medium">대표 타입</span>
                  <select
                    className={SELECT_CLASS_NAME}
                    value={profile.favoriteType}
                    onChange={(event) => updateProfile('favoriteType', event.target.value as PokemonType)}
                  >
                    {POKEMON_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {POKEMON_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>
              </CardContent>
              <CardFooter className="justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Save className="h-3.5 w-3.5" />
                  {isHydrated ? '변경 사항은 브라우저에 자동 저장됩니다.' : '저장된 설정을 불러오는 중입니다.'}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" />
                    초기화
                  </Button>
                  <Button type="button" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                    저장
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  파티 구성
                </CardTitle>
                <CardDescription>
                  최대 6마리까지 선택할 수 있으며, 같은 포켓몬은 중복 선택되지 않습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: MAX_PARTY_SIZE }, (_, index) => {
                    const currentValue = profile.partnerIds[index];
                    const keyword = partySearchTerms[index]?.trim().toLowerCase() ?? '';
                    const filteredPokemonOptions = POKEMON_OPTIONS.filter((pokemon) => {
                      const isCurrentValue = currentValue === pokemon.id;

                      if (isCurrentValue) {
                        return true;
                      }

                      const isSelectedInAnotherSlot = profile.partnerIds.some(
                        (pokemonId, slotIndex) =>
                          slotIndex !== index && pokemonId !== null && pokemonId === pokemon.id,
                      );

                      if (isSelectedInAnotherSlot) {
                        return false;
                      }

                      if (!keyword) {
                        return true;
                      }

                      return (
                        pokemon.name.toLowerCase().includes(keyword) ||
                        String(pokemon.id).includes(keyword)
                      );
                    });

                    return (
                      <label key={`party-slot-${index}`} className="space-y-1.5">
                        <span className="text-sm font-medium">파트너 슬롯 {index + 1}</span>
                        <div className="space-y-2">
                          <Input
                            value={partySearchTerms[index]}
                            placeholder="번호 또는 이름으로 검색"
                            onChange={(event) =>
                              setPartySearchTerms((currentTerms) =>
                                currentTerms.map((term, slotIndex) =>
                                  slotIndex === index ? event.target.value : term,
                                ),
                              )
                            }
                          />
                          <select
                            className={SELECT_CLASS_NAME}
                            value={currentValue ?? ''}
                            onChange={(event) => updatePartySlot(index, event.target.value)}
                          >
                            <option value="">비워두기</option>
                            {filteredPokemonOptions.map((pokemon) => (
                              <option key={pokemon.id} value={pokemon.id}>
                                #{String(pokemon.id).padStart(4, '0')} {pokemon.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-muted-foreground">
                            검색 결과 {filteredPokemonOptions.length}마리
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-3">
                  <Badge variant="outline">선택된 포켓몬 {selectedCount} / 6</Badge>
                  {selectedPokemon.map((pokemon, index) =>
                    pokemon ? (
                      <Badge key={pokemon.id} className="gap-1">
                        <span className="font-mono text-[10px]">{String(pokemon.id).padStart(3, '0')}</span>
                        {pokemon.name}
                      </Badge>
                    ) : (
                      <Badge key={`empty-slot-badge-${index}`} variant="outline">
                        빈 슬롯 {index + 1}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  카드 디자인
                </CardTitle>
                <CardDescription>
                  아바타, 배경, 카드 색상을 골라서 원하는 분위기로 완성하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">트레이너 아바타</p>
                    <p className="text-xs text-muted-foreground">
                      카드 중앙에 노출될 트레이너 스타일을 선택합니다.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {AVATAR_OPTIONS.map((avatar) => {
                      const isActive = avatar.id === profile.avatarId;

                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          className={cn(
                            'flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:border-primary/60 hover:bg-muted/60',
                            isActive && 'border-primary bg-primary/5 ring-2 ring-primary/20',
                          )}
                          onClick={() => updateProfile('avatarId', avatar.id)}
                        >
                          <TrainerAvatar
                            avatarId={avatar.id}
                            accentClassName={selectedTheme.accentClassName}
                            className="h-24 w-[4.5rem] shrink-0 rounded-2xl"
                          />
                          <div className="space-y-1">
                            <p className="font-medium">{avatar.label}</p>
                            <p className="text-xs text-muted-foreground">{avatar.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">카드 컬러</p>
                    <p className="text-xs text-muted-foreground">
                      그라디언트 오버레이와 포인트 색상이 함께 적용됩니다.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {CARD_THEMES.map((theme) => {
                      const isActive = theme.id === profile.themeId;

                      return (
                        <button
                          key={theme.id}
                          type="button"
                          className={cn(
                            'flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:border-primary/60 hover:bg-muted/60',
                            isActive && 'border-primary bg-primary/5 ring-2 ring-primary/20',
                          )}
                          onClick={() => updateProfile('themeId', theme.id)}
                        >
                          <div
                            className={cn(
                              'h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br shadow-sm',
                              theme.previewClassName,
                            )}
                          />
                          <div className="space-y-1">
                            <p className="font-medium">{theme.label}</p>
                            <p className="text-xs text-muted-foreground">
                              트레이너 카드의 전체 무드를 바꿔 줍니다.
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">배경 선택</p>
                    <p className="text-xs text-muted-foreground">
                      필드 배경과 컬러를 조합해 카드 분위기를 완성하세요.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {BACKGROUND_OPTIONS.map((background) => {
                      const isActive = background.id === profile.backgroundId;

                      return (
                        <button
                          key={background.id}
                          type="button"
                          className={cn(
                            'overflow-hidden rounded-2xl border text-left transition hover:border-primary/60',
                            isActive && 'border-primary ring-2 ring-primary/20',
                          )}
                          onClick={() => updateProfile('backgroundId', background.id)}
                        >
                          <div
                            className="h-24 w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${background.imageUrl})` }}
                          />
                          <div className="px-3 py-2 text-sm font-medium">{background.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="overflow-visible border-primary/10 bg-card/90 shadow-[0_16px_50px_rgba(15,23,42,0.12)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  트레이너 카드 미리보기
                </CardTitle>
                <CardDescription>
                  현재 설정이 실시간으로 반영됩니다. 마음에 들면 PNG로 저장해 보세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6">
                <div
                  ref={cardRef}
                  className="relative mx-auto aspect-[15/11] w-full max-w-[720px] overflow-hidden rounded-[22px] border-[3px] border-[#d9ddd7] text-white shadow-[0_22px_55px_rgba(15,23,42,0.3)]"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${selectedBackground.imageUrl})` }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ backgroundImage: selectedTheme.overlayStyle }}
                  />
                  <div className="absolute inset-0 bg-slate-950/12" />
                  <div className="absolute right-7 top-9 h-32 w-32 rounded-full border-[8px] border-white/18 opacity-60" />
                  <div className="absolute right-12 top-14 h-20 w-20 rounded-full border-[3px] border-white/15 opacity-60" />

                  <div
                    className="relative flex h-full flex-col text-white [text-shadow:_0_1px_1px_rgba(0,0,0,0.6)]"
                    style={{ backgroundColor: selectedTheme.shellColor }}
                  >
                    <div
                      className="flex items-center justify-between border-b-2 border-white/45 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: selectedTheme.headerColor }}
                    >
                      <span>{profile.region}</span>
                      <span className="text-[12px] tracking-normal">TRAINER&apos;S CARD</span>
                    </div>

                    <div
                      className="border-b border-white/25 px-3 py-1.5"
                      style={{ backgroundColor: selectedTheme.infoBarColor }}
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-sm border border-white/35 bg-black/18 px-2.5 py-1.5 text-[10px] font-bold text-white/95">
                        <span className="max-w-full break-keep text-[16px] font-black leading-none tracking-tight text-white sm:text-[18px]">
                          {profile.trainerName}
                        </span>
                        <span className="text-white/50">|</span>
                        <span className="shrink-0">ID {trainerCardCode}</span>
                        <span className="text-white/50">|</span>
                        <span className="shrink-0">{profile.region}</span>
                        <span className="text-white/50">|</span>
                        <span
                          className={cn(
                            'inline-flex shrink-0 rounded-sm px-2 py-0.5 text-[9px] font-bold text-white',
                            getTypeBadgeClassName(profile.favoriteType),
                          )}
                        >
                          {POKEMON_TYPE_LABELS[profile.favoriteType]}
                        </span>
                      </div>
                    </div>

                    <div className="grid flex-1 grid-cols-[1.28fr_0.72fr] gap-2.5 px-3 py-2.5">
                      <div className="rounded-md border-2 border-[#dbe2da] bg-[#b8c7b8]/58 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
                        <div className="mb-2 flex items-center justify-between border-b border-[#dbe2da]/80 px-1 pb-1 text-[9px] font-bold uppercase text-slate-100/90">
                          <span>Selected Pokemon</span>
                          <span>{selectedCount}/6</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {selectedPokemon.map((pokemon, index) =>
                            pokemon ? (
                              <div
                                key={`card-slot-${pokemon.id}-${index}`}
                                className="relative overflow-hidden rounded-[4px] border-2 border-[#f2f5f0] bg-[#d7dfd6]/96 p-1.5 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]"
                                style={getPokemonSlotAccentStyle(pokemon.primaryType)}
                              >
                                <div className="mb-1 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
                                  <span>NO.{String(pokemon.id).padStart(3, '0')}</span>
                                  <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[7px] text-slate-600">
                                    SLOT {index + 1}
                                  </span>
                                </div>
                                <div className="relative aspect-square overflow-hidden rounded-[3px] border border-[#b6c3b7] bg-white/55">
                                  <Image
                                    src={pokemon.imageUrl}
                                    alt={pokemon.name}
                                    width={120}
                                    height={120}
                                    unoptimized
                                    className="h-full w-full object-contain p-1.5 drop-shadow-[0_2px_4px_rgba(15,23,42,0.35)]"
                                  />
                                </div>
                                <div className="mt-1 truncate border-t border-slate-300/90 pt-1 text-center text-[9px] font-black leading-none text-slate-700">
                                  {pokemon.name}
                                </div>
                              </div>
                            ) : (
                              <div
                                key={`empty-card-slot-${index}`}
                                className="flex aspect-square flex-col items-center justify-center rounded-[4px] border-2 border-dashed border-white/65 bg-white/18 text-center text-[9px] font-bold text-white/78"
                              >
                                <span>EMPTY</span>
                                <span>SLOT {index + 1}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col gap-2 pr-1 pt-1">
                        <div className="relative flex min-h-0 flex-1 items-end justify-center overflow-hidden rounded-[22px] border border-white/30 bg-black/12 px-2 pt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                          <div className="absolute inset-x-4 top-3 h-16 rounded-full bg-white/8 blur-2xl" />
                          <div className="absolute bottom-3 h-5 w-28 rounded-full bg-slate-950/35 blur-md" />
                          <div className="absolute inset-2 rounded-[18px] border border-white/12" />
                          <div className="absolute right-2 top-2 rounded-full border border-white/25 bg-black/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/80">
                            trainer
                          </div>
                          <div className="absolute left-2 top-2 rounded-full border border-white/25 bg-black/30 px-2 py-0.5 text-[9px] font-bold text-white/90">
                            {selectedAvatar.label}
                          </div>
                          <div className="relative h-full max-h-[270px] w-full max-w-[220px]">
                            <TrainerAvatar
                              avatarId={selectedAvatar.id}
                              accentClassName={selectedTheme.accentClassName}
                              className="h-full w-full border-white/0 bg-transparent p-0 backdrop-blur-0"
                            />
                          </div>
                        </div>

                        <div className="rounded-sm border border-white/30 bg-black/18 px-3 py-1.5 text-left">
                          <p className="text-[9px] uppercase text-white/70">Message</p>
                          <p className="break-keep text-[10px] font-bold leading-snug sm:text-[11px]">
                            {profile.trainerName}의 {profile.title}
                          </p>
                          <p className="break-keep text-[10px] font-bold leading-snug sm:text-[11px]">
                            {selectedCount > 0
                              ? `${getPokemonName(profile.partnerIds.find((id) => id !== null) ?? defaultProfile.partnerIds[0] ?? 25)}와 함께 모험 중!`
                              : '새로운 파트너를 기다리고 있습니다!'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-3 sm:flex-row">
                <Button type="button" className="sm:flex-1" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  현재 카드 저장
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="sm:flex-1"
                  disabled={isDownloading}
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'PNG 생성 중...' : 'PNG 다운로드'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}