# Task: T02 Giant Pickup Art

## Status: done

## Goal
Make giant pickups immediately distinguishable from standard coins by giving them a non-circular purple-and-pink comet/star silhouette with a bright outline.

## Decision Summary
- Standard coins remain round and gold-toned using the existing biome coin palette.
- Giant pickups use a large pointed star/comet shape in purple and pink with a light outline; remove their coin-like circle body and gold fill.
- Pickup type, schedule, duration, collision geometry, and giant gameplay effect do not change.

## Implementation

### I01. Separate giant pickup drawing from coin drawing
- Related Files:
  - `src/game/runner/CollectibleSpawner.ts` :: `drawPickupArt` giant branch — modify.
  - `src/game/runner/CollectibleSpawner.test.ts` :: `themed pickup art` tests — update.

#### Details
- **Signatures & Types**:
  ```ts
  drawPickupArt(art: Phaser.GameObjects.Graphics, kind: RunnerPickupKind,
    biome: ReturnType<typeof getBiomeForDistance>): void
  ```
  Keep the signature and caller unchanged.
- **Data & Schema Fields**:
  - Use stable visual constants in `CollectibleSpawner.ts`: primary purple `0x9b5de5`, secondary pink `0xff77b7`, outline `0xffffff`.
  - Use Phaser Graphics triangle/line primitives already supported by the existing drawing code; do not add image assets or dependencies.
- **Execution Flow / Logic**:
  1. Keep the existing standard coin branch and all four biome coin palettes unchanged.
  2. Replace the giant branch's 11px gold circle with a prominent four-point comet/star silhouette, purple body, pink inner highlight/tail, and bright outline.
  3. Keep the icon's visual bounds larger than the coin icon so it reads as a power pickup. Keep its existing centered origin.
  4. Do not alter `PickupDefinition`, `spawnPickup`, the giant schedule, the 6s effect, or collectible collision body.
- **Error & Exception Handling**: Keep drawing inside the supplied Graphics instance; return immediately after giant art is drawn so it cannot fall through to the time-item branch.

### I02. Verify icon distinction
- Related Files:
  - `src/game/runner/CollectibleSpawner.test.ts` :: themed pickup-art tests — modify.
- **Details**:
  - Assert giant art does not call `fillCircle`/`strokeCircle` as a coin-like base and uses the purple/pink constants, bright outline, and star/comet primitives.
  - Assert standard coins still use their biome palette circle and existing outline.
  - Assert the time-item diamond rendering remains unchanged.

## Acceptance Criteria
- [x] Giant pickup no longer resembles a gold circular coin.
- [x] The purple/pink comet/star with light outline reads clearly in all four biomes.
- [x] Coin and time pickup rendering and all gameplay behavior remain unchanged.

## Validation
- `npm test -- src/game/runner/CollectibleSpawner.test.ts`
- `npm run typecheck`

## Commit Message
```text
feat(game): distinguish giant pickup art

Plan: 2026-11-02-runner-density-giant-magnet
Phase: P01-runner-pickup-tuning
Task: T02-giant-pickup-art

- Replace the gold circle with a purple and pink comet-star
- Preserve coin, time, and giant gameplay behavior
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
