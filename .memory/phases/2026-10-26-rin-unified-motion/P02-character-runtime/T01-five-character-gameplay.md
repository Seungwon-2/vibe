# Task: T01 Five-Character Gameplay

## Status: done

## Goal

Replace the active four-character roster with Rin, Toa, Rang, Hiyori, and Mary and play the P01 atlases in the selector and runner. All five must select, start, run, jump twice, slide, and take damage without missing textures, broken types, clipped poses, or changing the code-owned jump/collision rules unintentionally.

## Decision Summary

- Keep Rin/Toa and remove Yuni/Lize from active imports and choices; old saved Yuni/Lize IDs fall back to Rin. Historical art files stay in Git.
- Preserve Rin's +1s time item and Toa's 150ms slide grace. Add centrally tunable Rang +8% second-jump impulse, Hiyori +20px pickup radius, Mary +250ms post-hit protection. The five atlases are 96×96 cells, 12 contiguous run frames in row 0, 60 frames/character.
- Play a short low-profile slide entry then hold one low frame. All gameplay jump heights, collision boxes, timers, and obstacle positions remain in code.

## Implementation

### I01. Replace registry, atlas imports, passive mapping, and selector roster

- Related Files:
  - `src/game/characters/characterTypes.ts` :: `CharacterId`, `CharacterAnimationName`, `CharacterDefinition`; modify.
  - `src/game/characters/characterAtlases.ts` :: `CHARACTER_ATLASES`; modify.
  - `src/game/characters/characterCatalog.ts` :: `ANIMATION_FRAME_SUFFIXES`, `createCharacter`, `CHARACTERS`, `getCharacter`, `resolveCharacterId`; modify.
  - `src/game/characters/characterAbilities.ts` :: `CharacterPassiveId`, `CharacterPassiveDefinition`, `CHARACTER_PASSIVES`, `CHARACTER_PASSIVE_BY_ID`, `getCharacterPassive`; modify.
  - `src/app/screens/CharacterSelect.tsx` :: `CharacterSelect`; modify only as needed to keep five cards usable and selection accessible.
  - `src/app/components/CharacterPreview.tsx` :: `CharacterPreview`; verify run-row CSS indexing, modify only if needed.
  - `src/styles/global.css` :: `.character-rail`, `.character-card`, narrow breakpoints; modify.
  - `src/game/characters/characterRegistry.test.ts`, `src/app/screens/CharacterSelect.test.tsx` :: roster/frame/selection tests; modify.

#### Details

- **Signatures & Types**:
  ```typescript
  type CharacterId = 'player-default' | 'goth-student' | 'cogane-rang' | 'hanayo-hiyori' | 'tokino-mary';
  type CharacterPassiveId = 'time-pickup' | 'slide-release-grace' | 'rang-second-jump' | 'hiyori-pickup-magnet' | 'mary-hit-protection';
  type CharacterPassiveDefinition =
    | Readonly<{id:'time-pickup';bonusMs:number}>
    | Readonly<{id:'slide-release-grace';graceMs:number}>
    | Readonly<{id:'rang-second-jump';multiplier:number}>
    | Readonly<{id:'hiyori-pickup-magnet';radiusPx:number}>
    | Readonly<{id:'mary-hit-protection';bonusMs:number}>;
  function resolveCharacterId(value: string | null | undefined): CharacterId;
  ```
- Initial values in the central frozen `CHARACTER_PASSIVES` object are `1000`, `150`, `1.08`, `20`, and `250` respectively. Keep numeric field types broad enough for later tuning without changing a type declaration.
- **Data & Schema Fields**:
  - `CHARACTERS` in this exact order: Rin (`player-default`, `#2b66c0`), Toa (`goth-student`, `#513661`), Rang (`cogane-rang`, `#c98743`), Hiyori (`hanayo-hiyori`, `#fca6d0`), Mary (`tokino-mary`, `#6d929a`). Import `runtime/{id}.png/.json` and `portraits/{slug}-portrait.png` for each. Rin/Toa keep their existing portrait files.
  - `CharacterAnimationName` remains `idle|run|jump|doubleJump|slide|hurt|start|victory|gameOver`; the catalog maps six source CRY frames through `game-over-*` to `gameOver` and six CHEER frames through `start-*` to `start`. Expected counts: run 12; each other category 6. Every frame is 96×96; manifest meta is 1152×480.
  - `CHARACTER_PASSIVE_BY_ID` maps one distinct ID per active character; remove active Yuni/Lize mappings. Keep all numeric tuning in `CHARACTER_PASSIVES`, never in components or scene branches.
- **Execution Flow / Logic**:
  1. Validate all five P01 manifests and local portrait paths import through Vite. The run frame list is ordered `00..11` and contiguous across atlas row 0 so `CharacterPreview`'s CSS `steps(12,end)` does not show another action.
  2. `resolveCharacterId('moonwing')`, `resolveCharacterId('akane-lize')`, unknown values, and null return `player-default`; `getCharacter` throws for removed/unknown IDs. Selection may not confirm a removed ID.
  3. Keep one selected card with `aria-pressed`, visible names, accent border, keyboard focus, selected run loop and unselected idle pose. At wide widths use five equal card columns; around 760–1000px use a wrapping 3+2 grid or scrollable rail with full card names; at <=760px keep a horizontal snap rail. The primary CTA stays visible/reachable at 1366×768, 844×390, 667×375, and 320px portrait. Do not implement the older plan's showcase redesign here.
  4. When a PNG/manifest is absent or malformed, fail build/validation rather than showing a silent empty character. Do not import Yuni/Lize atlases from active runtime files.

### I02. Connect motion actions and measured poses without letting art control physics

- Related Files:
  - `src/game/runner/RunnerScene.ts` :: `create`, `update`, `emitFinished`; modify animation registrations and slide/air-phase orchestration.
  - `src/game/runner/RunnerPlayer.ts` :: `jump`, `setSliding`, `setHurt`, `finish`, `update`, `applyPose`, `play`; modify.
  - `src/game/runner/runnerPose.ts` :: `SLIDE_FRAME_BOTTOM`, `getSlidePose`, standing/slide body constants; modify only measured art-alignment values.
  - `src/game/runner/CollectibleSpawner.ts` :: constructor, `spawnPickup`; modify collection body radius for Hiyori, not visible art or pickup schedule.
  - `src/game/runner/RunnerSimulation.ts` :: `applyCollision`, `collectPickup`; modify Mary protection branch and remove the retired Lize penalty branch; preserve pure result math otherwise.
  - `src/game/runner/CollisionSystem.ts` :: `getHazardGeometry`; change only if visual tests show overhead-bar mismatch, retaining a positive visible slide clearance.
  - `src/game/runner/RunnerPlayer.test.ts`, `runnerPose.test.ts`, `RunnerSimulation.test.ts`, `CollisionSystem.test.ts`, `RunnerEvents.test.ts`, `RunnerGame.test.tsx`, `src/app/screens/RunnerPreview.test.tsx` :: replace removed IDs and test new behaviors; modify.

#### Details

- **Signatures & Types**:
  ```typescript
  type RunnerAction = 'run'|'jump'|'doubleJump'|'slide'|'hurt'|'victory'|'gameOver';
  type AirPhase = 'ascending'|'descending';
  // P02-T02 will pass the final outcome; this task may default to gameOver.
  finish(outcome?: 'victory'|'gameOver'): void;
  getSlidePose(characterId: CharacterId): {key:string;spriteY:number;scaleX:number;scaleY:number;sourceBodyWidth:number;sourceBodyHeight:number;offsetX:number;offsetY:number};
  ```
- **Data & Schema Fields**:
  - Phaser keys `${characterId}:run`, `:jump`, `:jump-fall`, `:doubleJump`, `:double-jump-fall`, `:slide`, `:hurt`, `:victory`, `:gameOver`. Use run frames 00–11 at 12/0.768 fps with repeat `-1`; entry jump/double-jump frames 00–03 and falling frames 04–05; hurt/victory/gameOver all six at 12 fps, repeat `0`; slide entry frames 01–03 at 18 fps, repeat `0`, leaving frame 03 held after completion. Frames 00/04/05 remain in the atlas as source-complete entry/exit poses but are not cycled while the button is held.
  - `RUNNER_GROUND_Y=470`, `RUNNER_PLAYER_X=170`, `JUMP_IMPULSE=-420`, Phaser gravity `900`, standing collider 40×76, slide collider 64×48, and 800ms base collision stagger/protection stay code values unless a measured visual mismatch requires a documented correction. `getSlidePose` aligns the three active slide frames' visible bottoms to y=470 with uniform X/Y scale; no frame can float, squash, or pass visually through the overhead bar. Update the five-character opaque-bottom table from generated `slide-03` art rather than copying old values.
