'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TypeBadge } from '@/components/pokemon/TypeBadge';
import {
  MOVE_DAMAGE_CLASSES,
  MOVE_DAMAGE_CLASS_LABELS,
  MOVE_DAMAGE_CLASS_STYLES,
} from '@/const/move';
import { buildMoveDetailQuery } from '@/queries/move';
import { cn } from '@/lib/utils';

interface MoveCardProps {
  id: number;
  name: string;
}

export function MoveCard({ id, name }: MoveCardProps) {
  const { data: move, isLoading } = useQuery(buildMoveDetailQuery(id));

  const koreanName = move?.names.find((item) => item.language.name === 'ko')?.name;
  const displayName = koreanName ?? name;
  const damageClassName = move?.damage_class.name;
  const damageClassKey = damageClassName && MOVE_DAMAGE_CLASSES.includes(damageClassName as (typeof MOVE_DAMAGE_CLASSES)[number])
    ? (damageClassName as (typeof MOVE_DAMAGE_CLASSES)[number])
    : null;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/move/${id}`} className="block h-full">
      <Card className="h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="p-4">
          <p className="mb-1 text-xs text-muted-foreground">기술 #{String(id).padStart(4, '0')}</p>
          <h3 className="mb-0.5 line-clamp-1 text-sm font-semibold">{displayName}</h3>
          {koreanName ? (
            <p className="mb-3 line-clamp-1 text-xs capitalize text-muted-foreground">{name}</p>
          ) : (
            <div className="mb-3" />
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            {move?.type.name && <TypeBadge type={move.type.name} />}
            {damageClassKey && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                  MOVE_DAMAGE_CLASS_STYLES[damageClassKey],
                )}
              >
                {MOVE_DAMAGE_CLASS_LABELS[damageClassKey]}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/40 p-2">
              <p className="text-[10px] text-muted-foreground">위력</p>
              <p className="text-sm font-semibold">{move?.power ?? '-'}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-2">
              <p className="text-[10px] text-muted-foreground">명중</p>
              <p className="text-sm font-semibold">{move?.accuracy ?? '-'}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-2">
              <p className="text-[10px] text-muted-foreground">PP</p>
              <p className="text-sm font-semibold">{move?.pp ?? '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}