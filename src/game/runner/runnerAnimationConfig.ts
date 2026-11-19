import type { CharacterDefinition, CharacterId } from '../characters/characterTypes';

export type RunnerAnimationPlayback = Readonly<{ frameRate: number; repeat: number }>;

export function usesSlideTransitions(characterId: CharacterId): boolean {
  return characterId === 'player-default' || characterId === 'goth-student';
}

export function getRunnerAnimationPlayback(name: string, character: CharacterDefinition): RunnerAnimationPlayback {
  const isFall = name === 'jump-fall' || name === 'double-jump-fall';
  const isTerminal = name === 'victory' || name === 'gameOver';
  const isSlide = name === 'slide' || name === 'slide-enter' || name === 'slide-exit';
  const frameRate = isTerminal
    ? character.qualityAnimationFps[name]
    : name === 'run' ? 20 : isSlide ? 18 : isFall ? 6 : name === 'jump' ? 8 : 12;

  return { frameRate, repeat: name === 'run' || isFall ? -1 : 0 };
}
