import type { CSSProperties } from 'react';
import type { CharacterDefinition } from '../../game/characters/characterTypes';

type CharacterPreviewProps = {
  character: CharacterDefinition;
  selected: boolean;
};

type SpriteStyle = CSSProperties & {
  '--run-start-x': string;
  '--run-end-x': string;
  '--run-row-y': string;
};

export function CharacterPreview({ character, selected }: CharacterPreviewProps): React.JSX.Element {
  const runFrames = character.animations.run;
  const frameName = selected ? runFrames[0] : character.animations.idle[0];
  const frame = character.atlasManifest.frames[frameName].frame;
  const runStart = character.atlasManifest.frames[runFrames[0]].frame;
  const spriteStyle: SpriteStyle = {
    width: character.atlasManifest.meta.size.w,
    height: character.atlasManifest.meta.size.h,
    transform: `translate3d(${-frame.x}px, ${-frame.y}px, 0)`,
    animationDuration: `${runFrames.length * 64}ms`,
    animationTimingFunction: `steps(${runFrames.length}, end)`,
    '--run-start-x': `${-runStart.x}px`,
    '--run-end-x': `${-(runStart.x + runFrames.length * character.frameWidth)}px`,
    '--run-row-y': `${-runStart.y}px`,
  };

  return (
    <span className="character-preview" aria-hidden="true">
      <span className="character-preview__sprite">
        <img
          className={`character-preview__sheet${selected ? ' is-running' : ''}`}
          data-testid={`character-preview-${character.id}`}
          data-animation={selected ? 'run' : 'idle'}
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
