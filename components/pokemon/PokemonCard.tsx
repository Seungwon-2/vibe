'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TypeBadge } from './TypeBadge';
import { buildPokemonDetailQuery, buildPokemonSpeciesQuery } from '@/queries/pokemon';
import { OFFICIAL_ARTWORK_URL } from '@/const/pokemon';

interface PokemonCardProps {
  id: number;
  name: string; // 영어 이름 (fallback용)
}

export function PokemonCard({ id, name }: PokemonCardProps) {
  const { data: pokemon, isLoading } = useQuery(buildPokemonDetailQuery(id));
  const { data: species } = useQuery(buildPokemonSpeciesQuery(id));

  const koreanName = species?.names.find((n) => n.language.name === 'ko')?.name;
  const displayName = koreanName ?? name;

  const imageUrl =
    pokemon?.sprites.other?.['official-artwork'].front_default ?? OFFICIAL_ARTWORK_URL(id);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <Skeleton className="mb-3 aspect-square w-full rounded-lg" />
          <Skeleton className="mb-1 h-3 w-12" />
          <Skeleton className="mb-2 h-4 w-24" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/pokemon/${id}`} className="block h-full">
      <Card className="h-full cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="p-4">
          {/* 이미지 */}
          <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-muted/40">
            <Image
              src={imageUrl}
              alt={displayName}
              fill
              className="object-contain p-2"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
          </div>

          {/* 번호 */}
          <p className="mb-1 text-xs text-muted-foreground">
            #{String(id).padStart(4, '0')}
          </p>

          {/* 한글 이름 (영문 서브) */}
          <h3 className="mb-0.5 text-sm font-semibold">{displayName}</h3>
          {koreanName && (
            <p className="mb-2 text-xs capitalize text-muted-foreground">{name}</p>
          )}
          {!koreanName && <div className="mb-2" />}

          {/* 타입 */}
          <div className="flex flex-wrap gap-1">
            {pokemon?.types.map((t) => (
              <TypeBadge key={t.type.name} type={t.type.name} />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
