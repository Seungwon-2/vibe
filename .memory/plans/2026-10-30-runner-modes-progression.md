# Plan: Runner Modes, Progression, and Cosmetics

## Goal

Add an offline-first Story campaign alongside the harder Endless mode. Story has four finite biome courses, lives, unlock progression, optional challenges, achievements, and cosmetic rewards. Add a persistent coin wallet and a cosmetic shop with per-character equipment. Keep Endless as the only ranked mode. Azure account storage and Entra ID remain deferred.

## Confirmed Rules

- Navigation: Title → Mode Select → Character Select → Story Stage Select (Story only). Endless starts after character selection.
- Endless retains its 90-second run, five 2,000m gates, time pickups, six-second giant item, and ranking by distance then coins. Keep the first 1,000m as tutorial; increase later wave frequency and speed progression while preserving safe response and recovery windows.
- Story courses: Dawn City 2,500m, Moonlit Forest 3,000m, Crystal Mine 3,500m, Cloudtop Skyway 4,000m. No countdown; gates are landmarks; time pickups become +15% speed for 3 seconds. Giant remains six seconds and blocks ordinary obstacles only.
- Each Story stage starts with three lives. Ordinary hits consume one life and grant 800ms invulnerability. Three hits fail the stage. Pits fail immediately unless Hiyori has a protection charge; she starts each stage with two charges, and a pit save returns her safely to the course. Giant does not protect from pits.
- First clears unlock stages and characters in order: Hiyori, Mary, Toa, Rang. Only Rin is initially unlocked. Unlocked characters work in both modes. Locked selector cards remain visible and explain their unlock condition.
- First-clear challenges: no-hit finish and configurable coin target; each awards a cosmetic once. A failed attempt deposits all collected coins; rewards cannot be farmed on replay.
- Achievements cover distance, cumulative coins, gates, no-hit, and character-specific goals. Rewards may include coins or exclusive cosmetics. Show achievements on Title and Stage Select and notify on unlock.
- Shop opens from Title and Character Select. It sells skins, runner trails/effects, and profile decorations. Purchases are shared; equipment is per character. Cosmetics are visual only. User will provide skin/effect assets later.
- Runner effects are subtle while running and stronger on jumps/speed boosts. Skin frame sizes and pivots must match the current runtime format. Source paths: assets/character/cosmetics/skins/<character-id>/<skin-id>/ and assets/character/cosmetics/effects/<effect-id>/.
- Collected coins are deposited once on any run/stage finish, including failures. Story is excluded from rankings. Near-miss adds run score and audiovisual feedback only; no wallet coins and no leaderboard change.
- Keep frequent safe-route coins and add short optional coin rows after jumpable hazards with safe landing room. Avoid visual and collision overlap with hazards/gates.
- Story copy/cutscenes are planning only. Giant pacing/placement and size, running animation, and VFX are a gameplay-phase follow-up.
- Save wallet, unlocks, stage progress, achievements, cosmetics, and equipment in localStorage behind a storage interface that can later be replaced by Azure account persistence.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | in_progress | Define mode/stage domain state, local profile storage, and navigation. | [P01](../phases/2026-10-30-runner-modes-progression/P01-mode-and-profile-foundation/phase.md) |
| P02 | pending | Implement Story simulation, finite courses, lives/pits, and Endless pacing. | [P02](../phases/2026-10-30-runner-modes-progression/P02-runner-mode-gameplay/phase.md) |
| P03 | pending | Implement wallet settlement, progression, challenges, and achievements. | [P03](../phases/2026-10-30-runner-modes-progression/P03-progression-and-rewards/phase.md) |
| P04 | pending | Add cosmetic catalog/equipment, shop screens, and equipped running effects. | [P04](../phases/2026-10-30-runner-modes-progression/P04-cosmetic-shop/phase.md) |

## Deferred

- Azure Entra ID, cloud profile migration, cross-user ranking service, and Story dialogue/cutscenes.
- Final balance values for coin targets, shop prices, achievements, Endless difficulty, and giant-item placement pending local play.
- Skin and runner-effect image assets pending user delivery. Implement data-driven catalog/equipment and graceful placeholders first.

## Execution Notes

- Execute one Task at a time through .memory/current.md.
- Keep commits on project02 and use the exact message in each Task blueprint.
- Existing unrelated working-tree changes must remain untouched.
