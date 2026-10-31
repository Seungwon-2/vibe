import type { CharacterDefinition, CharacterAnimationName, CharacterFrameRef } from './characterTypes';

export type SkinAnimationManifest = Readonly<{
  frameSize: number;
  pivotY: number;
  animations: Partial<Readonly<Record<CharacterAnimationName, readonly CharacterFrameRef[]>>>;
}>;

const REQUIRED_SKIN_ANIMATIONS: readonly CharacterAnimationName[] = [
  'idle', 'run', 'jump', 'doubleJump', 'slide', 'hurt', 'victory', 'gameOver',
];

/** A skin cannot enter runtime unless its entire action set uses the base character's frame geometry. */
export function validateSkinAnimationManifest(
  character: CharacterDefinition,
  manifest: SkinAnimationManifest,
): { ok: true; animations: Readonly<Record<CharacterAnimationName, readonly CharacterFrameRef[]>> } | { ok: false; reason: string } {
  if (manifest.frameSize !== character.qualityFrameSize || manifest.pivotY !== character.qualityPivotY) {
    return { ok: false, reason: 'frame geometry does not match the base character' };
  }
  for (const animation of REQUIRED_SKIN_ANIMATIONS) {
    if (!manifest.animations[animation]?.length) return { ok: false, reason: `missing ${animation} frames` };
  }
  return {
    ok: true,
    animations: manifest.animations as Readonly<Record<CharacterAnimationName, readonly CharacterFrameRef[]>>,
  };
}
