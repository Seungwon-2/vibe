import { useEffect, useState } from 'react';
import type { CharacterFrameRef, CharacterId } from '../../game/characters/characterTypes';

export type SelectorRunnerPreviewProps = {
  characterId: CharacterId;
  frames: readonly CharacterFrameRef[];
  trailColor?: string;
};

export function SelectorRunnerPreview({ characterId, frames, trailColor }: SelectorRunnerPreviewProps): React.JSX.Element {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const preloaded = frames.map((src) => {
      const image = document.createElement('img');
      image.src = src.url;
      return image;
    });
    const interval = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 50);
    return () => {
      window.clearInterval(interval);
      preloaded.forEach((image) => { image.src = ''; });
    };
  }, [frames]);

  return (
    <span className="selector-runner-preview">
      {trailColor && <span className="selector-runner-preview__trail" style={{ '--trail-color': trailColor } as React.CSSProperties} />}
      <img
        className="selector-runner-frame"
        data-testid={`selector-runner-frame-${characterId}`}
        data-frame-index={frameIndex}
        src={frames[frameIndex]?.url ?? ''}
        alt=""
        draggable={false}
      />
    </span>
  );
}
