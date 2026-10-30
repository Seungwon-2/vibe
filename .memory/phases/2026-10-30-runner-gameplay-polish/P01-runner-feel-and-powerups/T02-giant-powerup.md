# Task: T02 Giant Power-Up

## Status: done

## Goal

Add a visible, timed giant item that automatically lets the runner pass through ordinary obstacles while keeping the player hitbox unchanged and pits lethal.

## Decision Summary

- Giant effect lasts 4,000ms, refreshes to 4,000ms if collected while active, and does not stack.
- Use the authored giant targets `waveStart + 1,000m`: first at 3,000m and then every 1,360m. Search a ±180m window for a legal pickup location that avoids hazards, pits, gates, and another pickup. Skip if none is safe.
- Giant removes ordinary obstacle penalties while active. It does not protect against a pit, timer expiry, or any finish condition.
- Enlarge the visual sprite by 1.25× while inversely scaling the Arcade body source size and offset so its world collision dimensions remain unchanged. Add a visible gold aura and a HUD countdown.

## Implementation

### I01. Schedule and render a safe giant pickup

- Related Files:
  - `src/game/runner/runnerTypes.ts` :: `RunnerPickupKind`, `RunnerSnapshot`; modify
  - `src/game/runner/runnerConfig.ts` :: giant duration and pickup cadence constants; modify
  - `src/game/runner/CollectibleSpawner.ts` :: `drawPickupArt`, `generatePickupSchedule`, `PickupDefinition`, `spawnPickup`; modify
  - `src/game/runner/CollectibleSpawner.test.ts` :: schedule safety and giant artwork tests; modify

#### Details

- Add `'giant'` to `RunnerPickupKind` and `giantRemainingMs: number` to `RunnerSnapshot`.
- Add config fields `giantDurationMs: 4_000`, `giantPickupFirstDistanceMeters: 3_000`, `giantPickupSpacingMeters: 1_360`, and `giantPickupSearchRadiusMeters: 180`.
- In `generatePickupSchedule(maxDistanceMeters)`, generate giant targets `first + n * spacing` through the requested maximum. For each target, search integer-meter candidates nearest-first within the configured radius. Reuse `isPickupDistanceSafe` for hazard-art/collider/pit/gate clearance, and reject candidates within 30m of any already scheduled pickup so the art and sensors do not crowd each other. A 100m exclusion leaves no positions because existing safe coins are spaced about 125m apart. Add `{ id: 'giant-N', kind: 'giant', distanceMeters, heightUnits: 52, optionalJump: false }`; omit it if no safe candidate exists.
- Preserve existing time-pickup slots, coin counts where safe placement permits, optional jump coins, and deterministic sorting. A giant pickup must never share a distance with a coin/time pickup.
- Extend `drawPickupArt` with a distinct biome-aware golden/star silhouette for `giant`; do not treat every non-coin item as a time item.
- Continue creating the item sensor as a circle with the selected character's current pickup radius. Giant pickup art remains decorative; collision geometry remains code-owned.

### I02. Apply the timed obstacle-breaking effect and preserve collision boxes

- Related Files:
  - `src/game/runner/RunnerSimulation.ts` :: `createRunnerSnapshot`, `advanceSegment`, stagger advancement, `collectPickup`, `applyCollision`; modify
  - `src/game/runner/CollisionSystem.ts` :: `tryResolveHazardHit`; read/modify only if a new result distinction is required
  - `src/game/runner/RunnerPlayer.ts` :: `RunnerPlayer.setGiant`, `applyPose`; modify
  - `src/game/runner/RunnerScene.ts` :: pickup activation and player effect update; modify
  - `src/game/runner/RunnerSimulation.test.ts` :: activation, refresh, timer, and collision cases; modify
  - `src/game/runner/RunnerPlayer.test.ts` :: visual scale does not alter physical dimensions; modify

#### Details

