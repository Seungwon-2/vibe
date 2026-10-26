import { useEffect, useMemo, useState } from 'react';
import type { CharacterDefinition } from '../../game/characters/characterTypes';

type CharacterPreviewProps = {
  character: CharacterDefinition;
  selected: boolean;
};

const RUN_FRAME_INTERVAL_MS = 83;

const RUNTIME_FRAME_URLS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../../assets/character/runtime/frames/*.png', {
      eager: true,
      import: 'default',
      query: '?url',
    }) as Record<string, string>,
  ).map(([path, url]) => [path.split('/').pop()?.replace(/\.png$/, ''), url]),
);

function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener?.('change', update);
    return () => mediaQuery.removeEventListener?.('change', update);
  }, []);

  return reducedMotion;
}

export function CharacterPreview({ character, selected }: CharacterPreviewProps): React.JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  const [frameIndex, setFrameIndex] = useState(0);
  const runFrames = character.animations.run;
  const idleFrame = character.animations.idle[0];
  const shouldAnimate = selected && !reducedMotion && runFrames.length > 1;

  useEffect(() => {
    setFrameIndex(0);
  }, [character.id, selected, reducedMotion]);

  useEffect(() => {
    if (!shouldAnimate) return;
    const timerId = window.setInterval(() => {
      setFrameIndex((currentIndex) => (currentIndex + 1) % runFrames.length);
    }, RUN_FRAME_INTERVAL_MS);
    return () => window.clearInterval(timerId);
  }, [character.id, runFrames.length, shouldAnimate]);

  const frameName = selected ? runFrames[shouldAnimate ? frameIndex : 0] : idleFrame;
  const frameUrl = useMemo(() => RUNTIME_FRAME_URLS[frameName], [frameName]);

  return (
    <span className="character-preview" aria-hidden="true">
      <img
        className="character-preview__sprite"
        data-testid={`character-preview-${character.id}`}
        data-animation={selected ? 'run' : 'idle'}
        data-frame={frameName}
        src={frameUrl}
        alt=""
        draggable={false}
      />
    </span>
  );
}
