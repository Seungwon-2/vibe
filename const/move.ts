export const MOVE_DAMAGE_CLASSES = ['physical', 'special', 'status'] as const;

export type MoveDamageClassKey = (typeof MOVE_DAMAGE_CLASSES)[number];

export const MOVE_DAMAGE_CLASS_LABELS: Record<MoveDamageClassKey, string> = {
  physical: '물리',
  special: '특수',
  status: '변화',
};

export const MOVE_DAMAGE_CLASS_STYLES: Record<MoveDamageClassKey, string> = {
  physical: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
  special: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
  status: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
};

export const MOVE_TARGET_LABELS: Record<string, string> = {
  'selected-pokemon': '상대 1마리',
  user: '자신',
  'users-field': '아군 필드',
  'opponents-field': '상대 필드',
  'entire-field': '전체 필드',
  'all-opponents': '상대 전체',
  'user-or-ally': '자신 또는 아군',
  ally: '아군 1마리',
  'random-opponent': '랜덤 상대',
  'all-other-pokemon': '자신 제외 전체',
  'all-pokemon': '전체 포켓몬',
  'specific-move': '특수 대상',
  'selected-pokemon-me-first': '선공 대상',
};

const GENERATION_LABELS: Record<string, string> = {
  'generation-i': '1세대',
  'generation-ii': '2세대',
  'generation-iii': '3세대',
  'generation-iv': '4세대',
  'generation-v': '5세대',
  'generation-vi': '6세대',
  'generation-vii': '7세대',
  'generation-viii': '8세대',
  'generation-ix': '9세대',
};

export function getMoveGenerationLabel(generationName?: string) {
  if (!generationName) return '-';
  return GENERATION_LABELS[generationName] ?? generationName;
}

export function getMoveTargetLabel(targetName?: string) {
  if (!targetName) return '-';
  return MOVE_TARGET_LABELS[targetName] ?? targetName.replace(/-/g, ' ');
}
