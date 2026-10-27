# Task: T01 Preserve Pit Art Through Fall

## Status: done

## Goal

Keep the contacted fatal pit visible while the player falls for 700ms, the camera shakes for 250ms, and the game transitions to the result screen, without leaving an active overlap body behind.

## Decision Summary

- Split the pit's visual lifetime from its Arcade overlap zone lifetime.
- A fatal fall keeps the pit art until `PitSpawner.destroy()` runs during scene shutdown; an airborne pass or Hiyori rescue still removes the pit normally.

## Implementation

### I01. Separate resolved pit visuals from the sensor

- Related Files:
  - `src/game/runner/PitSpawner.ts` :: `ActivePit`, `PitSpawner.update`, `PitSpawner.spawn`, `PitSpawner.remove` — track retained fatal-pit art and destroy the sensor independently; modify
  - `src/game/runner/RunnerScene.ts` :: `handlePitFall`, `cleanup` — report whether the contact starts a fatal fall; modify

#### Details

- **Signatures & Types**:
  ```typescript
  type PitFallContactResult = 'fatal' | 'rescued' | 'ignored';
  type ActivePit = {
    definition: PitDefinition;
    zone: Phaser.GameObjects.Rectangle | null;
    art: Phaser.GameObjects.Graphics;
    warning: Phaser.GameObjects.Text | null;
    resolved: boolean;
    retainArtUntilDestroy: boolean;
  };
  type OnPitFall = (pit: PitDefinition) => PitFallContactResult;
  ```
  Use an equivalent boolean only if fatal remains distinguishable from rescue and ignored contact.
- The pit callback receives `PitDefinition`. `RunnerScene.handlePitFall` returns fatal only after `tryResolvePitFall` produces a result and the 700ms tween starts; return rescued after starting Hiyori's rescue; return ignored for stale or non-running contacts.
- In the overlap callback, mark the pit resolved once, defer work out of the Arcade iteration as today, and confirm the pit remains active before acting.
- For fatal contact, destroy and null the zone and warning immediately, keep the art at its frozen world position, and set `retainArtUntilDestroy`. `update` must not reposition or remove resolved retained art.
- For a rescued contact, destroy zone, art, and warning after starting the rescue. For airborne contact, do not call `onPitFall`; remove all pit objects as today.
- Make `remove` and `destroy` idempotent and tolerate a null zone. Scene cleanup destroys retained pit art after the result transition unmounts the game.
- Do not alter pit dimensions, warning visibility, fall/shake durations, result eligibility, or Hiyori's rescue animation.

### I02. Add pit lifecycle regression coverage

- Related Files:
  - `src/game/runner/PitSpawner.test.ts` :: `PitSpawner` lifecycle tests — assert fatal retention and safe cleanup; modify
  - `src/game/runner/RunnerScene.test.ts` :: `handlePitFall` tests — verify callback outcomes; modify

#### Details

- Assert grounded fatal contact calls the handler once, destroys the overlap zone, and does not destroy or move the graphics through later updates.
- Assert airborne contact does not call the handler and destroys zone/art/warning.
- Assert Hiyori rescue does not retain pit art.
- Assert `destroy()` removes retained fatal art once and repeated cleanup does not throw.
- Keep existing Hiyori/fatal result simulation assertions unchanged.

## Acceptance Criteria

- [ ] Fatal pit art remains visible and stationary through the 700ms fall and 250ms shake until scene shutdown.
- [ ] No pit collision zone remains active after first contact.
- [ ] Airborne and guarded contacts still clean up normally; duplicate contacts cannot start another fall.

## Validation

- `npm run test -- src/game/runner/PitSpawner.test.ts src/game/runner/RunnerScene.test.ts` — focused lifecycle tests pass.
- `npm run typecheck` — callback results and nullable sensor type compile.

## Commit Message

```text
fix(runner): keep pit art visible through fall result

Plan: 2026-10-27-runner-object-tutorial-polish
Phase: P01-runner-presentation
Task: T01-pit-art-lifecycle

- Separate pit art cleanup from collision sensor cleanup
- Preserve fatal pit art through the fall and camera shake
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending
