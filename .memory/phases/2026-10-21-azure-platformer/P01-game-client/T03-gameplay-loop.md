# Task: T03 Platformer Gameplay Loop

## Status: done

## Goal
Implement the desktop controls and selected platformer rules in deterministic, testable Phaser gameplay systems.

## Decision Summary
- Arrows or WASD move; Space jumps; Shift runs. Stomp defeats enemies; side contact and hazards remove one life.
- World-shared lives, checkpoints, speed effects, score events, 1.5-second post-respawn invulnerability follow the decision document.

## Implementation

### I01. Player input and movement
- Related Files:
  - src/game/systems/PlayerController.ts :: PlayerController; new
  - src/game/systems/PlayerController.test.ts :: movement tests; new
  - src/game/scenes/PlayScene.ts :: input bindings; modify
- Details
  - PlayerInput = { left:boolean; right:boolean; jumpPressed:boolean; run:boolean }.
  - PlayerState union: idle, moving, jumping, hurt, respawning, gameOver.
  - PlayerController methods: update(input:PlayerInput, deltaMs:number):void; respawnAt(x:number,y:number):void; applySpeedModifier(multiplier:number,durationMs:number):void.
  - Arrow keys and A/D move; W/Up/Space jump only while grounded; Shift selects registered run speed. Fast pickup multiplier 1.25 and slow pickup 0.7, both 3,000 ms. A new pickup replaces current multiplier and restarts timer. Stage speed mechanic uses same modifier service but is independent of pickup expiry.

### I02. Collision and run state
- Related Files:
  - src/game/systems/CollisionRules.ts :: stomp/hurt/hazard resolution; new
  - src/game/systems/RunState.ts :: run state transitions; new
  - src/game/systems/CollisionRules.test.ts and RunState.test.ts :: rule tests; new
- Details
  - RunState = { lives:number; worldId:string; stageId:string; checkpointId:string; stageScore:number; coins:number; enemyStomps:number; extraLifeOverflow:number; elapsedMs:number; unlockedStageOrdinal:number }.
  - Initialize each world at 5 lives; cap at 9. A cap-overflow extra-life pickup yields 1,000 points. Coin adds 100; stomp adds 200; a stage-clear bonus of 500 is applied once.
  - A downward player collision from above defeats a stompable enemy and bounces the player. Side contact, spike, pit, or boss attack decrements one life unless invulnerable. After non-final loss, respawn at last activated checkpoint and ignore damage for 1,500 ms. On zero lives play game-over animation, then restart current stage with 5 lives. New world begins with 5 lives.
  - Checkpoint activation emits one save event. Debounce collision callbacks so one damage window can remove at most one life.
  - Pure score function: coins*100 + enemyStomps*200 + stageClearBonus + extraLifeOverflow*1000.

## Acceptance Criteria
- [x] Movement, stomp, damage, hazards, checkpoint, invulnerability, life cap, game-over, and score match decisions.
- [x] Repeated collision callbacks cannot remove multiple lives during invulnerability.
- [x] Speed effects replace prior pickups and expire after 3 seconds.

## Validation
- npm test -- --run src/game/systems/PlayerController.test.ts src/game/systems/CollisionRules.test.ts src/game/systems/RunState.test.ts — rules pass.
- npm run typecheck and npm run build — pass.

## Commit Message
feat(game): implement platformer movement and life rules

Plan: 2026-10-21-azure-platformer
Phase: P01-game-client
Task: T03-gameplay-loop

- add keyboard movement, collision, and speed effects
- implement lives, checkpoints, and score events

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: recorded in Git history
