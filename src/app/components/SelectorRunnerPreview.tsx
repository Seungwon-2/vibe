import { useEffect, useState } from 'react';
import type { CharacterId } from '../../game/characters/characterTypes';

export type SelectorRunnerPreviewProps = {
  characterId: CharacterId;
  frames: readonly string[];
};

export function SelectorRunnerPreview({ characterId, frames }: SelectorRunnerPreviewProps): React.JSX.Element {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const preloaded = frames.map((src) => {
      const image = document.createElement('img');
      image.src = src;
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
    <img
      className="selector-runner-frame"
      data-testid={`selector-runner-frame-${characterId}`}
      data-frame-index={frameIndex}
      src={frames[frameIndex]}
      alt=""
      draggable={false}
    />
  );
}
