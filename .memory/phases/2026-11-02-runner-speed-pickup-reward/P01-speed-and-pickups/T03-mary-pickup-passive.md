# Task: T03 Mary Pickup Passive

## Status: pending

## Goal
Raise Tokino Mary's item collection radius passive from +35% to +50% while leaving all hazard hitboxes and other characters' pickup radii unchanged.

## Decision Summary
- `pickupRadiusMultiplier` is the central tuning value and currently equals 1.35.
- Use 1.5 for +50%; the regular 32px base radius therefore yields a 48px radius and an approximately 96px pickup body diameter.

## Implementation

### I01. Tune Mary's passive and displayed effect
- Related Files:
  - `src/game/characters/characterAbilities.ts` :: `CHARACTER_PASSIVES['mary-pickup-magnet']` — update multiplier and label.
  - `src/game/characters/characterAbilities.test.ts` :: passive tuning test — update.
  - `src/game/characters/characterRegistry.test.ts` :: expected passive map — update.
  - `src/game/runner/CollectibleSpawner.test.ts` :: pickup body radius test — update expected diameter.

#### Details
- **Data & Schema Fields**:
  - Set `pickupRadiusMultiplier: 1.5` and `effectLabel: '아이템 획득 범위 +50%'` for Mary's passive.
  - Keep passive id `mary-pickup-magnet`, name, icon, and all other character passives unchanged.
- **Execution Flow / Logic**:
  1. Keep `CollectibleSpawner.getPickupBodySize` as the only consumer of Mary's pickup multiplier.
  2. Expected `getPickupBodySize('tokino-mary')` becomes `96`; other characters stay `64`.
  3. Do not change `CollisionSystem`, player hazard bodies, or obstacle schedule.
- **Error & Exception Handling**: Keep multiplier centralized and finite; no migration is required because the value is not persisted.

### I02. Verify effect isolation
- Related Files:
  - `src/game/runner/CollectibleSpawner.test.ts` :: pickup-radius and upper-coin clearance tests.
- **Details**: Verify Mary radius increases, non-Mary stays unchanged, and elevated pickups still cannot be collected from a grounded standing position due solely to the enlarged pickup body.

## Acceptance Criteria
- [ ] Mary's UI effect reads +50% and her pickup body size is 96px.
- [ ] Other characters' pickup sizes and all obstacle collision tests remain unchanged.
- [ ] Elevated coin separation remains valid after the larger Mary radius.

## Validation
- `npm test -- src/game/characters/characterAbilities.test.ts src/game/characters/characterRegistry.test.ts src/game/runner/CollectibleSpawner.test.ts`
- `npm run typecheck`

## Commit Message
```text
feat(game): strengthen mary pickup magnet

Plan: 2026-11-02-runner-speed-pickup-reward
Phase: P01-speed-and-pickups
Task: T03-mary-pickup-passive

- Increase Mary's pickup radius bonus from 35 to 50 percent
- Keep hazard collision and other character radii unchanged
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