- **Execution Flow / Logic**:
  1. Jump input still consumes one press, allows at most two jumps, and rejects airborne slide. Rang's second impulse is `-420*1.08`; other characters retain `-420`. On vertical velocity sign change, transition once from the first four ascending poses to falling poses 04–05 without changing velocity or gravity. Landing returns to the run loop and restores jump count, including the existing below-floor recovery.
  2. Slide input immediately changes the collider to the code-defined slide body and plays only low-profile entry frames 01–03. Keep the last low frame for continued hold; do not loop into upright frames. Release restores running, with Toa's existing 150ms grace. Collision body size remains independent of frame alpha.
  3. Hiyori's pickup overlap body grows by 20px on each side around the unchanged 24×24 visual pickup, while all other characters keep 24×24. The optional high coin row remains above the grounded player's expanded overlap; jumping is still required to reach it. No coin/time schedule or +3s time-item amount changes.
  4. `applyCollision` keeps the 5-second penalty and 800ms stagger for all; Mary receives 1050ms protection (`RUNNER_CONFIG.protectionMs+250`) while her penalty and stagger stay unchanged. Existing repeated-hit protection still prevents double penalties.
  5. On a terminal call, snap the character art to the floor before disabling the body, clear blinking alpha, stop the running animation, and play one terminal animation once. The outcome choice arrives in P02-T02; default `gameOver` remains safe until then.
- **Error & Exception Handling**: Do not hide a missing frame behind a fallback run pose. Surface loader errors through the existing `onError` callback. Preserve pause/resume and the 800ms frozen-course behavior; action animation may pause with the scene but must resume from its current frame.
- **State Transition & Return**: `RunnerPlayer` changes visual action/pose only. `RunnerSimulation` remains the sole owner of timer, distance, pickups, and collision state.

## Acceptance Criteria

- [x] Selector contains exactly the five named characters, each with correct color, portrait, idle/run preview, and start flow; Yuni/Lize are absent and old IDs fall back to Rin.
- [x] Every playable atlas resolves 12 run frames and six frames for every other mapped action with 96×96 frame dimensions; animation keys do not collide across character switches.
- [x] Run, hit, jump, double jump, slide entry/hold, and default crying playback are wired for all five; slide art stays grounded and clears the overhead obstacle without changing jump height or timer rules.
- [x] New passive effects are centrally configured and tested: Rang +8% second jump, Hiyori +20px pickup radius without ground-grabbing high coins, Mary +250ms post-hit protection.
- [x] Pausing freezes game and animation; resume continues; ending a run in mid-air settles the result pose on the floor.

## Validation

- `npm run assets:validate` — all five atlases/frames remain intact.
- `npm test -- src/game/characters/characterRegistry.test.ts src/app/screens/CharacterSelect.test.tsx src/game/runner/RunnerPlayer.test.ts src/game/runner/runnerPose.test.ts src/game/runner/RunnerSimulation.test.ts src/game/runner/CollisionSystem.test.ts` — roster, visual pose, and physics/passive regressions.
- `npm test` — all tests referencing removed IDs are updated and pass.
- `npm run typecheck`, `npm run build`, `npm run lint` — new unions/imports and selector CSS compile cleanly.
- Manual: switch through five characters, run each through jump→double jump→land, hold/release slide near a high obstacle, take a hit, pause/resume, and inspect both large and 320px selector layouts.

## Commit Message

```text
feat(runner): connect five-character motion roster

Plan: 2026-10-26-rin-unified-motion
Phase: P02-character-runtime
Task: T01-five-character-gameplay

- Replace the active roster and tune three new passives
- Drive aligned run, jump, hit, and held-slide animations in the runner
```

## Progress

- [x] Implementation complete
- [x] Validation passed: asset validation, 44 Vitest tests, typecheck, build, lint; headless Edge selector checks at 1366×768, 844×390, 667×375, and 320×640 plus five game loads and Rang jump/slide/pause.
- commit: `ff2db77` (`project02`)
