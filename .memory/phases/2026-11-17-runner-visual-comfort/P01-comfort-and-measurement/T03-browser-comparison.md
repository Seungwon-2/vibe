# Task: T03 Browser Comparison

## Status: pending

## Goal
Provide reproducible local A/B comparison evidence and explain remaining device/user checks.

## Implementation
### I01. Browser regression and measurements
- Isolated Edge profile, guest local Vite process, no authentication/env file changes. Same deterministic snapshot/course for both presets.
- Capture requestAnimationFrame frame intervals and scene update costs for normal, 2.5x effects and biome transitions; report p50/p95/p99, max and >33.3ms counts. Exclude countdown/pause/startup. Browser headless CPU/GPU limitations stated explicitly; no fabricated performance win.
- Verify 1366x768 and 915x412: scroll-free, unchanged HUD/playfield size, quiet visual cues and distinct hazards. Mode change while paused preserves snapshot. Screenshots and traces in `test-results/runner-comfort/` (ignored).
### I02. Handoff
- New `docs/runner-visual-comfort-validation.md`: changes, measurements, known limitations, local comparison instructions and remaining user comfort/real-device profile tasks.
- `.memory/worklogs/2026-11-17.md` record today's work; sync phase/current. Preserve broad feedback-recovery T04 incomplete.
- User comparison includes eye comfort and hazard recognition; do not mark those confirmed automatically. Defer actual boost/speed changes until comparison feedback.

## Acceptance Criteria
- [ ] Full frontend tests, build, lint pass; A/B developer results recorded accurately.
- [ ] Local link and pause-menu comparison instructions available.
- [ ] No production deployment or gameplay/ranking balance changes.

## Validation
- `npm run test`, `npm run build`, `npm run lint`
- Browser screenshots and measurement JSON verified against report.

## Commit Message
```text
docs(game): record visual comfort comparison and local validation

Plan: 2026-11-17-runner-visual-comfort
Phase: P01-comfort-and-measurement
Task: T03-browser-comparison
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
