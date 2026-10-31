# Task: T01 Cosmetic Catalog and Shop

## Status: done

## Goal

Implement a data-driven cosmetic shop for runner trails/effects, full character skins, and profile decorations with shared ownership and per-character equipment.

## Decision Summary

- Purchases are global; equipped runner visuals are chosen per character.
- Cosmetics do not change gameplay statistics. New playable characters are unlocked through Story, not the shop.
- User will supply skin/effect assets; infrastructure must support catalog placeholders.

## Implementation

### I01. Add catalog, purchase/equipment service, and shop screen

- Related Files:
  - src/services/CosmeticCatalog.ts :: CosmeticDefinition, COSMETICS, getCosmetic; new
  - src/services/CosmeticService.ts :: purchaseCosmetic, equipCosmetic, unequipCosmetic; new
  - src/app/screens/ShopScreen.tsx :: inventory, balance, buy/equip actions; new
  - src/App.tsx :: shop routes from Title and Character Select; modify
  - src/app/screens/MainMenu.tsx :: Shop action; modify
  - src/app/screens/CharacterSelect.tsx :: Shop action and character context; modify
  - src/services/CosmeticService.test.ts and ShopScreen.test.tsx; new

#### Details

- CosmeticDefinition fields: id, name, kind ('trail'|'skin'|'profile'), price, assetPath|null, compatibleCharacterIds, rarity, description, placeholder:boolean.
- Seed code-rendered trail/profile decoration catalog entries; skin entries may be locked placeholders until user-provided assets exist. Placeholders cannot be purchased unless an actual implementation exists.
- Default wallet and all rewards/prices are data-driven. Set price tiers so a common first item targets roughly 1–2 average Endless runs and rare items roughly 5–8; treat as initial tuning only.
- purchase validates known item, not already owned, affordable wallet, and grants ownership + deducts coins atomically.
- equip validates ownership and compatibility; per-character equipment map supports one selected trail, one skin, and one profile decoration. Equipping cosmetics never changes physics, hitboxes, ability values, speed, or ranking.
- Shop is reachable from Title and Character Select, with a back action returning to its entry screen.

## Acceptance Criteria

- [x] Wallet purchase validates balance and grants ownership exactly once.
- [x] Owned cosmetic can be equipped for one character without changing another character's loadout.
- [x] Shop handles missing future image assets with disabled placeholders.

## Validation

- `npm run typecheck` — passed.
- `npm run build` — passed. Vite reports the existing large-chunk advisory.
- Vitest was not run per session instruction not to run tests unless requested.

## Commit Message

    feat(shop): add cosmetic shop and loadouts

    Plan: 2026-10-30-runner-modes-progression
    Phase: P04-cosmetic-shop
    Task: T01-cosmetic-catalog-shop

    - Add a tunable cosmetic catalog and local coin purchases
    - Equip cosmetics independently for each character

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: `feat(shop): add cosmetic shop and loadouts`
