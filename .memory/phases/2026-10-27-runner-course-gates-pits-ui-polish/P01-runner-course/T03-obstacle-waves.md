# Task: T03 Obstacle Waves

## Status: in_progress

## Goal

Retune distance-based hazard generation so the shortened tutorial and practice are readable, later runs include three-obstacle continuous waves, and pits remain isolated with enough approach and landing space.

## Decision Summary

- Tutorial: 0–1,000m. Practice: 1,000–2,000m. Dense waves begin at 2,000m.
- Early single patterns are 540m apart (configuration default). Dense waves use three single-action patterns 300m apart, then 550m of recovery; defaults are the midpoints of the approved ranges.
- Keep jump/slide controls and existing physics boxes. No hazard may intersect a pit's ±200m safety zone.

## Implementation

### I01. Pattern bands and deterministic wave schedule

- Related Files:
  - `src/game/runner/runnerConfig.ts` :: course tuning values — modify.
  - `src/game/runner/hazardTypes.ts` :: `HazardBand`, `HazardPattern`, `HazardDefinition` — modify only if schedule metadata is needed.
  - `src/game/runner/hazardPatterns.ts` :: `HAZARD_BANDS`, `HAZARD_PATTERNS`, `getPatternForDistance`, `getHazardDistance` — modify.
  - `src/game/runner/ObstacleSpawner.ts` :: `ObstacleSpawner.update` — use scheduled pattern starts; modify.
  - `src/game/runner/CollectibleSpawner.ts` :: `getGroundHazardDistances` — enumerate the new pattern schedule for pickup clearance; modify.
  - `src/game/runner/hazardPatterns.test.ts` :: deterministic schedule and recoverability — modify.
  - `src/game/runner/CollectibleSpawner.test.ts` :: hazard-distance enumeration compatibility — modify.

#### Details

- Add tunings `tutorialEndMeters: 1000`, `practiceEndMeters: 2000`, `earlyPatternStartMeters: 360`, `earlyPatternSpacingMeters: 540`, `denseSectionStartMeters: 2000`, `densePatternSpacingMeters: 300`, `densePatternsPerSection: 3`, `denseRecoveryGapMeters: 550`.
- Use four bands: `tutorial` `[0,1000)`, `practice` `[1000,2000)`, `combination` `[2000,6000)`, and `advanced` `[6000,+∞)`. These are difficulty bands; biome selection remains in `runnerBiomes.ts`.
- Define the early starts as 360m, 900m, and 1,440m. Start dense wave one at 2,000m.
- Define dense wave starts by `waveStart = 2000 + waveIndex * (3 * 300 + 550)` and slot starts as `waveStart + slotIndex * 300`, `slotIndex ∈ {0,1,2}`. Thus starts begin 2,000/2,300/2,600 then 3,150/3,450/3,750m.
- Each dense slot contains exactly one hazard. Alternate ground and overhead actions so runs require both jump and slide; do not use multi-obstacle patterns inside 300m slots. Keep any existing paired pattern only in a band where the next pattern is separated by enough distance for every action in the pair.
- Export `getPatternStartDistance(patternIndex: number): number`; have `getHazardDistance(patternIndex: number, hazard: HazardDefinition): number` use that start plus `offsetMeters`. `ObstacleSpawner.update` must use this function rather than multiplying every index by one constant.
- Before each spawn, skip a whole candidate pattern if `isPitClearance(hazardCenterMeters, pit, RUNNER_CONFIG.pitHazardClearanceMeters)` is true for any hazard in it. With a 30m gap and 200m configured clearance, hazard centers stay more than 215m from pit centers. Do not leave one half of an existing paired pattern behind.
- Use a stable pattern cycle; no random selection. Preserve Phaser cleanup and update-only-while-running behavior.

### I02. Passability and separation verification

- Related Files:
  - `src/game/runner/hazardPatterns.test.ts` :: band boundaries, schedule, top-speed action spacing — modify.
  - `src/game/runner/ObstacleSpawner.test.ts` :: pit exclusion and spawner lifecycle — new.
  - `src/game/runner/RunnerIntegration.test.ts` :: run through the extended course — modify.

#### Details

- Verify three dense slots per wave, 300m spacing, a 550m recovery interval from slot three to the next wave, and 1,450m wave period.
- For all generated hazards through 12,500m, assert no hazard center enters the `pit.widthMeters / 2 + pitHazardClearanceMeters` exclusion zone.
- Check action recovery using the fastest configured character target (Rin at all five gates: base 325 × 1.30 = 422.5 units/sec; use the unit-to-meter conversion from `RUNNER_CONFIG`). Ensure consecutive ground/overhead requirements retain at least one full second of action recovery. If a pattern fails, increase its spacing or remove that pattern; never reduce the configured 300m slot interval.
- Verify early starts and band boundaries at 360m, 1,000m, 1,440m, 2,000m, and 6,000m.

## Acceptance Criteria

- [ ] Early hazards remain sparse; three-action waves start at 2,000m and repeat on the configured cycle.
- [ ] Every dense slot is a single jump-or-slide action, and waves alternate obstacle types.
- [ ] Each wave has the full 550m recovery span and no obstacle falls within a pit exclusion zone.
- [ ] Deterministic tests show enough time to react at the fastest shared target speed.

## Validation

- `npm run test -- src/game/runner/hazardPatterns.test.ts src/game/runner/ObstacleSpawner.test.ts src/game/runner/RunnerIntegration.test.ts` — schedule, exclusion, lifecycle, and recoverability assertions pass.
- `npm run typecheck` — pattern-distance and spawner types compile.

## Commit Message

```text
feat(runner): add fair obstacle waves after the tutorial

Plan: 2026-10-27-runner-course-gates-pits-ui-polish
Phase: P01-runner-course
Task: T03-obstacle-waves

- Shorten tutorial and practice bands
- Add three-pattern waves with recovery and pit clearance
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
