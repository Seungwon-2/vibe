import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PLAYER_PROFILE } from '../../services/LocalPlayerProfileStore';
import { ShopScreen } from './ShopScreen';

describe('ShopScreen character unlocks', () => {
  it('omits locked characters and falls back from a locked initial selection', () => {
    const { container } = render(<ShopScreen
      profile={{ ...DEFAULT_PLAYER_PROFILE, unlockedCosmeticIds: ['trail-cloud'] }}
      initialCharacterId="goth-student"
      onBack={vi.fn()}
      onPurchase={vi.fn()}
      onEquip={vi.fn()}
      onUnequip={vi.fn()}
    />);

    const picker = container.querySelector('.shop-toolbar select')!;
    expect(picker).toHaveValue('player-default');
    expect([...picker.querySelectorAll('option')].map((option) => option.value)).toContain('hanayo-hiyori');
    expect([...picker.querySelectorAll('option')].map((option) => option.value)).not.toContain('goth-student');
    expect([...picker.querySelectorAll('option')].map((option) => option.value)).not.toContain('cogane-rang');
  });

  it('allows equipping an owned cosmetic to an unlocked character', () => {
    const onEquip = vi.fn(() => true);
    const { container } = render(<ShopScreen
      profile={{ ...DEFAULT_PLAYER_PROFILE, unlockedCosmeticIds: ['trail-cloud'] }}
      initialCharacterId="player-default"
      onBack={vi.fn()}
      onPurchase={vi.fn()}
      onEquip={onEquip}
      onUnequip={vi.fn()}
    />);

    fireEvent.change(container.querySelector('.shop-toolbar select')!, { target: { value: 'hanayo-hiyori' } });
    const ownedItem = container.querySelector('.shop-item');
    const equipButton = ownedItem?.querySelector('button');
    expect(equipButton).not.toBeNull();
    fireEvent.click(equipButton!);
    expect(onEquip).toHaveBeenCalledWith('hanayo-hiyori', 'trail-cloud');
  });
});
