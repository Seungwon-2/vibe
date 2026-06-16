'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useQueries, useQuery } from '@tanstack/react-query';

import {
  buildLocalizedResourceByUrlQuery,
  buildPokemonDetailQuery,
  buildPokemonSpeciesQuery,
} from '@/queries/pokemon';
import type { EvolutionChainLink } from '@/scheme/pokemon';
import { extractIdFromUrl } from '@/scheme/pokemon';
import { OFFICIAL_ARTWORK_URL, POKEMON_TYPE_LABELS, type PokemonType } from '@/const/pokemon';
import { cn } from '@/lib/utils';

// ──────────────── 진화 체인을 단계별 배열로 변환 ────────────────

type EvolutionDetail = EvolutionChainLink['evolution_details'][number];
type FlattenedEvolutionNode = {
  name: string;
  url: string;
  evolutionDetails: EvolutionDetail[];
};

function humanizeSlug(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTimeOfDay(value: string) {
  switch (value) {
    case 'day':
      return '낮';
    case 'night':
      return '밤';
    case 'dusk':
      return '해질녘';
    default:
      return humanizeSlug(value);
  }
}

function formatGenderCondition(gender?: number | null) {
  if (gender === 1) {
    return '암컷일 때';
  }

  if (gender === 2) {
    return '수컷일 때';
  }

  return null;
}

function formatRelativePhysicalStats(value?: number | null) {
  if (value === 1) {
    return '공격이 방어보다 높을 때';
  }

  if (value === 0) {
    return '공격과 방어가 같을 때';
  }

  if (value === -1) {
    return '방어가 공격보다 높을 때';
  }

  return null;
}

type EvolutionResource = { name: string; url: string } | null | undefined;

function resolveResourceName(
  resource: EvolutionResource,
  localizedResourceMap: Map<string, string>,
) {
  if (!resource) return '';
  return localizedResourceMap.get(resource.url) ?? humanizeSlug(resource.name);
}

function formatEvolutionDetail(
  detail: EvolutionDetail,
  localizedResourceMap: Map<string, string>,
) {
  const parts: string[] = [];

  if (detail.trigger.name === 'trade') {
    parts.push('교환');
  } else if (detail.trigger.name === 'use-item' && detail.item?.name) {
    parts.push(`${resolveResourceName(detail.item, localizedResourceMap)} 사용`);
  } else if (detail.trigger.name === 'level-up' && detail.min_level == null) {
    parts.push('레벨업');
  }

  if (detail.min_level != null) {
    parts.push(`Lv.${detail.min_level} 이상`);
  }

  if (detail.item?.name && detail.trigger.name !== 'use-item') {
    parts.push(`${resolveResourceName(detail.item, localizedResourceMap)} 사용`);
  }

  if (detail.held_item?.name) {
    parts.push(`${resolveResourceName(detail.held_item, localizedResourceMap)} 지닌 상태`);
  }

  if (detail.known_move?.name) {
    parts.push(`${resolveResourceName(detail.known_move, localizedResourceMap)} 기술 습득`);
  }

  if (detail.known_move_type?.name) {
    const typeName = POKEMON_TYPE_LABELS[detail.known_move_type.name as PokemonType] ?? humanizeSlug(detail.known_move_type.name);
    parts.push(`${typeName} 타입 기술 습득`);
  }

  if (detail.location?.name) {
    parts.push(`${resolveResourceName(detail.location, localizedResourceMap)} 지역`);
  }

  if (detail.min_happiness != null) {
    parts.push(`친밀도 ${detail.min_happiness} 이상`);
  }

  if (detail.min_beauty != null) {
    parts.push(`아름다움 ${detail.min_beauty} 이상`);
  }

  if (detail.min_affection != null) {
    parts.push(`애정도 ${detail.min_affection} 이상`);
  }

  if (detail.needs_overworld_rain) {
    parts.push('필드에 비가 오는 상태');
  }

  if (detail.party_species?.name) {
    parts.push(`${resolveResourceName(detail.party_species, localizedResourceMap)}가 파티에 있을 때`);
  }

  if (detail.party_type?.name) {
    const typeName = POKEMON_TYPE_LABELS[detail.party_type.name as PokemonType] ?? humanizeSlug(detail.party_type.name);
    parts.push(`${typeName} 타입 포켓몬이 파티에 있을 때`);
  }

  const relativePhysicalStats = formatRelativePhysicalStats(detail.relative_physical_stats);
  if (relativePhysicalStats) {
    parts.push(relativePhysicalStats);
  }

  if (detail.time_of_day) {
    parts.push(`${formatTimeOfDay(detail.time_of_day)}에`);
  }

  if (detail.trade_species?.name) {
    parts.push(`${resolveResourceName(detail.trade_species, localizedResourceMap)}와 교환`);
  }

  if (detail.turn_upside_down) {
    parts.push('기기를 거꾸로 한 상태');
  }

  const genderCondition = formatGenderCondition(detail.gender);
  if (genderCondition) {
    parts.push(genderCondition);
  }

  if (parts.length > 0) {
    return parts.join(' · ');
  }

  switch (detail.trigger.name) {
    case 'trade':
      return '교환';
    case 'use-item':
      return '아이템 사용';
    case 'shed':
      return '특수 진화';
    default:
      return '진화 조건 확인 필요';
  }
}

function formatEvolutionConditions(
  evolutionDetails: EvolutionDetail[],
  localizedResourceMap: Map<string, string>,
) {
  if (evolutionDetails.length === 0) {
    return null;
  }

  return evolutionDetails.map((detail) => formatEvolutionDetail(detail, localizedResourceMap)).join(' / ');
}

function flattenEvolutionChain(
  chain: EvolutionChainLink,
): Array<Array<FlattenedEvolutionNode>> {
  const stages: Array<Array<FlattenedEvolutionNode>> = [];

  function traverse(node: EvolutionChainLink, depth: number, evolutionDetails: EvolutionDetail[] = []) {
    if (!stages[depth]) stages[depth] = [];
    stages[depth].push({
      name: node.species.name,
      url: node.species.url,
      evolutionDetails,
    });
    node.evolves_to.forEach((child) => traverse(child, depth + 1, child.evolution_details));
  }

  traverse(chain, 0);
  return stages;
}

// ──────────────── 개별 포켓몬 노드 ────────────────

function EvolutionNode({
  name,
  speciesUrl,
  currentId,
  evolutionDetails,
}: {
  name: string;        // 영어 이름 (fallback)
  speciesUrl: string;
  currentId: number;
  evolutionDetails: EvolutionDetail[];
}) {
  const id = extractIdFromUrl(speciesUrl);
  const { data: pokemon } = useQuery(buildPokemonDetailQuery(id));
  const { data: species } = useQuery(buildPokemonSpeciesQuery(id));

  const localizedResources = useMemo(() => {
    const resources = evolutionDetails.flatMap((detail) => [
      detail.item,
      detail.held_item,
      detail.known_move,
      detail.location,
      detail.party_species,
      detail.trade_species,
    ]);

    const uniqueResources = new Map<string, { name: string; url: string }>();
    resources.forEach((resource) => {
      if (resource?.url) {
        uniqueResources.set(resource.url, resource);
      }
    });

    return [...uniqueResources.values()];
  }, [evolutionDetails]);

  const localizedResourceResults = useQueries({
    queries: localizedResources.map((resource) => ({
      ...buildLocalizedResourceByUrlQuery(resource.url),
      enabled: !!resource.url,
    })),
  });

  const localizedResourceMap = useMemo(() => {
    const map = new Map<string, string>();

    localizedResources.forEach((resource, index) => {
      const data = localizedResourceResults[index]?.data;
      const localizedName =
        data?.names?.find((entry) => entry.language.name === 'ko')?.name ??
        data?.form_names?.find((entry) => entry.language.name === 'ko')?.name ??
        data?.names?.find((entry) => entry.language.name === 'en')?.name ??
        humanizeSlug(resource.name);

      map.set(resource.url, localizedName);
    });

    return map;
  }, [localizedResources, localizedResourceResults]);

  const koreanName = species?.names.find((n) => n.language.name === 'ko')?.name;
  const displayName = koreanName ?? name;

  const imageUrl =
    pokemon?.sprites.other?.['official-artwork'].front_default ?? OFFICIAL_ARTWORK_URL(id);
  const evolutionConditionText = formatEvolutionConditions(evolutionDetails, localizedResourceMap);

  return (
    <Link
      href={`/pokemon/${id}`}
      className={cn(
        'flex min-w-[100px] flex-col items-center gap-1 rounded-xl p-2 transition-colors hover:bg-muted',
        id === currentId && 'bg-primary/10 ring-2 ring-primary',
      )}
    >
      <div className="relative h-20 w-20">
        <Image src={imageUrl} alt={displayName} fill className="object-contain" sizes="80px" />
      </div>
      <span className="text-xs text-muted-foreground">#{String(id).padStart(4, '0')}</span>
      <span className="text-center text-sm font-medium">{displayName}</span>
      {evolutionConditionText && (
        <span className="mt-1 max-w-[140px] text-center text-[11px] leading-snug text-muted-foreground">
          {evolutionConditionText}
        </span>
      )}
    </Link>
  );
}

// ──────────────── 진화 체인 표시 컴포넌트 ────────────────

interface EvolutionChainDisplayProps {
  chain: EvolutionChainLink;
  currentId: number;
}

export function EvolutionChainDisplay({ chain, currentId }: EvolutionChainDisplayProps) {
  const stages = flattenEvolutionChain(chain);

  if (stages.length <= 1) {
    return <p className="text-sm text-muted-foreground">이 포켓몬은 진화하지 않습니다.</p>;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {stages.map((stage, stageIdx) => (
        <div key={stageIdx} className="flex items-center gap-2">
          {stageIdx > 0 && <ChevronRight className="h-6 w-6 shrink-0 text-muted-foreground" />}
          <div className="flex flex-col gap-2">
            {stage.map((poke) => (
              <EvolutionNode
                key={poke.name}
                name={poke.name}
                speciesUrl={poke.url}
                currentId={currentId}
                evolutionDetails={poke.evolutionDetails}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
