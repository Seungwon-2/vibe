'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Sparkles } from 'lucide-react';

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
import {
  DRAW_RARITIES,
  GENERATIONS,
  OFFICIAL_ARTWORK_URL,
  POKEMON_TYPE_LABELS,
  TOTAL_POKEMON,
  type DrawRarity,
  getDrawRarityMeta,
  getGenerationRange,
  getPokemonDrawPoolIds,
  getPokemonDrawRarity,
} from '@/const/pokemon';
import { cn } from '@/lib/utils';
import { buildPokemonDetailQuery, buildPokemonSpeciesQuery } from '@/queries/pokemon';

const INITIAL_DIGITS = ['0', '0', '0', '0'];
const DIGIT_STOP_DELAYS = [1300, 1750, 2200, 2650];
const SILHOUETTE_REVEAL_DURATION = 1400;
const HANGUL_INITIALS = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

function padPokemonId(id: number) {
  return String(id).padStart(4, '0');
}

function getRandomDigit() {
  return String(Math.floor(Math.random() * 10));
}

function getRandomPokemonId() {
  return Math.floor(Math.random() * TOTAL_POKEMON) + 1;
}

function normalizePokemonAnswer(value: string) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function getPokemonInitialHint(value: string) {
  return Array.from(value.trim())
    .map((char) => {
      const code = char.charCodeAt(0);

      if (code >= 0xac00 && code <= 0xd7a3) {
        const initialIndex = Math.floor((code - 0xac00) / 588);
        return HANGUL_INITIALS[initialIndex] ?? char;
      }

      if (/\p{L}|\p{N}/u.test(char)) {
        return char[0]?.toUpperCase() ?? char;
      }

      return char;
    })
    .join('');
}

