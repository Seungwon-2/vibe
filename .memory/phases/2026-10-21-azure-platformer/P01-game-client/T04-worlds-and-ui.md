# Task: T04 Worlds, Bosses, and Client UI

## Status: pending

## Goal
Deliver eight sequentially unlocked stages, two stomp-based boss encounters, and React menus/HUD backed by a replaceable game-service interface.

## Decision Summary
- World ids: windy-ruins and luminous-mine; four stages each; stages 4 and 8 are boss fights. Each boss has a unique attack and stomp vulnerability window.
- React owns menus/HUD; Phaser reports typed game events. Use in-memory gateway until P03.

## Implementation

### I01. World catalog and stage content
- Related Files:
  - src/game/content/stageTypes.ts :: world, stage, enemy, checkpoint, boss types; new
  - src/game/content/worldCatalog.ts :: eight ordered stage definitions; new
  - src/game/content/worldCatalog.test.ts :: catalog invariants; new
  - src/game/scenes/PlayScene.ts :: create geometry from stage data; modify
- Details
  - StageDefinition = { id:string; worldId:string; ordinal:number; theme:'ruins'|'mine'; width:number; spawn:{x:number;y:number}; platforms:Array<{x:number;y:number;width:number;height:number}>; hazards:Array<{id:string;kind:'spikes'|'pit';x:number;width:number}>; coins:Array<{id:string;x:number;y:number}>; enemies:EnemySpawn[]; checkpoints:CheckpointDefinition[]; boss?:BossDefinition }.
  - IDs: ruins-1..ruins-4 and mine-1..mine-4. Each has spawn, exit, at least one coin and valid platforms. Stages 1-3 each have a mid-stage checkpoint; stage 4 has one boss arena.
  - Boss ids ruins-guardian and mine-warden. Each has a distinct attack pattern, visible telegraph, recovery stomp window, and requires three stomps. Keep attack details in data/config so they can be tuned without rewriting collision rules. Patterns are deterministic with injected clock/random source for tests.
  - Unlock ordinals 1..8: clearing N unlocks N+1; clear 4 unlocks world 2; clear 8 ends campaign. Boss clear fires once.
  - Render simple pixel-art theme tiles/decorations from code or project-local assets; no external trademarked assets.

### I02. Screens and service contract
- Related Files:
  - src/services/GameGateway.ts :: save and ranking interface; new
  - src/services/MemoryGameGateway.ts :: local dev adapter; new
  - src/app/screens/MainMenu.tsx :: Continue/New Game/Rankings; new
  - src/app/screens/WorldMap.tsx :: stage unlocks; new
  - src/app/components/GameHud.tsx :: lives, score, timer, effect, pause; new
  - src/app/screens/ResultScreen.tsx and RankingScreen.tsx :: clear/game-over/ranking; new
  - src/app/screens/GameScreens.test.tsx :: screen flow tests; new
- Details
  - GameGateway methods: getSave():Promise<PlayerSave|null>; putSave(save:PlayerSave):Promise<void>; deleteSave():Promise<void>; getRanking(stageId:string):Promise<StageRankingRow[]>; submitClear(result:StageClearResult):Promise<StageRecord>.
  - Continue resumes world/stage/checkpoint/lives/score/character. New Game with existing save confirms before replacement. Stage score resets at each stage. New world starts at 5 lives.
  - Show at most 10 ranking rows sorted score descending then clear time ascending. Display Entra name, score, clear time; never email or object id.
  - MemoryGameGateway is development-only and must be replaced by authenticated ApiGameGateway in P03. Production must not silently accept memory identity.

## Acceptance Criteria
- [ ] Catalog contains exactly 8 valid stages and two distinct bosses.
- [ ] Sequential unlock and both boss win paths work.
- [ ] Menus/HUD/results/top-10 leaderboard are wired through GameGateway.

## Validation
- npm test -- --run src/game/content/worldCatalog.test.ts src/app/screens/GameScreens.test.tsx — pass.
- npm run typecheck, npm run lint, npm run build — pass.

## Commit Message
feat(game): add themed worlds bosses and game screens

Plan: 2026-10-21-azure-platformer
Phase: P01-game-client
Task: T04-worlds-and-ui

- define eight sequential stages and two boss patterns
- add menus, HUD, results, and gateway boundary

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
