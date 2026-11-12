# Task: T03 Locked Character Cosmetics

## Status: done

## Goal
Prevent selecting a locked character in the cosmetic shop and reject attempts to equip cosmetics to a locked character at the service boundary.

## Decision Summary
- The source of truth is `PlayerProfile.unlockedCharacterIds`.
- Preserve existing saved loadouts; do not erase loadouts for locked characters.

## Implementation

### I01. Restrict the shop character picker and normalize its initial selection
- Related Files:
  - `src/app/screens/ShopScreen.tsx` :: `ShopScreen`, `characterId` state, `shop-toolbar`; modify.

#### Details
- **Data & Schema Fields**: Use existing `PlayerProfile.unlockedCharacterIds: readonly CharacterId[]`; do not change profile schema or migration version.
- **Execution Flow / Logic**:
  1. Derive `unlockedCharacters = CHARACTERS.filter(character => profile.unlockedCharacterIds.includes(character.id))`.
  2. Select `initialCharacterId` only if it is unlocked; otherwise select the first unlocked character.
  3. Keep controlled selector state valid if profile changes while the screen is open; if selection becomes locked, select the first unlocked character.
  4. Render options only from `unlockedCharacters`. Keep current cosmetic inventory rules unchanged.
  5. If the profile contains no unlocked character due to invalid/corrupt data, disable equip/unequip controls and show a localized safe message.
- **Types**: `characterId` remains `CharacterId`; accept selector event values only if present in `profile.unlockedCharacterIds`.

### I02. Enforce unlock state in the service layer
- Related Files:
  - `src/services/CosmeticService.ts` :: `CosmeticActionResult`, `equipCosmetic`, `unequipCosmetic`; modify.
  - `src/services/CosmeticService.test.ts` :: locked-character cases; new.

#### Details
- Extend `CosmeticActionResult['reason']` with `'character-locked'`.
- Before checking ownership/compatibility or mutating the profile in `equipCosmetic`, verify `profileStore.load().unlockedCharacterIds.includes(characterId)`. If false, return `{ ok: false, reason: 'character-locked' }` without calling `update`.
- Keep `unequipCosmetic` able to remove an existing equipped item by explicit ID/category for backward compatibility; the UI does not offer locked characters as a target. Do not delete locked-character loadouts during profile load.
- Test locked equip rejection and unchanged profile, unlocked compatible equip, and unchanged ownership/compatibility behavior.

### I03. Cover shop affordances
- Related Files:
  - `src/app/screens/ShopScreen.test.tsx` :: locked and unlocked picker options; new.

#### Details
- Create a profile with starter unlocks plus one locked character; assert locked character is absent from `<select>` options.
- Pass a locked `initialCharacterId`; assert the first unlocked character is selected and shown in the loadout label.
- Verify selecting an unlocked character and equipping a compatible cosmetic still works.

## Acceptance Criteria
- [x] Locked characters are not selectable in the shop.
- [x] Service calls cannot equip items for locked characters, even if called outside the screen.
- [x] Existing loadouts and unlocked-character shop behavior are preserved.

## Validation
- `npm test -- src/services/CosmeticService.test.ts src/app/screens/ShopScreen.test.tsx`
- `npm run typecheck`
- `npm run lint`

## Commit Message
```text
fix(shop): prevent cosmetic loadouts for locked runners

Plan: 2026-11-12-p0-feedback-recovery
Phase: P01-critical-flow-guards
Task: T03-locked-character-cosmetics

- Filter shop character choices by profile unlocks
- Enforce unlock checks before cosmetic equip mutations
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`npm test -- src/services/CosmeticService.test.ts src/app/screens/ShopScreen.test.tsx`, `npm run typecheck`, `npm run lint`)
- commit: `2cc9333`
