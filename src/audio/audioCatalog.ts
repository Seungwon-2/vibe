export type AudioEffectId =
  | 'jump'
  | 'double-jump'
  | 'slide'
  | 'coin'
  | 'time-pickup'
  | 'gate'
  | 'hit'
  | 'fall'
  | 'game-over'
  | 'victory'
  | 'hiyori-defense'
  | 'ui-click';

export type AudioCredit = {
  id: AudioEffectId;
  title: string;
  creator: 'User supplied' | 'Project02';
  sourceUrl: null;
  licenseName: string;
  licenseUrl: null;
  generationScript: string | null;
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
  'game-over': '게임 오버',
  victory: '완주 축하',
  'hiyori-defense': '히요리 방어',
  'ui-click': '버튼 선택',
};

const EFFECT_FILES: Readonly<Record<AudioEffectId, string>> = Object.freeze({
  jump: 'jump.ogg',
  'double-jump': 'double-jump.ogg',
  slide: 'slide.ogg',
  coin: 'coin.ogg',
  'time-pickup': 'time-pickup.wav',
  gate: 'gate.wav',
  hit: 'hit.ogg',
  fall: 'fall.wav',
  'game-over': 'game-over.ogg',
  victory: 'victory.ogg',
  'hiyori-defense': 'shield.ogg',
  'ui-click': 'button.ogg',
});

export const RUNNER_AUDIO_EFFECTS: Readonly<Record<AudioEffectId, Readonly<{ src: string; credit: AudioCredit }>>> =
  Object.freeze(Object.fromEntries(
    (Object.keys(TITLES) as AudioEffectId[]).map((id) => [id, Object.freeze({
      src: `/audio/sfx/${EFFECT_FILES[id]}`,
      credit: Object.freeze({
        id,
        title: TITLES[id],
        creator: EFFECT_FILES[id].endsWith('.ogg') ? 'User supplied' : 'Project02',
        sourceUrl: null,
        licenseName: EFFECT_FILES[id].endsWith('.ogg')
          ? 'README claims original audio; sharing terms unverified'
          : 'Original project-generated audio',
        licenseUrl: null,
        generationScript: EFFECT_FILES[id].endsWith('.ogg') ? null : 'scripts/generate-runner-effects.mjs',
      }),
    })]),
  )) as Readonly<Record<AudioEffectId, Readonly<{ src: string; credit: AudioCredit }>>>;
