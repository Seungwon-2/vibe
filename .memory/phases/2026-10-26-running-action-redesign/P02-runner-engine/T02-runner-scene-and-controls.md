# Task: T02 Runner Scene and Controls

## Status: pending

## Goal

Create the Phaser runner scene and fixed-position player, with keyboard and React touch input for one jump, one mid-air jump, and held sliding.

## Decision Summary

- Phaser canvas is 960x540 with pixel-art rendering and FIT scaling. Player is fixed near x=170 while hazards move left.
- World gravity is 900 units/s²; ground jump impulse is -420 units/s. Player body is bottom-aligned and changes from 40x76 standing to 40x40 sliding.

## Implementation

### I01. Add Phaser host and game config

- Related Files:
  - `package.json` :: add `phaser: ^3.90.0`; modify.
  - `package-lock.json` :: update; modify.
  - `src/game/runner/createRunnerGameConfig.ts` :: `createRunnerGameConfig(parent, characterId, inputBridge, callbacks)`; new.
  - `src/game/runner/RunnerGame.tsx` :: React lifecycle wrapper; new.
  - `src/game/runner/RunnerScene.ts` :: scene registration and lifecycle; new.
  - `src/game/runner/RunnerGame.test.tsx` :: mount/unmount and error handling; new.

#### Details

- `createRunnerGameConfig` returns `Phaser.Types.Core.GameConfig` with `type: Phaser.AUTO`, parent element, width 960, height 540, background `#10152d`, `pixelArt: true`, `antialias: false`, `roundPixels: true`, scale `Phaser.Scale.FIT` + `CENTER_BOTH`, Arcade physics gravity `{x:0,y:900}`, and only `RunnerScene`.
- Set registry values for `characterId`, `inputBridge`, `onSnapshot`, and `onFinished` in `callbacks.preBoot`.
- `RunnerGameProps = { characterId: CharacterId; inputBridge: RunnerInputBridge; paused: boolean; onSnapshot(snapshot: RunnerSnapshot): void; onFinished(result: RunnerResult): void }`.
- Create Phaser in `useEffect`; destroy on unmount; keep latest React callbacks in a ref so scene events do not close over stale props. On `paused`, pause/resume the `RunnerScene` without reconstructing the game.
- Catch game-construction and asset-load failures and render a visible `role='alert'` error with a retry path; do not leave a blank canvas.

### I02. Implement player and input bridge

- Related Files:
  - `src/game/runner/RunnerInput.ts` :: `RunnerAction`, `RunnerInputState`, `RunnerInputBridge`; new.
  - `src/game/runner/RunnerPlayer.ts` :: `RunnerPlayer` movement/action controller; new.
  - `src/game/runner/RunnerScene.ts` :: keyboard bindings and player updates; modify.
  - `src/game/runner/RunnerPlayer.test.ts` :: jump/slide/passive tests; new.

#### Details

- `RunnerInputBridge` has `press(action: 'jump' | 'slide')`, `release(action: 'jump' | 'slide')`, `consumeFrame(): RunnerInputState`, and `clear(): void`. Touch controls and keyboard actions enter the same bridge.
- Bind Space and ArrowUp to a jump edge; ArrowDown is held slide. Prevent Space/Arrow scroll defaults only while the run screen is active. Clear bridge state on pause, finish, blur, and unmount.
- Place player body at x=170 and ground bottom y=470 on the 960x540 design canvas. Actor stays at this x; no horizontal movement or platform collision system is used.
- Ground jump applies -420 impulse. Permit one second jump while airborne, then disable until Arcade reports grounded. Yuni's second jump impulse is `-420 * 1.12`; other characters use -420. Play `jump`/`doubleJump` atlas animations respectively.
- Start and held slide require grounded state. While held, set body to 40x40 with bottom edge anchored to the standing body's floor. On release, restore 40x76; Toa retains the crouched collision pose for 150ms after input release, then restores standing dimensions.
- Animation state priority is `hurt` > `slide` > `doubleJump` > `jump` > `run`. During normal auto-run, loop `run` at 12.5fps (80ms per frame), matching the character selector. Lift only the displayed sprite by about 8px on wide-stride frames 0/2; keep the physics body on the ground so obstacle collisions remain accurate.
- `RunnerPlayer` exposes `jump(): boolean`, `setSliding(held: boolean): void`, `update(deltaMs: number): void`, and `destroy(): void`.

## Acceptance Criteria

- [ ] Phaser canvas mounts once and is destroyed on React unmount; pause does not recreate it.
- [ ] Keyboard and touch use the same action bridge.
- [ ] Ground jump, one airborne jump, landing reset, held slide, Toa grace, and Yuni impulse modifier work.
- [ ] Standing and sliding body boxes remain bottom-aligned and fit 96x96 frames.
- [ ] No sideways player control or stage/platform dependency remains.

## Validation

- `npm test -- src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerGame.test.tsx` — validates movement and Phaser wrapper lifecycle.
- `npm run typecheck` — validates Phaser APIs and component callbacks.
- `npm run build` — confirms Vite bundles Phaser assets.

## Commit Message

```text
feat(runner): add Phaser auto-runner and action controls

Plan: 2026-10-26-running-action-redesign
Phase: P02-runner-engine
Task: T02-runner-scene-and-controls

- Mount a 960x540 Phaser runner with a fixed player position
- Support keyboard/touch jump, double jump, and held slide
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
