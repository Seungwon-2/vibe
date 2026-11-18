import type { RunnerBiomeId } from '../game/runner/runnerTypes';

export type RunnerMusicId = 'title' | RunnerBiomeId;
type RunnerMusicTrack = Readonly<{ src: string; loop: true; gain?: number }>;

export const RUNNER_MUSIC: Readonly<Record<RunnerMusicId, RunnerMusicTrack>> = Object.freeze({
  title: Object.freeze({ src: '/audio/music/title.ogg', loop: true }),
  'dawn-city': Object.freeze({ src: '/audio/music/city.ogg', loop: true }),
  'moonlit-forest': Object.freeze({ src: '/audio/music/forest.ogg', loop: true }),
  'crystal-mine': Object.freeze({ src: '/audio/music/mine.ogg', loop: true }),
  'cloud-skyway': Object.freeze({ src: '/audio/music/sky.ogg', loop: true }),
  'starlight-rainbow': Object.freeze({ src: '/audio/music/starlight-rainbow-road.ogg', loop: true, gain: 1.26 }),
});
