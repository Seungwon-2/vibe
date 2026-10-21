# Task: T02 Phaser and Character Registry

## Status: done

## Goal
Mount Phaser inside React and load the selected protagonist through a reusable character definition so a later playable character can be registered without changing game-scene logic.

## Decision Summary
- React owns menus and lifecycle; Phaser owns canvas, scenes, physics, and animations.
- MVP uses only the supplied blue-and-white character. Preserve source drafts and produce normalized transparent runtime frames.

## Implementation

### I01. Phaser host
- Related Files:
  - src/game/PhaserGame.tsx :: PhaserGame component; new
  - src/game/config/createGameConfig.ts :: createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig; new
  - src/game/scenes/BootScene.ts :: preload and scene startup; new
  - src/game/scenes/PlayScene.ts :: initial game scene; new
  - src/game/PhaserGame.test.tsx :: create/destroy lifecycle test; new
- Details
  - PhaserGame creates one Phaser.Game in a React effect and calls destroy(true) on unmount. Optional callbacks are onReady(game: Phaser.Game): void and onDestroy(): void.
  - Configure Arcade Physics, pixel-art rendering, logical resolution 960x540, FIT scale, centered canvas, and antialiasing disabled.
  - BootScene preloads runtime images then starts PlayScene. Missing image/load failure shows an observable error state, not a blank canvas.

### I02. Data-driven character and normalized assets
- Related Files:
  - src/game/characters/characterTypes.ts :: CharacterDefinition, CharacterAnimationSet, CharacterStats; new
  - src/game/characters/characterRegistry.ts :: registerCharacter and getCharacterDefinition; new
  - src/game/characters/defaultCharacter.ts :: first playable definition; new
  - src/game/characters/PlayerActor.ts :: Phaser actor wrapper; new
  - src/game/characters/characterAtlas.json :: explicit frame rectangles; new
  - scripts/prepare-character-assets.mjs :: trim/pad/crop frames; new
  - assets/character/runtime/ :: normalized transparent frames; new
  - src/game/characters/characterRegistry.test.ts :: registry/animation tests; new
- Details
  - Types:
    CharacterStats = { walkSpeed:number; runSpeed:number; jumpVelocity:number }.
    CharacterAnimationSet = { idle:string[]; idleLook:string[]; walk:string[]; run:string[]; jump:string[]; hurt:string[]; start:string[]; victory:string[]; gameOver:string[] }.
    CharacterDefinition = { id:string; displayName:string; textureKey:string; stats:CharacterStats; animations:CharacterAnimationSet; frameWidth:number; frameHeight:number }.
    Functions: registerCharacter(definition:CharacterDefinition):void; getCharacterDefinition(id:string):CharacterDefinition.
  - Stable MVP id is player-default; default stats walk 170, run 250, jump velocity -420; normalized frames are 96x96. All nine animation keys exist and each has at least one frame. No character selection UI or character-specific powers in MVP.
  - Source files are assets/character/platformer-character-spritesheet-v2.png and assets/character/platformer-character-actions-v1.png. Keep source drafts immutable. Store measured integer crop rectangles in characterAtlas.json; script trims transparent margins, preserves aspect ratio, pads to 96x96, and writes frame PNGs plus a Phaser atlas manifest.
  - Reject duplicate ids, absent animation frames, invalid dimensions, or unknown character ids with descriptive errors. A test fixture registers a second character without changing PlayerActor or PlayScene.

## Acceptance Criteria
- [x] Phaser creates and destroys cleanly from React.
- [x] The protagonist has idle, idle-look, walk, run, jump, hurt, start, victory, and game-over animations.
- [x] A second fixture character registers without edits to actor/scene logic.
- [x] Source drafts are unchanged; runtime assets have consistent 96x96 transparent frames.

## Validation
- npm test -- --run src/game/characters/characterRegistry.test.ts src/game/PhaserGame.test.tsx — tests pass.
- npm run assets:validate — all crops are in source bounds and required frames exist.
- npm run typecheck and npm run build — pass.

## Commit Message
feat(game): mount Phaser and register playable characters

Plan: 2026-10-21-azure-platformer
Phase: P01-game-client
Task: T02-phaser-character

- add React-managed Phaser lifecycle
- normalize protagonist frames and add character registry

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: recorded in Git history
