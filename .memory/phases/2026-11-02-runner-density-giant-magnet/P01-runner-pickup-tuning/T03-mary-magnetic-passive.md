# Task: T03 Mary's Magnetic Passive

## Status: done

## Goal
Replace Mary's +50% pickup-body expansion with a visible passive that pulls coins and time pickups toward her from within 150px over approximately 300ms in both modes, without changing runner physics or animation.

## Decision Summary
- The current Mary passive is `pickupRadiusMultiplier: 1.5`; remove the expanded pickup body and configure magnetic range and pull duration on the central passive definition.
- Mary attracts only `coin` and `time` pickups. Giant pickups remain touch-collected; all other characters keep ordinary touch collection.
- Attraction is available in Endless and Story. It uses a subtle sparkle trail and does not affect obstacle collision, jump, double-jump, slide, falling, or runner speed.

## Implementation

### I01. Replace passive schema and implement magnetic movement
- Related Files:
  - `src/game/characters/characterAbilities.ts` :: `CharacterPassiveDefinition`, `CHARACTER_PASSIVES['mary-pickup-magnet']` — modify.
  - `src/game/runner/CollectibleSpawner.ts` :: `getPickupBodySize`, `ActivePickup`, `CollectibleSpawner.update`, `spawnPickup`, `removePickup` — modify.
  - `src/game/runner/RunnerScene.ts` :: `update` — pass frame delta into collectible update.
  - `src/game/runner/runnerConfig.ts` — read-only; no additional global duplicate values, because range and duration live on Mary's passive.

#### Details
- **Signatures & Types**:
  ```ts
  type MaryPickupMagnet = Readonly<{
    id: 'mary-pickup-magnet';
    magnetRadiusPx: 150;
    magnetPullDurationMs: 300;
    name: string;
    icon: 'mary-music-magnet';
    effectLabel: string;
  }>;

  CollectibleSpawner.update(snapshot: RunnerSnapshot, deltaMs?: number): void
  ```
  `RunnerScene.update` calls `this.collectibles.update(state, deltaMs)`.
- **Data & Schema Fields**:
  - Change `CharacterPassiveDefinition`'s Mary variant from `pickupRadiusMultiplier` to `magnetRadiusPx` and `magnetPullDurationMs`.
  - Keep the passive ID/name/icon; show a Korean effect label that states coins and time items are attracted within 150px.
  - `getPickupBodySize` returns the standard 64px body diameter for every character, since the previous `+50%` expanded body is replaced by attraction.
  - Extend `ActivePickup` with a per-instance attraction flag, elapsed attraction time, and an optional sparkle Graphics object. Destroy the effect in `removePickup`.
- **Execution Flow / Logic**:
  1. In `CollectibleSpawner.update`, compute each pickup's normal projected screen position from its authored distance before magnet movement.
  2. Only when `characterId` resolves to `mary-pickup-magnet` and `kind` is `coin` or `time`, measure Euclidean distance between that pickup position and the player's current sprite center. Start attraction at `distance <= 150` scene pixels; attraction continues once started.
  3. Interpolate the pickup's display and Arcade body position toward the player's current center over 300ms using clamped non-negative `deltaMs` and an ease-out curve. Account for the base projected x changing as the course scrolls, so the magnetized pickup does not drift backward. Once the interval completes, keep it at the player center until the existing overlap callback collects it.
  4. Draw a subtle lavender/white sparkle trail between a magnetized item and the player. It is cosmetic and must not create a physics body or modify pickup definition distance/ID.
  5. Keep item overlap callback deferral unchanged. Do not reset player pose or action when the pickup is collected.
  6. Do not attract giant pickups; Mary collects them only through the existing overlap behavior. Non-Mary players never start the attraction effect.
- **Error & Exception Handling**: Clamp frame delta to `[0, magnetPullDurationMs]`; tolerate `deltaMs` being omitted by existing direct spawner tests; destroy sparkle Graphics with its pickup; keep duplicate overlap protection and deferred body destruction intact.

### I02. Verify passive scope and motion isolation
- Related Files:
  - `src/game/characters/characterAbilities.test.ts` :: central passive values — update.
  - `src/game/characters/characterRegistry.test.ts` :: passive registry expectations — update.
  - `src/game/runner/CollectibleSpawner.test.ts` :: pickup body size, attraction range/scope, time/coin movement, and cleanup — update.
  - `src/game/runner/RunnerScene.test.ts` :: spawner receives update delta — update if covered by scene tests.
- **Details**:
  - Assert all character pickup bodies are 64px; Mary config is exactly 150px/300ms.
  - Assert Mary attracts coin and time when their center is within 150px, does not start outside the range, and reaches the player's moving target within 300ms at typical frame deltas.
  - Assert giant pickup is not attracted; non-Mary characters never attract coin or time.
  - Assert attraction doesn't mutate pickup schedule IDs/distances or runner snapshot/action state; sparkle art creates no Arcade body and is destroyed on pickup removal.
  - Keep existing elevated-pickup reachability, hazard/pit/gate clearance, and schedule tests passing.

## Acceptance Criteria
- [x] Mary's old +50% pickup-body expansion is replaced by a visible 150px magnet effect.
- [x] Coins and time items move toward Mary over about 300ms in Endless and Story; giant pickups and other characters are unchanged.
- [x] Magnet effect is cosmetic except for the already-defined pickup overlap; runner animations, physics, and obstacle collision remain unchanged.
- [x] Attraction boundaries, cleanup, schedule clearance, and existing pickup callback behavior pass tests.

## Validation
- `npm test -- src/game/characters/characterAbilities.test.ts src/game/characters/characterRegistry.test.ts src/game/runner/CollectibleSpawner.test.ts src/game/runner/RunnerScene.test.ts`
- `npm run typecheck`
- `npm run build`

## Commit Message
```text
feat(game): add magnetic pickup passive for mary

Plan: 2026-11-02-runner-density-giant-magnet
Phase: P01-runner-pickup-tuning
Task: T03-mary-magnetic-passive

- Pull coins and time pickups toward Mary within 150px
- Replace pickup-radius expansion without changing runner physics
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`29 tests`, `typecheck`, `build`)
- commit: `0894450`
