'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';

import { buildPokemonDetailQuery, buildPokemonFormQuery } from '@/queries/pokemon';
import { extractIdFromUrl } from '@/scheme/pokemon';
import { OFFICIAL_ARTWORK_URL, STAT_LABELS } from '@/const/pokemon';
import { TypeBadge } from './TypeBadge';
import { getFormLabel, isMegaForm, isGmaxForm } from '@/utils/pokemonForm';
import { cn } from '@/lib/utils';

type Variety = {
  is_default: boolean;
  pokemon: { name: string; url: string };
};

interface PokemonFormsProps {
  varieties: Variety[];
  baseEnglishName: string; // suffix 파싱용 기준 영어 이름
  koreanName: string;      // 섹션 제목 표시용
  currentPokemonName?: string;
}

export function PokemonForms({
  varieties,
  baseEnglishName,
  koreanName,
  currentPokemonName,
}: PokemonFormsProps) {
  const nonDefault = varieties.filter((v) => !v.is_default);

  // hooks 규칙: 조건 없이 최상단에서 호출
  const formResults = useQueries({
    queries: nonDefault.map((v) =>
      buildPokemonDetailQuery(extractIdFromUrl(v.pokemon.url)),
    ),
  });

  const formNameResults = useQueries({
    queries: nonDefault.map((v) =>
      buildPokemonFormQuery(v.pokemon.name),
    ),
  });

  if (nonDefault.length === 0) return null;

  const megaForms  = nonDefault.filter((v) => isMegaForm(v.pokemon.name));
  const gmaxForms  = nonDefault.filter((v) => isGmaxForm(v.pokemon.name));
  const otherForms = nonDefault.filter(
    (v) => !isMegaForm(v.pokemon.name) && !isGmaxForm(v.pokemon.name),
  );

  const renderCard = (v: Variety, options?: { hideStats?: boolean }) => {
    const idx    = nonDefault.indexOf(v);
    const id     = extractIdFromUrl(v.pokemon.url);
    const detail = formResults[idx]?.data;
    const imageUrl =
      detail?.sprites.other?.['official-artwork'].front_default ?? OFFICIAL_ARTWORK_URL(id);
    const formNameDetail = formNameResults[idx]?.data;
    const formLabel =
      formNameDetail?.form_names?.find((entry) => entry.language.name === 'ko')?.name ??
      formNameDetail?.names?.find((entry) => entry.language.name === 'ko')?.name ??
      getFormLabel(v.pokemon.name, baseEnglishName);
    const isCurrentForm = v.pokemon.name === currentPokemonName;
    const hideStats = options?.hideStats ?? false;

    return (
      <Link
        key={v.pokemon.name}
        href={`/pokemon/${v.pokemon.name}`}
        className={cn(
          'flex min-w-[140px] flex-col items-center gap-2 rounded-xl border bg-muted/20 p-3 transition-colors hover:bg-muted/40',
          isCurrentForm && 'border-primary bg-primary/10 ring-2 ring-primary/30',
        )}
      >
        {/* 이미지 */}
        <div className="relative h-24 w-24">
          <Image
            src={imageUrl}
            alt={`${koreanName} ${formLabel}`}
            fill
            className="object-contain"
            sizes="96px"
          />
        </div>

        {/* 폼 이름 */}
        <p className="text-center text-sm font-semibold leading-tight">
          {koreanName}
          <br />
          <span className="text-muted-foreground font-normal">{formLabel}</span>
        </p>

        {/* 타입 */}
        {detail && (
          <div className="flex flex-wrap justify-center gap-1">
            {detail.types.map((t) => (
              <TypeBadge key={t.type.name} type={t.type.name} />
            ))}
          </div>
        )}

        {/* 주요 능력치 */}
        {detail && !hideStats && (
          <div className="mt-1 w-full space-y-1">
            {detail.stats.map((s) => {
              const label = STAT_LABELS[s.stat.name] ?? s.stat.name;
              const pct = Math.min(100, Math.round((s.base_stat / 255) * 100));
              return (
                <div key={s.stat.name} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">{label}</span>
                  <span className="w-6 shrink-0 text-right text-xs font-medium">{s.base_stat}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-muted h-1.5">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {megaForms.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold">메가진화</h3>
          <div className="flex flex-wrap gap-4">{megaForms.map((form) => renderCard(form))}</div>
        </div>
      )}
      {gmaxForms.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold">거다이맥스</h3>
          <div className="flex flex-wrap gap-4">{gmaxForms.map((form) => renderCard(form))}</div>
        </div>
      )}
      {otherForms.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold">다른 폼</h3>
          <div className="flex flex-wrap gap-4">{otherForms.map((form) => renderCard(form, { hideStats: true }))}</div>
        </div>
      )}
    </div>
  );
}
