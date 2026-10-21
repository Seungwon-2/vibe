# Task: T04 Worlds, Bosses, and Client UI

## Status: done

## Goal
Deliver eight sequentially unlocked stages, a high-difficulty vertical jump challenge in World 2 Stage 3, two command-input stomp-based boss encounters, and React menus/HUD backed by a replaceable game-service interface.

## Decision Summary
- World ids: windy-ruins and luminous-mine; four stages each; stages 4 and 8 are boss fights. Each boss has a unique attack and command-input mechanic that opens a stomp vulnerability window.
- World 2 Stage 3 (`mine-3`, global ordinal 7) is a high-difficulty vertical ascent challenge: the player jumps between elevated platforms to reach a goal line above within 120 seconds. It has no checkpoints. Falling costs no life and returns the player to the bottom; the timer continues and collected coins remain. Timeout shows the stage failure screen; retry restarts at the stage start with a fresh 120-second timer.
- React owns menus/HUD; Phaser reports typed game events. Use in-memory gateway until P03.

## Implementation

### I01. World catalog and stage content
- Related Files:
  - src/game/content/stageTypes.ts :: world, stage, enemy, checkpoint, boss types; new
  - src/game/content/worldCatalog.ts :: eight ordered stage definitions; new
  - src/game/content/worldCatalog.test.ts :: catalog invariants; new
  - src/game/systems/BossEncounter.ts :: boss stomp/rage/command state machine; new
  - src/game/systems/BossEncounter.test.ts :: boss phase and command behavior; new
  - src/game/scenes/PlayScene.ts :: create geometry from stage data; modify
- Details
  - StageDefinition includes `id`, `worldId`, global `ordinal`, `theme`, `name`, `width`, `height`, `spawn`, `exit`, platforms, hazards, coins, speed/extra-life pickups, enemies, checkpoints, and optional `timeLimitSeconds`, `fallRule`, `persistCoinsOnFall`, and `boss` configuration.
  - IDs: ruins-1..ruins-4 and mine-1..mine-4. Each has spawn, exit, at least one coin and valid platforms. Stages 1-3 have a mid-stage checkpoint except `mine-3`; stage 4 has one boss arena. `mine-3` is a vertical platforming ascent with progressively higher platforms and an elevated exit/goal line, `timeLimitSeconds:120`, `fallRule:'restart-at-base'`, and `persistCoinsOnFall:true`. It has no checkpoint; falling restarts at the bottom without losing a life and the timer keeps running. Timeout shows failure; retry starts a fresh attempt and timer.
  - Boss ids ruins-guardian and mine-warden. Each `BossDefinition` includes attack pattern, command key set/sequence, command input limit, 5-second post-enrage delay, 3-second groggy duration, rage threshold of two stomps, 1.15 movement/attack speed multiplier, and three stomps to defeat. Both have distinct attacks and stomp assists such as elevated platforms. The World 1 boss allows 4 seconds for input; the World 2 boss allows 6 seconds. Correct input creates a groggy stomp window; the third stomp defeats the boss. A wrong key or timeout triggers an immediate counterattack, then the player can retry after the boss recovery. Keep phase, attack, and command details in data/config so they can be tuned without rewriting collision rules.
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
  - src/services/MemoryGameGateway.test.ts :: save and ranking behavior; new
- Details
  - GameGateway methods: getSave():Promise<PlayerSave|null>; putSave(save:PlayerSave):Promise<void>; deleteSave():Promise<void>; getRanking(stageId:string):Promise<StageRankingRow[]>; submitClear(result:StageClearResult):Promise<StageRecord>.
  - Continue resumes world/stage/checkpoint/lives/score/coins/collected coin ids/character. New Game with existing save confirms before replacement. Stage score resets at each stage. New world starts at 5 lives.
  - Show at most 10 ranking rows sorted score descending then clear time ascending. Display Entra name, score, clear time; never email or object id.
  - MemoryGameGateway is development-only and must be replaced by authenticated ApiGameGateway in P03. Production must not silently accept memory identity.

## Acceptance Criteria
- [x] Catalog contains exactly 8 valid stages and two distinct bosses; `mine-3` has no checkpoint, a 120-second timer, an elevated goal, and fall behavior that restarts at the bottom without losing life while preserving time and collected coins.
- [x] Sequential unlock works; each boss can be stomped twice before entering a 15% faster, unstompable rage phase; after 5 seconds it displays its distinct command pattern (4-second input limit in World 1, 6 seconds in World 2); success creates a 3-second stomp window and the third stomp wins, while failed input triggers a counterattack.
- [x] Menus/HUD/results/top-10 leaderboard are wired through GameGateway.

## Validation
- `npm test` — pass (25 tests).
- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm run build` — pass (Vite reports a large Phaser bundle warning).

## Commit Message
feat(game): add themed worlds bosses and game screens

Plan: 2026-10-21-azure-platformer
Phase: P01-game-client
Task: T04-worlds-and-ui

- define eight sequential stages and two boss patterns
- add menus, HUD, results, and gateway boundary

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: feat(game): add themed worlds bosses and game screens
