import type { CharacterDefinition } from '../characters/characterTypes';

export type RunnerAnimationPlayback = Readonly<{ frameRate: number; repeat: number }>;

export function getRunnerAnimationPlayback(name: string, character: CharacterDefinition): RunnerAnimationPlayback {
  const isFall = name === 'jump-fall' || name === 'double-jump-fall';
  const isTerminal = name === 'victory' || name === 'gameOver';
  const frameRate = isTerminal
    ? character.qualityAnimationFps[name]
    : name === 'run' ? 20 : name === 'slide' ? 18 : isFall ? 6 : name === 'jump' ? 8 : 12;

  return { frameRate, repeat: name === 'run' || isFall ? -1 : 0 };
}
