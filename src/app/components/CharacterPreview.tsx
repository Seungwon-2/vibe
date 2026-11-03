import { useEffect, useState, type CSSProperties } from 'react';
import type { CharacterAnimationName, CharacterDefinition } from '../../game/characters/characterTypes';

export type CharacterPreviewProps = {
  character: CharacterDefinition;
  selected: boolean;
  animation?: CharacterAnimationName;
  loop?: boolean;
  playbackRate?: number;
  variant?: 'showcase' | 'roster' | 'runway';
};

type SpriteStyle = CSSProperties & { '--preview-scale': string };

const PREVIEW_CONTENT_HEIGHT = 136;
const PREVIEW_BASELINE = 91;

const CONTENT_HEIGHT: Readonly<Record<CharacterDefinition['id'], number>> = {
  'player-default': 70.5,
  'goth-student': 70.5,
  'cogane-rang': 72.75,
  'hanayo-hiyori': 69,
  'tokino-mary': 72.75,
};

export function CharacterPreview({ character, selected, animation, loop = true, playbackRate = 1, variant }: CharacterPreviewProps): React.JSX.Element {
  const animationName = animation ?? (variant === 'showcase' ? 'run'
    : variant === 'roster' ? 'idle'
      : selected ? 'run' : character.id === 'player-default' ? 'victory' : 'idle');
  const frames = character.qualityAnimations[animationName];
  const animationKey = `${character.id}:${animationName}`;
  const [playhead, setPlayhead] = useState({ animationKey, frameIndex: 0 });
  const frameIndex = playhead.animationKey === animationKey ? playhead.frameIndex : 0;
  const frame = frames[Math.min(frameIndex, frames.length - 1)];
  const frameScale = character.qualityScale;
  const previewScaleStyle: SpriteStyle = {
    '--preview-scale': `${PREVIEW_CONTENT_HEIGHT / CONTENT_HEIGHT[character.id]}`,
  };

  useEffect(() => {
    const preloadedFrames = frames.map(({ url }) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = url;
      return image;
    });
    const safePlaybackRate = Number.isFinite(playbackRate) ? Math.max(0.1, playbackRate) : 1;
    const interval = frames.length < 2 ? undefined : window.setInterval(() => {
      setPlayhead((current) => {
        const currentIndex = current.animationKey === animationKey ? current.frameIndex : 0;
        return {
          animationKey,
          frameIndex: currentIndex >= frames.length - 1 ? loop ? 0 : currentIndex : currentIndex + 1,
        };
      });
    }, 1000 / (character.qualityAnimationFps[animationName] * safePlaybackRate));
    return () => {
      if (interval !== undefined) window.clearInterval(interval);
      for (const image of preloadedFrames) image.onload = null;
    };
  }, [animationKey, animationName, character.qualityAnimationFps, frames, loop, playbackRate]);

  const variantClass = variant ? ` character-preview--${variant}` : '';
  return (
    <span className={`character-preview${variantClass}`} aria-hidden="true">
      <span className="character-preview__sprite" data-testid={`character-preview-frame-${character.id}${variant ? `-${variant}` : ''}`} style={previewScaleStyle}>
        <img
          className="character-preview__sheet"
          data-testid={`character-preview-${character.id}${variant ? `-${variant}` : ''}`}
          data-animation={animationName}
          data-frame={frame.textureKey}
          src={frame.url}
          alt=""
          draggable={false}
          style={{
            width: character.qualityFrameSize * frameScale,
            height: character.qualityFrameSize * frameScale,
            left: 0,
            top: PREVIEW_BASELINE - character.qualityPivotY * frameScale,
          }}
        />
      </span>
    </span>
  );
}
