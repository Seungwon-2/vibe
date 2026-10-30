# Task: T02 Story Lives and Outcomes

## Status: pending

## Goal

Implement Story's three-life rule, 800ms hit recovery, Hiyori's two per-stage defenses including safe pit recovery, and clear/failure outcomes.

## Decision Summary

- Ordinary hits remove one life and grant 800ms invulnerability; three hits fail the stage.
- Pits immediately fail unless Hiyori has a charge; Hiyori is restored to a safe course position and consumes one charge.
- Giant item protects only from ordinary hazards, not pits.

## Implementation

### I01. Add Story collision and pit transitions

- Related Files:
  - src/game/runner/RunnerSimulation.ts :: applyCollision, applyPitFall, advanceRunner; modify
  - src/game/runner/runnerEvents.ts :: life-lost, pit-protected, stage-completed events; modify
  - src/game/runner/RunnerScene.ts :: collision/pit recovery presentation and finish wiring; modify
  - src/app/components/RunnerHud.tsx :: Story lives and Hiyori charges; modify
  - src/game/runner/RunnerSimulation.test.ts :: collision and pit cases; modify
  - src/game/runner/RunnerScene.test.ts :: transitions and pause behavior; modify

#### Details

- Initialize Story livesRemaining=3 and Hiyori passiveChargesRemaining=2 per stage; non-Hiyori does not receive pit protection charges.
- Ordinary collision in Story, when not protected: decrement lives by one, increment hitsTaken, set staggerRemainingMs to a hit presentation duration, set protectionRemainingMs=800, and emit life-lost. Do not subtract Endless timer penalty in Story.
- If lives reach zero, finish with reason lives-exhausted and completedStage false, exactly once.
- Pit collision checks active Hiyori charges before generic pit failure; if a charge exists, decrement exactly one, move player to last safe lane/ground anchor, apply short recovery invulnerability, and emit pit-protected. Otherwise finish with pit failure.
- Giant and ordinary protection checks never intercept pit failure. Existing Endless Hiyori and Toa mechanics remain mode-compatible.
- HUD in Story displays remaining lives and Hiyori shield charges; Endless retains its existing HUD.
- Finish callback result identifies mode, stage, hit count, and completedStage for later progression screens.

## Acceptance Criteria

- [ ] Story hit consumes one life; 800ms invulnerability prevents repeated same-hazard hits.
- [ ] Third hit fails the stage once.
- [ ] Hiyori can safely recover from two pits/collisions per stage; later pit fails.
- [ ] Giant does not protect from pits.

## Validation

- npx vitest run src/game/runner/RunnerSimulation.test.ts src/game/runner/RunnerScene.test.ts src/app/components/RunnerHud.test.tsx
- npm run typecheck

## Commit Message

    feat(runner): add story lives and pit recovery

    Plan: 2026-10-30-runner-modes-progression
    Phase: P02-runner-mode-gameplay
    Task: T02-story-lives-and-outcomes

    - Add Story lives, hit protection, and stage failure rules
    - Add Hiyori pit recovery and Story HUD

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
