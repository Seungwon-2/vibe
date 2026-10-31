import type { CharacterId } from '../game/characters/characterTypes';

export type CosmeticKind = 'trail' | 'skin' | 'profile';
export type CosmeticDefinition = Readonly<{
  id: string;
  name: string;
  kind: CosmeticKind;
  price: number;
  assetPath: string | null;
  compatibleCharacterIds: readonly CharacterId[];
  rarity: 'common' | 'rare' | 'epic';
  description: string;
  placeholder: boolean;
  purchasable: boolean;
  color: string;
}>;

const ALL_CHARACTERS: readonly CharacterId[] = [
  'player-default', 'hanayo-hiyori', 'tokino-mary', 'goth-student', 'cogane-rang',
];

export const COSMETICS: readonly CosmeticDefinition[] = Object.freeze([
  { id: 'trail-cloud', name: '구름 잔상', kind: 'trail', price: 75, assetPath: null, compatibleCharacterIds: ALL_CHARACTERS, rarity: 'common', description: '달릴 때 옅은 구름빛 궤적이 남습니다.', placeholder: false, purchasable: true, color: '#82b9f6' },
  { id: 'trail-petal', name: '꽃잎 산책', kind: 'trail', price: 120, assetPath: null, compatibleCharacterIds: ALL_CHARACTERS, rarity: 'common', description: '작은 꽃잎이 발걸음 뒤에 흩날립니다.', placeholder: false, purchasable: true, color: '#f1a9ca' },
  { id: 'trail-starlight', name: '별빛 궤적', kind: 'trail', price: 0, assetPath: null, compatibleCharacterIds: ALL_CHARACTERS, rarity: 'rare', description: '업적으로 해금되는 반짝이는 궤적.', placeholder: false, purchasable: false, color: '#f4d27a' },
  { id: 'trail-golden-notes', name: '황금 음표', kind: 'trail', price: 0, assetPath: null, compatibleCharacterIds: ALL_CHARACTERS, rarity: 'rare', description: '업적으로 해금되는 황금빛 음표 궤적.', placeholder: false, purchasable: false, color: '#d8aa5d' },
  ...(['dawn', 'forest', 'mine', 'skyway'] as const).flatMap((world) => [
    { id: `${world}-no-hit-trail`, name: `${world} 무피격 궤적`, kind: 'trail' as const, price: 0, assetPath: null, compatibleCharacterIds: ALL_CHARACTERS, rarity: 'rare' as const, description: '스토리 스테이지 무피격 완주 보상.', placeholder: false, purchasable: false, color: '#b7a7ed' },
    { id: `${world}-coin-profile`, name: `${world} 코인 배지`, kind: 'profile' as const, price: 0, assetPath: null, compatibleCharacterIds: ALL_CHARACTERS, rarity: 'common' as const, description: '스토리 스테이지 코인 목표 달성 보상.', placeholder: false, purchasable: false, color: '#f2c76c' },
  ]),
  { id: 'profile-sky-crown', name: '하늘 왕관', kind: 'profile', price: 0, assetPath: null, compatibleCharacterIds: ALL_CHARACTERS, rarity: 'epic', description: '장거리 업적으로 해금되는 프로필 장식.', placeholder: false, purchasable: false, color: '#a9b9fa' },
  { id: 'profile-perfect-run', name: '완벽한 발자국', kind: 'profile', price: 0, assetPath: null, compatibleCharacterIds: ALL_CHARACTERS, rarity: 'rare', description: '무피격 업적으로 해금되는 프로필 장식.', placeholder: false, purchasable: false, color: '#f1a9ca' },
  { id: 'profile-starlight', name: '별빛 프로필', kind: 'profile', price: 150, assetPath: null, compatibleCharacterIds: ALL_CHARACTERS, rarity: 'common', description: '프로필에 작은 별빛 장식을 더합니다.', placeholder: false, purchasable: true, color: '#b5a4ec' },
  { id: 'skin-rin-winter', name: '린 · 눈꽃 메이드', kind: 'skin', price: 0, assetPath: '/assets/character/cosmetics/skins/player-default/winter-maid/', compatibleCharacterIds: ['player-default'], rarity: 'epic', description: '전체 동작 프레임 에셋을 기다리는 중입니다.', placeholder: true, purchasable: false, color: '#6f9fe4' },
  { id: 'skin-hiyori-sakura', name: '히요리 · 벚꽃 등불', kind: 'skin', price: 0, assetPath: '/assets/character/cosmetics/skins/hanayo-hiyori/sakura-lantern/', compatibleCharacterIds: ['hanayo-hiyori'], rarity: 'epic', description: '전체 동작 프레임 에셋을 기다리는 중입니다.', placeholder: true, purchasable: false, color: '#f1a9ca' },
  { id: 'skin-mary-moon', name: '메리 · 달빛 곰인형', kind: 'skin', price: 0, assetPath: '/assets/character/cosmetics/skins/tokino-mary/moon-bear/', compatibleCharacterIds: ['tokino-mary'], rarity: 'epic', description: '전체 동작 프레임 에셋을 기다리는 중입니다.', placeholder: true, purchasable: false, color: '#7b9e98' },
  { id: 'skin-toa-violet', name: '토아 · 보랏빛 교복', kind: 'skin', price: 0, assetPath: '/assets/character/cosmetics/skins/goth-student/violet-uniform/', compatibleCharacterIds: ['goth-student'], rarity: 'epic', description: '전체 동작 프레임 에셋을 기다리는 중입니다.', placeholder: true, purchasable: false, color: '#79559a' },
  { id: 'skin-rang-tiger', name: '랑 · 호랑이 축제', kind: 'skin', price: 0, assetPath: '/assets/character/cosmetics/skins/cogane-rang/tiger-festival/', compatibleCharacterIds: ['cogane-rang'], rarity: 'epic', description: '전체 동작 프레임 에셋을 기다리는 중입니다.', placeholder: true, purchasable: false, color: '#d29650' },
]);

const COSMETIC_BY_ID = new Map(COSMETICS.map((cosmetic) => [cosmetic.id, cosmetic]));

export function getCosmetic(id: string): CosmeticDefinition | undefined {
  return COSMETIC_BY_ID.get(id);
}
