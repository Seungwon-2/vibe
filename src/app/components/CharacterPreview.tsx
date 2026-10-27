import type { CSSProperties } from 'react';
import type { CharacterDefinition } from '../../game/characters/characterTypes';

type CharacterPreviewProps = {
  character: CharacterDefinition;
  selected: boolean;
};

type SpriteStyle = CSSProperties & {
  '--sprite-start-x': string;
  '--sprite-end-x': string;
  '--sprite-row-y': string;
};

export function CharacterPreview({ character, selected }: CharacterPreviewProps): React.JSX.Element {
  const animationName = selected ? 'run' : character.id === 'player-default' ? 'victory' : 'idle';
  const frames = character.animations[animationName];
  const frameName = frames[0];
  const frame = character.atlasManifest.frames[frameName].frame;
  const animationStart = character.atlasManifest.frames[frameName].frame;
  const spriteStyle: SpriteStyle = {
    width: character.atlasManifest.meta.size.w,
    height: character.atlasManifest.meta.size.h,
    transform: `translate3d(${-frame.x}px, ${-frame.y}px, 0)`,
    animationDuration: selected ? '1000ms' : '1200ms',
    animationTimingFunction: `steps(${frames.length}, end)`,
    '--sprite-start-x': `${-animationStart.x}px`,
    '--sprite-end-x': `${-(animationStart.x + frames.length * character.frameWidth)}px`,
    '--sprite-row-y': `${-animationStart.y}px`,
  };

  return (
    <span className="character-preview" aria-hidden="true">
      <span className="character-preview__sprite">
        <img
          className="character-preview__sheet is-animated"
          data-testid={`character-preview-${character.id}`}
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