- Initialize `giantRemainingMs` to `0`; decay it by active `deltaMs` in both normal movement and stagger/frozen-course advancement. Paused/countdown/finished time must not consume it.
- On a unique `giant` pickup, set `giantRemainingMs` to `RUNNER_CONFIG.giantDurationMs`. Recollecting while active refreshes to the same duration. Do not change timer, coins, or distance.
- `applyCollision` returns the unchanged snapshot while `giantRemainingMs > 0`; the `ObstacleSpawner` will still remove the passed obstacle after overlap. `applyPitFall` stays unchanged, so giant does not save the player from a pit.
- Add `RunnerPlayer.setGiant(active: boolean)` and keep the visual scale as part of pose composition: standing scales `(1.25, 1.25)`, slide scales `pose.scaleX * 1.25` and `pose.scaleY * 1.25`. Divide the source-body width, height, and offsets by 1.25 while active so the effective world body remains identical. Restore the original body sizes/offsets and pose scale when the effect ends. Avoid repeatedly rescaling if the active state did not change.
- Apply a gold visual cue without replacing Hiyori's or Toa's passive state logic; use a separate scene effect graphic if a tint would conflict.
- Update player state from the snapshot every scene frame. Ensure the effect is removed on pit rescue/fall, finish, and scene cleanup without changing pit behavior.

### I03. Surface giant state and pickup feedback in the running UI

- Related Files:
  - `src/app/components/RunnerHud.tsx` :: giant status display; modify
  - `src/app/components/RunnerHud.test.tsx` :: active/expired giant status; modify
  - `src/app/screens/RunScreen.tsx` :: giant pickup feedback; modify
  - `src/app/screens/RunScreen.test.tsx` :: giant pickup cue and existing sound flow; modify
  - `src/styles/global.css` :: `.runner-hud__powerup`; modify

#### Details

- When `snapshot.giantRemainingMs > 0`, show a compact, accessible `거대화 · N초` HUD status using `Math.ceil(giantRemainingMs / 1000)` and a gold star icon/text. Hide it at zero.
- Show an approximately 1,200ms pickup cue when the giant item is collected, without showing a misleading `+N초` value. Reuse the existing time-pickup sound only if it is already used by pickup feedback; do not add/generated audio files.
- Keep the selected character passive indicator and Hiyori shield counter visible alongside the power-up status at mobile and desktop sizes.

## Acceptance Criteria

- [x] Giant items are scheduled deterministically only at safe non-overlapping locations.
- [x] Giant lasts and refreshes to four seconds; course pause does not consume its timer.
- [x] Ordinary obstacle collisions have no penalty during giant; pits remain fatal.
- [x] The enlarged art is visible while physical collision dimensions remain equal to the non-giant pose.
- [x] HUD and pickup cue identify giant and show its remaining duration without changing coins or timer.

## Validation

- `npm run test -- src/game/runner/CollectibleSpawner.test.ts src/game/runner/RunnerSimulation.test.ts src/game/runner/CollisionSystem.test.ts src/game/runner/RunnerPlayer.test.ts src/app/components/RunnerHud.test.tsx src/app/screens/RunScreen.test.tsx`
- `npm run build`

## Commit Message

```text
feat(runner): add a pit-safe giant power-up

Plan: 2026-10-30-runner-gameplay-polish
Phase: P01-runner-feel-and-powerups
Task: T02-giant-powerup

- Schedule a themed giant pickup on safe recovery lanes
- Add a four-second obstacle-breaking effect with fixed collision geometry
- Show pickup and remaining-time feedback in the HUD
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm run test -- src/game/runner/CollectibleSpawner.test.ts src/game/runner/RunnerSimulation.test.ts src/game/runner/CollisionSystem.test.ts src/game/runner/RunnerPlayer.test.ts src/app/components/RunnerHud.test.tsx src/app/screens/RunScreen.test.tsx`; `npm run build`)
- commit: task commit created on `project02`
