import type { RunnerBiomeId } from '../game/runner/runnerTypes';

export type RunnerMusicId = 'title' | RunnerBiomeId;

export const RUNNER_MUSIC: Readonly<Record<RunnerMusicId, Readonly<{ src: string; loop: true }>>> = Object.freeze({
  title: Object.freeze({ src: '/audio/music/title.ogg', loop: true }),
  'dawn-city': Object.freeze({ src: '/audio/music/city.ogg', loop: true }),
  'moonlit-forest': Object.freeze({ src: '/audio/music/forest.ogg', loop: true }),
  'crystal-mine': Object.freeze({ src: '/audio/music/mine.ogg', loop: true }),
  'cloud-skyway': Object.freeze({ src: '/audio/music/sky.ogg', loop: true }),
});
