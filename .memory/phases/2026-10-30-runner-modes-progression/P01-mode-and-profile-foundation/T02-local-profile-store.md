# Task: T02 Local Profile Store

## Status: done

## Goal

Persist wallet, unlocks, Story progress, achievements, cosmetics, and per-character equipment in validated versioned local storage behind the PlayerProfileStore interface.

## Decision Summary

- Profile persistence is local-first and safe when storage is absent or malformed.
- Wallet settlement and one-time rewards use stable IDs to prevent duplicate claims.

## Implementation

### I01. Implement local profile persistence

- Related Files:
  - src/services/PlayerProfile.ts :: PlayerProfile and PlayerProfileStore; read-only
  - src/services/LocalPlayerProfileStore.ts :: LocalPlayerProfileStore, parseProfile, isValidProfile, DEFAULT_PLAYER_PROFILE; new
  - src/services/LocalPlayerProfileStore.test.ts :: persistence/error/idempotency tests; new

#### Details

- Storage key: running-action:profile:v1. Serialize {version:1, profile:PlayerProfile}.
- Constructor accepts optional Pick<Storage,'getItem'|'setItem'> | null. Export browserPlayerProfileStore using lazy window.localStorage access.
- Default profile has wallet 0, unlocked characters [player-default], unlocked stages [dawn-city], empty cleared stages/challenges/achievement IDs/cosmetics/equipment/processed run IDs/reward keys, and empty progress map.
- Validate version, safe nonnegative integer wallet/counters, known CharacterId and StoryStageId values, unique string IDs, and valid equipment mapping. Invalid JSON/schema returns a fresh default without throwing.
- update clones immutable state, invokes mutator once, validates result, persists best effort, and returns new state. Storage errors preserve usable in-memory state.
- Add settleRunCoins(runId, amount): boolean to perform one atomic profile update; false for an already processed ID. Keep last 1000 run IDs. Add claimReward(rewardKey, changes): boolean with the same one-time semantics.
- This is local integrity only; do not claim protection from a user editing localStorage.

### I02. Add contract tests

- Related Files:
  - src/services/LocalPlayerProfileStore.test.ts :: fresh profile, roundtrip, malformed values, throwing storage, duplicate settlement/reward; new

#### Details

- Ensure a repeated run ID cannot deposit coins twice and a repeated reward key cannot grant twice.

## Acceptance Criteria

- [ ] Profile survives reload and validates all persisted data.
- [ ] Restricted/corrupt storage does not crash the UI.
- [ ] Duplicate run/reward events do not grant duplicate coins or rewards.

## Validation

- npx vitest run src/services/LocalPlayerProfileStore.test.ts
- npm run typecheck

## Commit Message

    feat(profile): persist local progression safely

    Plan: 2026-10-30-runner-modes-progression
    Phase: P01-mode-and-profile-foundation
    Task: T02-local-profile-store

    - Add versioned local profile persistence and validation
    - Make run and reward settlement idempotent

## Progress

- [x] Implementation complete
- [x] Validation passed: npm run typecheck
- commit: see task commit
