export type AudioEffectId =
  | 'jump'
  | 'double-jump'
  | 'slide'
  | 'coin'
  | 'time-pickup'
  | 'gate'
  | 'hit'
  | 'fall'
  | 'hiyori-defense'
  | 'ui-click';

export type AudioCredit = {
  id: AudioEffectId;
  title: string;
  creator: 'Project02';
  sourceUrl: null;
  licenseName: 'Original project-generated audio';
  licenseUrl: null;
  generationScript: string;
};

const TITLES: Record<AudioEffectId, string> = {
  jump: '점프',
  'double-jump': '이단 점프',
  slide: '슬라이딩',
  coin: '코인 획득',
  'time-pickup': '시간 아이템',
  gate: '보너스 게이트',
  hit: '장애물 피격',
  fall: '낭떠러지 추락',
  'hiyori-defense': '히요리 방어',
  'ui-click': '버튼 선택',
};

export const RUNNER_AUDIO_EFFECTS: Readonly<Record<AudioEffectId, Readonly<{ src: string; credit: AudioCredit }>>> =
  Object.freeze(Object.fromEntries(
    (Object.keys(TITLES) as AudioEffectId[]).map((id) => [id, Object.freeze({
      src: `/audio/sfx/${id}.wav`,
      credit: Object.freeze({
        id,
        title: TITLES[id],
        creator: 'Project02' as const,
        sourceUrl: null,
        licenseName: 'Original project-generated audio' as const,
        licenseUrl: null,
        generationScript: 'scripts/generate-runner-effects.mjs',
      }),
    })]),
  )) as Readonly<Record<AudioEffectId, Readonly<{ src: string; credit: AudioCredit }>>>;