export function PokemonDrawContainer() {
  const [digits, setDigits] = useState<string[]>(INITIAL_DIGITS);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResolvingTarget, setIsResolvingTarget] = useState(false);
  const [activeLever, setActiveLever] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  const [selectedRarity, setSelectedRarity] = useState<DrawRarity>('all');
  const [drawError, setDrawError] = useState('');
  const [isRevealingPokemon, setIsRevealingPokemon] = useState(false);
  const [isPokemonRevealed, setIsPokemonRevealed] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizFeedback, setQuizFeedback] = useState('');
  const [showInitialHint, setShowInitialHint] = useState(false);
  const [showTypeHint, setShowTypeHint] = useState(false);

  const intervalRefs = useRef<Array<number | null>>([]);
  const timeoutRefs = useRef<Array<number | null>>([]);
  const revealTimeoutRef = useRef<number | null>(null);

  const detailQuery = useQuery({
    ...buildPokemonDetailQuery(revealedId ?? 0),
    enabled: revealedId != null,
  });

  const speciesQuery = useQuery({
    ...buildPokemonSpeciesQuery(revealedId ?? 0),
    enabled: revealedId != null,
  });

  const koreanName =
    speciesQuery.data?.names.find((entry) => entry.language.name === 'ko')?.name ??
    detailQuery.data?.name ??
    '알 수 없는 포켓몬';

  const koreanGenus =
    speciesQuery.data?.genera.find((entry) => entry.language.name === 'ko')?.genus ??
    '포켓몬 정보 로딩 중';

  const pokemonTypes = useMemo(
    () => detailQuery.data?.types.map((entry) => POKEMON_TYPE_LABELS[entry.type.name] ?? entry.type.name) ?? [],
    [detailQuery.data?.types],
  );

  const revealedRarity = useMemo(
    () => (speciesQuery.data ? getPokemonDrawRarity(speciesQuery.data) : null),
    [speciesQuery.data],
  );

  const revealedRarityMeta = revealedRarity ? getDrawRarityMeta(revealedRarity) : null;
  const currentGenerationMeta = getGenerationRange(selectedGeneration);
  const currentRarityMeta = getDrawRarityMeta(selectedRarity);
  const availableDrawIds = useMemo(
    () => getPokemonDrawPoolIds(selectedGeneration, selectedRarity),
    [selectedGeneration, selectedRarity],
  );
  const acceptedQuizAnswers = useMemo(() => {
    const answers = new Set<string>();

    if (speciesQuery.data) {
      speciesQuery.data.names
        .filter((entry) => entry.language.name === 'ko' || entry.language.name === 'en')
        .forEach((entry) => {
          const normalized = normalizePokemonAnswer(entry.name);
          if (normalized) answers.add(normalized);
        });
    }

    const normalizedFallbackKo = normalizePokemonAnswer(koreanName);
    const normalizedFallbackEn = normalizePokemonAnswer(detailQuery.data?.name ?? '');

    if (normalizedFallbackKo) answers.add(normalizedFallbackKo);
    if (normalizedFallbackEn) answers.add(normalizedFallbackEn);

    return answers;
  }, [detailQuery.data?.name, koreanName, speciesQuery.data]);
  const pokemonInitialHint = useMemo(() => getPokemonInitialHint(koreanName), [koreanName]);
  const isBusy = isResolvingTarget || isDrawing;
  const shouldShowSilhouette = revealedId != null && !isPokemonRevealed;
  const displayedPokemonName = shouldShowSilhouette ? '???' : koreanName;
  const displayedPokemonGenus = shouldShowSilhouette ? '누구인지 밝혀지기 전까지는 비밀이에요.' : koreanGenus;
  const displayedPokemonTypes = shouldShowSilhouette ? [] : pokemonTypes;

  const clearTimers = () => {
    intervalRefs.current.forEach((timer) => timer !== null && window.clearInterval(timer));
    timeoutRefs.current.forEach((timer) => timer !== null && window.clearTimeout(timer));
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
    intervalRefs.current = [];
    timeoutRefs.current = [];
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const startDrawAnimation = (nextId: number) => {
    clearTimers();

    const targetDigits = padPokemonId(nextId).split('');

    setIsDrawing(true);
    setActiveLever(true);
    setTargetId(nextId);
    setRevealedId(null);
    setIsPokemonRevealed(false);
    setIsRevealingPokemon(false);
    setQuizAnswer('');
    setQuizFeedback('');
    setShowInitialHint(false);
    setShowTypeHint(false);
    setDigits(INITIAL_DIGITS);

    const leverTimeout = window.setTimeout(() => setActiveLever(false), 260);
    timeoutRefs.current = [leverTimeout];

    targetDigits.forEach((targetDigit, index) => {
      const intervalId = window.setInterval(() => {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = getRandomDigit();
          return next;
        });
      }, 72 + index * 18);

      intervalRefs.current[index] = intervalId;

      const stopTimeout = window.setTimeout(() => {
        window.clearInterval(intervalId);
        setDigits((prev) => {
          const next = [...prev];
          next[index] = targetDigit;
          return next;
        });

        if (index === targetDigits.length - 1) {
          setIsDrawing(false);
          setRevealedId(nextId);
        }
      }, DIGIT_STOP_DELAYS[index]);

      timeoutRefs.current.push(stopTimeout);
    });
  };

  const handleDraw = async () => {
    if (isBusy) return;

    setDrawError('');
    setIsResolvingTarget(true);

    try {
      const nextId =
        selectedGeneration === 0 && selectedRarity === 'all'
          ? getRandomPokemonId()
          : availableDrawIds[Math.floor(Math.random() * availableDrawIds.length)] ?? null;

      if (nextId == null) {
        setDrawError('현재 필터 조건에 맞는 포켓몬을 찾지 못했어요. 다른 희귀도나 세대를 선택해보세요.');
        return;
      }

      startDrawAnimation(nextId);
    } catch {
      setDrawError('포켓몬 정보를 불러오는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsResolvingTarget(false);
    }
  };

  const handleRevealPokemon = () => {
    if (revealedId == null || isRevealingPokemon || isPokemonRevealed) return;

    setIsRevealingPokemon(true);
    revealTimeoutRef.current = window.setTimeout(() => {
      setIsRevealingPokemon(false);
      setIsPokemonRevealed(true);
      revealTimeoutRef.current = null;
    }, SILHOUETTE_REVEAL_DURATION);
  };

  const handleQuizSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!shouldShowSilhouette || isRevealingPokemon) return;

    const normalizedGuess = normalizePokemonAnswer(quizAnswer);

    if (!normalizedGuess) {
      setQuizFeedback('포켓몬 이름을 입력해 주세요.');
      return;
    }

    if (acceptedQuizAnswers.has(normalizedGuess)) {
      setQuizFeedback('정답입니다! 포켓몬의 정체를 공개할게요.');
      handleRevealPokemon();
      return;
    }

    setQuizFeedback('아쉽지만 정답이 아니에요. 실루엣과 도감 번호를 다시 확인해 보세요.');
  };

  return (
    <PageContainer className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-background via-background to-red-50/30 dark:to-red-950/10">
      <PageHeader
        title="포켓몬 뽑기"
        description="레버를 당기면 4자리 포켓몬 번호 룰렛이 돌아가고, 멈춘 번호의 포켓몬이 등장합니다."
      />

      <section className="mt-6 rounded-3xl border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-2 text-sm font-semibold">세대 선택</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedGeneration === 0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedGeneration(0)}
                disabled={isBusy}
              >
                전체
              </Button>
              {GENERATIONS.map((generation) => (
                <Button
                  key={generation.value}
                  variant={selectedGeneration === generation.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedGeneration(generation.value)}
                  disabled={isBusy}
                >
                  {generation.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">희귀도 선택</p>
            <div className="flex flex-wrap gap-2">
              {DRAW_RARITIES.map((rarity) => (
                <Button
                  key={rarity.value}
                  variant={selectedRarity === rarity.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRarity(rarity.value)}
                  disabled={isBusy}
                  className="gap-2"
                >
                  {rarity.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">현재 필터</span>
          <Badge variant="secondary">{currentGenerationMeta.label}</Badge>
          <Badge variant="secondary">{currentRarityMeta.label}</Badge>
          <span>{currentRarityMeta.description}</span>
          {selectedRarity !== 'all' && <span>후보 {availableDrawIds.length}마리</span>}
        </div>

        {drawError && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {drawError}
          </p>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,420px)]">
        <section className="rounded-[2rem] border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-8">
          <div className="mx-auto max-w-3xl">
            <div className="relative overflow-hidden rounded-[2rem] border-8 border-zinc-900 bg-gradient-to-b from-red-500 via-red-500 to-white px-6 pb-10 pt-8 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:px-10">
              <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 bg-zinc-900/80" />
              <div className="absolute inset-x-6 top-6 h-6 rounded-full bg-yellow-300/90 blur-md" />

              <div className="relative mx-auto flex max-w-xl items-center justify-between gap-4 sm:gap-8">
                <div className="flex-1 rounded-[1.75rem] border-[10px] border-zinc-700 bg-zinc-200 p-4 shadow-inner sm:p-6">
                  <div className="grid grid-cols-4 gap-2 sm:gap-4">
                    {digits.map((digit, index) => (
                      <div
                        key={`${index}-${digit}`}
                        className="relative overflow-hidden rounded-xl border-4 border-zinc-700 bg-white shadow-inner"
                      >
                        <div className="flex h-24 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_45%),linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(239,246,255,1)_100%)] sm:h-32">
                          <span
                            className={cn(
                              'font-mono text-5xl font-black tracking-tight text-blue-700 transition-transform duration-150 sm:text-7xl',
                              isDrawing && 'animate-pulse',
                            )}
                          >
                            {digit}
                          </span>
                        </div>
                        <div className="absolute inset-y-0 left-0 w-2 bg-zinc-300/80" />
                        <div className="absolute inset-y-0 right-0 w-2 bg-zinc-300/80" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDraw}
                    disabled={isBusy}
                    className="group flex flex-col items-center gap-3 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="포켓몬 뽑기 레버 당기기"
                  >
                    <div className="relative h-36 w-10 rounded-full bg-zinc-700 shadow-inner sm:h-44 sm:w-12">
                      <div
                        className={cn(
                          'absolute left-1/2 top-3 h-24 w-2 -translate-x-1/2 rounded-full bg-zinc-200 transition-all duration-300 sm:h-30',
                          activeLever && 'top-8 rotate-12 sm:top-10',
                        )}
                      />
                      <div
                        className={cn(
                          'absolute left-1/2 top-0 h-8 w-8 -translate-x-1/2 rounded-full border-4 border-zinc-900 bg-red-500 shadow-lg transition-all duration-300 sm:h-10 sm:w-10',
                          activeLever && 'top-6 translate-x-2 sm:top-8',
                        )}
                      />
                    </div>
                    <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm">
                      {isResolvingTarget
                        ? '조건 확인 중...'
                        : isDrawing
                          ? '룰렛 작동 중...'
                          : '레버 당기기'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-2xl border bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">현재 번호</p>
                <p className="font-mono text-3xl font-black tracking-[0.3em] text-primary sm:text-4xl">
                  {digits.join('')}
                </p>
              </div>
              <div className="text-sm text-muted-foreground sm:text-right">
                <p>
                  번호는 {padPokemonId(currentGenerationMeta.min)} ~ {padPokemonId(currentGenerationMeta.max)} 범위에서
                  결정됩니다.
                </p>
                <p>
                  {isResolvingTarget
                    ? `${currentGenerationMeta.label} · ${currentRarityMeta.label} 조건을 만족하는 포켓몬을 찾는 중입니다.`
                    : targetId && !isDrawing
                    ? `이번 뽑기 결과 번호는 ${padPokemonId(targetId)} 입니다.`
                      : `${currentGenerationMeta.label} / ${currentRarityMeta.label} 조건으로 새로운 포켓몬을 만나보세요.`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside>
          <Card className="h-full border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                뽑기 결과
              </CardTitle>
              <CardDescription>
                번호가 완성되면 해당 포켓몬이 등장하고, 자세히 버튼으로 도감 상세 페이지로 이동할 수 있습니다.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col justify-center">
              {revealedId == null ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-semibold">아직 뽑은 포켓몬이 없어요</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    레버를 당기면 룰렛이 돌다가 4자리 번호가 완성되고
                    <br />
                    현재 필터 조건에 맞는 포켓몬 이미지가 이곳에 표시됩니다.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border bg-gradient-to-b from-red-50 to-white p-5 dark:from-red-950/20 dark:to-background">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        Draw Result
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight">
                        #{padPokemonId(revealedId)} {displayedPokemonName}
                      </h2>
                      {!shouldShowSilhouette && detailQuery.data?.name && (
                        <p className="mt-1 text-sm capitalize text-muted-foreground">{detailQuery.data.name}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">{currentGenerationMeta.label}</Badge>
                        {revealedRarityMeta && !shouldShowSilhouette && (
                          <Badge variant="secondary">{revealedRarityMeta.label}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {isBusy ? '추첨 중' : isRevealingPokemon ? '공개 중' : shouldShowSilhouette ? '실루엣' : '획득 완료'}
                    </div>
                  </div>

                  <div className="relative mt-4 overflow-hidden rounded-2xl border bg-background/70 p-4">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.2),_transparent_35%)]" />
                    <div className="relative flex min-h-[240px] items-center justify-center">
                      <Image
                        src={
                          detailQuery.data?.sprites.other?.['official-artwork'].front_default ??
                          OFFICIAL_ARTWORK_URL(revealedId)
                        }
                        alt={koreanName}
                        width={260}
                        height={260}
                        className={cn(
                          'relative z-10 h-auto w-full max-w-[240px] object-contain transition-[opacity,transform,filter] duration-[1400ms] ease-out',
                          shouldShowSilhouette ? 'scale-[0.985] opacity-0 blur-[1px]' : 'scale-100 opacity-100 blur-0',
                          isRevealingPokemon && 'scale-[1.03]',
                        )}
                        priority
                      />
                      <Image
                        src={
                          detailQuery.data?.sprites.other?.['official-artwork'].front_default ??
                          OFFICIAL_ARTWORK_URL(revealedId)
                        }
                        alt="실루엣 상태의 포켓몬"
                        width={260}
                        height={260}
                        aria-hidden="true"
                        className={cn(
                          'absolute z-20 h-auto w-full max-w-[240px] object-contain transition-[opacity,transform,filter] duration-[1400ms] ease-out',
                          shouldShowSilhouette
                            ? 'scale-100 opacity-100 brightness-0 saturate-0 contrast-150 blur-[0.5px] drop-shadow-[0_16px_24px_rgba(0,0,0,0.55)]'
                            : 'scale-[1.06] opacity-0 brightness-100 saturate-100 blur-[8px]',
                          isRevealingPokemon && 'scale-[1.08]',
                        )}
                        priority
                      />
                      <div
                        className={cn(
                          'pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.0)_0%,_rgba(255,255,255,0.12)_35%,_rgba(0,0,0,0.28)_100%)] transition-opacity duration-[1400ms] ease-out',
                          shouldShowSilhouette ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div
                        className={cn(
                          'pointer-events-none absolute inset-x-[18%] top-[15%] z-30 h-20 rounded-full bg-white/60 blur-3xl transition-opacity duration-[1400ms] ease-out',
                          isRevealingPokemon ? 'opacity-70' : 'opacity-0',
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {displayedPokemonTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                      >
                        {type}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">{displayedPokemonGenus}</p>

                  {shouldShowSilhouette && (
                    <div className="mt-4 rounded-2xl border bg-background/80 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">누구의 실루엣일까요?</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            실루엣과 도감 번호를 보고 포켓몬 이름을 맞혀보세요.
                          </p>
                        </div>
                        <Button type="button" variant="outline" onClick={handleRevealPokemon} disabled={isRevealingPokemon}>
                          {isRevealingPokemon ? '공개 중...' : '모르겠다면 공개'}
                        </Button>
                      </div>

                      <form onSubmit={handleQuizSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <Input
                          value={quizAnswer}
                          onChange={(event) => setQuizAnswer(event.target.value)}
                          placeholder="포켓몬 이름을 입력하세요"
                          disabled={isRevealingPokemon}
                          aria-label="포켓몬 이름 퀴즈 정답 입력"
                          className="h-10"
                        />
                        <Button type="submit" disabled={isRevealingPokemon} className="sm:px-6">
                          정답 확인
                        </Button>
                      </form>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <Badge variant="secondary">힌트: 도감 번호 #{padPokemonId(revealedId)}</Badge>
                        <Badge variant="secondary">{currentGenerationMeta.label}</Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowInitialHint((prev) => !prev)}
                          disabled={isRevealingPokemon}
                        >
                          {showInitialHint ? '초성 힌트 숨기기' : '초성 힌트 보기'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTypeHint((prev) => !prev)}
                          disabled={isRevealingPokemon}
                        >
                          {showTypeHint ? '타입 힌트 숨기기' : '타입 힌트 보기'}
                        </Button>
                      </div>

                      {(showInitialHint || showTypeHint) && (
                        <div className="mt-3 space-y-2 rounded-xl border border-dashed bg-muted/30 p-3 text-sm">
                          {showInitialHint && (
                            <p className="text-foreground">
                              <span className="font-semibold">초성 힌트:</span> {pokemonInitialHint || '없음'}
                            </p>
                          )}
                          {showTypeHint && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">타입 힌트:</span>
                              {pokemonTypes.map((type) => (
                                <Badge key={`hint-${type}`} variant="secondary">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {quizFeedback && (
                        <p
                          className={cn(
                            'mt-3 text-sm font-medium',
                            quizFeedback.includes('정답') ? 'text-primary' : 'text-muted-foreground',
                          )}
                        >
                          {quizFeedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-between gap-3">
              <Button onClick={handleDraw} disabled={isBusy}>
                {isResolvingTarget
                    ? '대상 찾는 중...'
                    : isDrawing
                      ? '뽑는 중...'
                      : '한 번 더 뽑기'}
              </Button>

              {revealedId != null && (
                <Link
                  href={`/pokemon/${revealedId}`}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  자세히
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </CardFooter>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}