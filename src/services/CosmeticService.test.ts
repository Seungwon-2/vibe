import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PLAYER_PROFILE, LocalPlayerProfileStore } from './LocalPlayerProfileStore';
import { equipCosmetic } from './CosmeticService';

describe('equipCosmetic', () => {
  it('rejects locked characters without changing the profile', () => {
    const store = new LocalPlayerProfileStore(null);
    store.save({ ...DEFAULT_PLAYER_PROFILE, unlockedCosmeticIds: ['trail-cloud'] });
    const before = store.load();
    const update = vi.spyOn(store, 'update');

    expect(equipCosmetic(store, 'goth-student', 'trail-cloud')).toEqual({ ok: false, reason: 'character-locked' });
    expect(store.load()).toEqual(before);
    expect(update).not.toHaveBeenCalled();
  });

  it('still equips an owned cosmetic to an unlocked compatible character', () => {
    const store = new LocalPlayerProfileStore(null);
    store.save({ ...DEFAULT_PLAYER_PROFILE, unlockedCosmeticIds: ['trail-cloud'] });

    expect(equipCosmetic(store, 'player-default', 'trail-cloud')).toEqual({ ok: true });
    expect(store.load().equippedCosmeticIdsByCharacter['player-default']).toContain('trail-cloud');
  });

  it('preserves ownership and compatibility checks for unlocked characters', () => {
    const store = new LocalPlayerProfileStore(null);

    expect(equipCosmetic(store, 'player-default', 'trail-cloud')).toEqual({ ok: false, reason: 'not-owned' });
    store.save({ ...DEFAULT_PLAYER_PROFILE, unlockedCosmeticIds: ['skin-rin-winter'] });
    expect(equipCosmetic(store, 'player-default', 'skin-rin-winter')).toEqual({ ok: false, reason: 'unavailable' });
  });
});
