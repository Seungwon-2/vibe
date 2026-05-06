'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { buildPokemonDetailQuery, buildPokemonSpeciesQuery } from '@/queries/pokemon';
import type { EvolutionChainLink } from '@/scheme/pokemon';
import { extractIdFromUrl } from '@/scheme/pokemon';
import { OFFICIAL_ARTWORK_URL } from '@/const/pokemon';
import { cn } from '@/lib/utils';

// ──────────────── 진화 체인을 단계별 배열로 변환 ────────────────

function flattenEvolutionChain(
  chain: EvolutionChainLink,
): Array<Array<{ name: string; url: string }>> {
  const stages: Array<Array<{ name: string; url: string }>> = [];

  function traverse(node: EvolutionChainLink, depth: number) {
    if (!stages[depth]) stages[depth] = [];
    stages[depth].push({ name: node.species.name, url: node.species.url });
    node.evolves_to.forEach((child) => traverse(child, depth + 1));
  }

  traverse(chain, 0);
  return stages;
}

// ──────────────── 개별 포켓몬 노드 ────────────────

function EvolutionNode({
  name,
  speciesUrl,
  currentId,
}: {
  name: string;        // 영어 이름 (fallback)
  speciesUrl: string;
  currentId: number;
}) {
  const id = extractIdFromUrl(speciesUrl);
  const { data: pokemon } = useQuery(buildPokemonDetailQuery(id));
  const { data: species } = useQuery(buildPokemonSpeciesQuery(id));

  const koreanName = species?.names.find((n) => n.language.name === 'ko')?.name;
  const displayName = koreanName ?? name;

  const imageUrl =
    pokemon?.sprites.other?.['official-artwork'].front_default ?? OFFICIAL_ARTWORK_URL(id);

  return (
    <Link
      href={`/pokemon/${id}`}
      className={cn(
        'flex min-w-[80px] flex-col items-center gap-1 rounded-xl p-2 transition-colors hover:bg-muted',
        id === currentId && 'bg-primary/10 ring-2 ring-primary',
      )}
    >
      <div className="relative h-20 w-20">
        <Image src={imageUrl} alt={displayName} fill className="object-contain" sizes="80px" />
      </div>
      <span className="text-xs text-muted-foreground">#{String(id).padStart(4, '0')}</span>
      <span className="text-center text-sm font-medium">{displayName}</span>
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
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
