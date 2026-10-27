import type { CSSProperties } from 'react';
import type { CharacterAnimationName, CharacterDefinition, CharacterId } from '../../game/characters/characterTypes';

export type CharacterPreviewProps = {
  character: CharacterDefinition;
  selected: boolean;
  animation?: CharacterAnimationName;
  variant?: 'showcase' | 'roster';
};

type SpriteStyle = CSSProperties & {
  '--sprite-start-x': string;
  '--sprite-end-x': string;
  '--sprite-row-y': string;
  '--preview-scale': string;
  '--preview-size-scale': string;
};

const PREVIEW_METRICS: Readonly<Record<CharacterId, { contentHeight: number; contentBottom: number }>> = {
  'player-default': { contentHeight: 70, contentBottom: 88 },
  'goth-student': { contentHeight: 88, contentBottom: 91 },
  'cogane-rang': { contentHeight: 83, contentBottom: 91 },
  'hanayo-hiyori': { contentHeight: 53, contentBottom: 88 },
  'tokino-mary': { contentHeight: 58, contentBottom: 89 },
};

const PREVIEW_CONTENT_HEIGHT = 136;
const PREVIEW_BASELINE = 91;
const RUN_FRAME_MS = 64;

export function CharacterPreview({ character, selected, animation, variant }: CharacterPreviewProps): React.JSX.Element {
  const animationName = animation ?? (variant === 'showcase' ? 'run'
    : variant === 'roster' ? 'idle'
      : selected ? 'run' : character.id === 'player-default' ? 'victory' : 'idle');
  const frames = character.animations[animationName];
  const frameName = frames[0];
  const animationStart = character.atlasManifest.frames[frameName].frame;
  const metrics = PREVIEW_METRICS[character.id];
  const spriteStyle: SpriteStyle = {
    width: character.atlasManifest.meta.size.w,
    height: character.atlasManifest.meta.size.h,
    transform: 'translate3d(var(--sprite-start-x), var(--sprite-row-y), 0)',
    animationDuration: `${frames.length * (animationName === 'run' ? RUN_FRAME_MS : 200)}ms`,
    animationTimingFunction: `steps(${frames.length}, end)`,
    '--sprite-start-x': `${-animationStart.x}px`,
    '--sprite-end-x': `${-(animationStart.x + frames.length * character.frameWidth)}px`,
    '--sprite-row-y': `${-animationStart.y + PREVIEW_BASELINE - metrics.contentBottom}px`,
    '--preview-scale': `${PREVIEW_CONTENT_HEIGHT / metrics.contentHeight}`,
    '--preview-size-scale': '1',
  };
  const variantClass = variant ? ` character-preview--${variant}` : '';

  return (
    <span className={`character-preview${variantClass}`} aria-hidden="true">
      <span className="character-preview__sprite">
        <img
          className="character-preview__sheet is-animated"
          data-testid={`character-preview-${character.id}${variant ? `-${variant}` : ''}`}
          data-animation={animationName}
          data-frame={frameName}
          src={character.atlasUrl}
          style={spriteStyle}
          alt=""
          draggable={false}
        />
      </span>
    </span>
  );
}
