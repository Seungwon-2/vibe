# Task: T01 Local Run Gateway

> **Dependency update:** The active roster after `2026-10-26-rin-unified-motion` has five characters, and that plan adds a separate `running-action:personal-best:v1` store for terminal animation. Keep this task's future unified top-ten `running-action:records:v1` gateway distinct, update its character-count assertions to five, and read the newer plan before execution.

## Status: pending

## Goal

Persist runner records in browser storage behind a small gateway interface that can be replaced by Entra-backed cloud services later.

## Decision Summary

- Local play must work without sign-in or network. Persist the top 10 run results in `localStorage`.
- Sort by distance descending, coins descending, then earlier `finishedAtIso` first. Keep one unified list across all characters.

## Implementation

### I01. Define record schema and gateway

- Related Files:
  - `src/services/RunGateway.ts` :: `RunRecord`, `RankedRunRecord`, `RunGateway`; new.
  - `src/services/LocalRunGateway.ts` :: `LocalRunGateway`; new.
  - `src/services/LocalRunGateway.test.ts` :: persistence, ordering, cap, corrupt-storage tests; new.

#### Details

- `RunRecord = { id: string; characterId: CharacterId; distanceMeters: number; coins: number; durationMs: number; finishedAtIso: string }`.
- `RankedRunRecord = RunRecord & { rank: number }`.
- `RunGateway` methods: `getBest(): Promise<RankedRunRecord | null>`, `getRanking(): Promise<RankedRunRecord[]>`, `submitRun(result: RunResult): Promise<RankedRunRecord>`.
- Use storage key `running-action:records:v1`. Store JSON `{ version: 1, records: RunRecord[] }`; keep at most 10 rows after sorting `distanceMeters desc`, `coins desc`, `finishedAtIso asc`, then `id asc` for deterministic ties.
- `submitRun` normalizes distance to integer meters, rejects non-finite/negative distance, negative coins/duration, invalid ISO timestamps, and unknown character IDs. Generate a unique run ID once at result submission; do not create one per render.
- If localStorage is unavailable, catch read/write exceptions and retain an in-memory list for this page session. Do not fail or block gameplay. `getBest` returns the first sorted row or null.
- Do not add usernames/account IDs now. The interface is intentionally replaceable when Entra is planned.

## Acceptance Criteria

- [ ] Valid results persist across reloads and show up for all four characters in one list.
- [ ] Only the best 10 rows remain, with deterministic distance/coin/time ordering.
- [ ] Corrupt JSON and disabled/full storage safely fall back to an empty/in-memory gateway.
- [ ] Invalid or NaN run results cannot enter ranking.

## Validation

- `npm test -- src/services/LocalRunGateway.test.ts` — validates storage and ordering.
- `npm run typecheck` — validates gateway/result schema.

## Commit Message

```text
feat(ranking): persist local runner results

Plan: 2026-10-26-running-action-redesign
Phase: P04-local-ranking
Task: T01-local-run-gateway

- Store the unified top-ten distance ranking in browser storage
- Keep a gateway boundary for future Entra-backed records
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
