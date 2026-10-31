import type { CharacterId } from '../game/characters/characterTypes';
import type { PlayerProfileStore } from './PlayerProfile';
import { getCosmetic } from './CosmeticCatalog';

export type CosmeticActionResult = Readonly<{ ok: boolean; reason?: 'unknown' | 'unavailable' | 'owned' | 'insufficient-funds' | 'not-owned' | 'incompatible' }>;

export function purchaseCosmetic(profileStore: PlayerProfileStore, cosmeticId: string): CosmeticActionResult {
  const cosmetic = getCosmetic(cosmeticId);
  if (!cosmetic) return { ok: false, reason: 'unknown' };
  if (!cosmetic.purchasable || cosmetic.placeholder) return { ok: false, reason: 'unavailable' };
  let reason: CosmeticActionResult['reason'];
  profileStore.update((profile) => {
    if (profile.unlockedCosmeticIds.includes(cosmeticId)) { reason = 'owned'; return profile; }
    if (profile.walletCoins < cosmetic.price) { reason = 'insufficient-funds'; return profile; }
    reason = undefined;
    return { ...profile, walletCoins: profile.walletCoins - cosmetic.price,
      unlockedCosmeticIds: [...profile.unlockedCosmeticIds, cosmeticId] };
  });
  return reason ? { ok: false, reason } : { ok: true };
}

export function equipCosmetic(profileStore: PlayerProfileStore, characterId: CharacterId, cosmeticId: string): CosmeticActionResult {
  const cosmetic = getCosmetic(cosmeticId);
  if (!cosmetic) return { ok: false, reason: 'unknown' };
  if (!profileStore.load().unlockedCosmeticIds.includes(cosmeticId)) return { ok: false, reason: 'not-owned' };
  if (!cosmetic.compatibleCharacterIds.includes(characterId)) return { ok: false, reason: 'incompatible' };
  profileStore.update((profile) => {
    const equipped = profile.equippedCosmeticIdsByCharacter[characterId] ?? [];
    const keepOtherKinds = equipped.filter((id) => getCosmetic(id)?.kind !== cosmetic.kind);
    return { ...profile, equippedCosmeticIdsByCharacter: {
      ...profile.equippedCosmeticIdsByCharacter, [characterId]: [...keepOtherKinds, cosmeticId],
    } };
  });
  return { ok: true };
}

export function unequipCosmetic(profileStore: PlayerProfileStore, characterId: CharacterId, kind: 'trail' | 'skin' | 'profile'): void {
  profileStore.update((profile) => ({
    ...profile,
    equippedCosmeticIdsByCharacter: {
      ...profile.equippedCosmeticIdsByCharacter,
      [characterId]: (profile.equippedCosmeticIdsByCharacter[characterId] ?? [])
        .filter((id) => getCosmetic(id)?.kind !== kind),
    },
  }));
}
