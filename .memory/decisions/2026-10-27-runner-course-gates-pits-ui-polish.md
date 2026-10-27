# Runner Course, Gates, Pits, and UI Polish

## Status

Accepted during grill-me interview on 2026-10-27. Ready for memory planning; no implementation is included in this decision.

## Goal

Improve the running-action course with frequent safe-route coins, a clearer obstacle-difficulty curve, permanent gate speed progression, and occasional fatal pits. Polish the main screens while preserving the current pastel-fairytale art direction and existing game controls.

## Decisions

### Course progression and obstacle patterns

- Keep the four existing biome themes and their code-based Phaser Graphics art: dawn city, moonlit forest, crystal mine, and cloud skyway.
- Set the tutorial band to 0–1,000m and the practice band to 1,000–2,000m. Begin occasional continuous obstacle sections at 2,000m.
- Keep early obstacles more widely spaced. After 2,000m, use three single-action pattern slots roughly 250–350m apart (300m tuning default), then a 500–600m recovery interval (550m default).
- Preserve the existing jump, double-jump, and held-slide controls. All ordinary obstacle patterns must remain passable and preserve enough input recovery time.
- Avoid placing pits in or immediately beside obstacle combinations.

### Gates, themes, and speed

- Use five gates at 2,000m intervals: 2,000m, 4,000m, 6,000m, 8,000m, and 10,000m.
- Keep four themes with these distance ranges:
  - Dawn city: 0–2,000m
  - Moonlit forest: 2,000–4,000m
  - Crystal mine: 4,000–6,000m
  - Cloud skyway: 6,000m onward, including the final two gates
- Each passed gate permanently adds 5 percentage points to the maximum-speed target; the five-gate shared total is +25%. Add bonuses as percentage points against the base target, not as compounding multipliers. Preserve the existing elapsed-time acceleration ramp and let it approach the updated speed target smoothly.
- Keep the 90-second starting timer and existing +20-second gate reward, subject to the existing 120-second timer cap.

### Coins and pickups

- Place individual coins on the safe route approximately every 100–150m, with occasional short coin lines.
- Keep optional jump-reward coins separate from the safe-route stream, and prevent pickups from overlapping obstacles or pits.
- Preserve current pickup values and scoring behavior: time pickups add 3 seconds; coin count is recorded and remains the ranking tiebreaker.

### Pits and failure behavior

- Add rare, jumpable floor pits at roughly 1,500–2,000m intervals after the tutorial pit.
- Put the first pit around 800–900m so the tutorial can teach the mechanic. Show its warning only in the tutorial, using a clear ground-gap view and a theme-matched warning marker beginning around 250m before it. Do not show that separate warning marker for later pits; the physical floor gap must still be visible.
- Falling into any pit ends the run immediately as Game Over. It does not consume a life or return the runner to a checkpoint.
- Make each pit a standalone hazard with sufficient approach, jump, and landing space. Do not combine it with another obstacle.

### UI polish

- Polish the character selector, running HUD, run-result screen, and local-ranking screen.
- Keep the current pastel-fairytale palette. Refine panels, icons, spacing, and state feedback to improve clarity and visual detail.
- Treat this as a visual-detail pass; preserve the existing screen flow and gameplay functionality.

### Character identity and passive abilities

- Give each character one distinctive passive. Keep effect values in a central tuning configuration; do not add a player-facing ability-settings screen or active-skill buttons.
- Replace the current passives as follows:
  - **Aokumo Rin — 「질주의 메이드」**: cloud emblem; permanent +5 percentage points to her maximum-speed target, additive with the shared gate bonus. After all five gates, Rin reaches up to +30% against the base maximum-speed target.
  - **Hanayo Hiyori — 「유령의 수호」**: pink-flame emblem; two total defenses per run against either an ordinary obstacle hit or a pit fall, with no recharge.
  - **Tokino Mary — 「별빛 자석」**: sparkling-magnet emblem; item collection radius +30px.
- Hiyori's defense completely prevents the hit, stagger, and time penalty. When it blocks a pit fall, show a brief protective effect and return her safely to the course. After both defenses are used, ordinary obstacle hits follow the normal collision rules and any pit fall ends the run immediately.
- Until they become playable, leave Shizuki Toa's and Cogane Rang's passive abilities undecided; do not present their currently coded placeholder effects as final character identity.
- For future characters, define one character-specific passive at a time and tune it through the central configuration.
- In the selector, show a character-matched icon, ability name, and exact effect value. In the run HUD, show a compact ability badge, Hiyori's remaining defense count, and a brief activation cue when a passive triggers.
- Use each character's visual identity and accent color for their ability icon and name treatment. Keep the numeric effect text explicit so thematic labels do not obscure gameplay rules.

## Existing behavior to preserve

- 2D side-view auto-running, 3-second countdown, 90-second initial run, Space/Up to jump, Down held to slide, and one additional mid-air jump.
- Existing character roster, ranking rules, biome artwork approach, and responsive landscape play layout. Character passives follow the explicit revisions in this decision.
- Existing timer cap and gate-time bonus as specified above.

## Implementation implications

- Extend gate configuration and biome-boundary mapping together so the five gate markers and four-theme schedule cannot drift apart.
- Add pit definitions/spawning and a distinct fall-to-game-over path without reusing ordinary collision damage behavior.
- Rework pickup scheduling to support a frequent safe-route stream while retaining optional jump rewards.
- Update hazard-pattern generation and validation for the new bands, dense intervals, recovery gaps, and pit clearances.
- Extend the character passive model and collision handling for Rin's speed modifier, Hiyori's limited hazard/pit protection, and Mary's expanded collection radius; keep these effects and future tuning values centrally configured.
- Surface passive names, icon treatments, exact effects, remaining Hiyori defenses, and activation feedback in the selector and runner HUD.
- Keep gameplay collision bounds separate from decorative art, and render pits/markers in the same code-based, biome-aware visual system.
- Add configuration-level tuning for the gate speed bonus, obstacle cadence, coin spacing, and pit cadence so balancing does not require changes to simulation logic.

## Assumptions and resolved ambiguity

- “Gate stages +2” means five total gate markers, not two new biomes. The final two gates lie within the extended cloud-skyway region.
- Gate speed bonuses add as percentage points to the base maximum-speed target; Rin's additional +5 points are also additive. The normal acceleration ramp remains smooth.
- Later pits have no tutorial warning marker, but the gap itself remains visible in the running lane.
- “Other elements need detail work” is scoped to the four named primary screens; menu and pause-screen layout/functionality are not part of this visual pass.

## Not in scope

- Azure Entra ID or server-side ranking changes.
- New biome themes or character sprite-sheet production.
- Changing the 90-second starting timer, the 120-second cap, or the +20-second gate reward.
