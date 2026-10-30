# Decisions: Runner Modes, Progression, and Cosmetics

- Date: 2026-10-30
- Status: Confirmed

## Goal

Expand the runner into two complementary modes: a harder endless run for distance records and a four-course story campaign with lives, stage unlocks, challenges, achievements, and cosmetic rewards. Keep Azure sign-in and cloud storage deferred; local play and progression must work offline.

## D01. Modes and navigation
- **Chosen**: Keep Endless mode and add Story Stage mode. Navigation is Title → Mode Select → Character Select → Stage Select for Story mode; Endless starts after character selection.
- **Rationale**: Both play styles share the runner and character roster while giving players distinct goals.

## D02. Endless mode difficulty
- **Chosen**: Keep the current 90-second timer and existing gate, time-pickup, giant, and ranking rules. Preserve the first 1,000m as the control tutorial, then increase obstacle-wave frequency and speed progression while retaining safe reaction and recovery windows.
- **Rationale**: Endless should provide a higher challenge after the onboarding section without removing the established run loop.

## D03. Story course structure
- **Chosen**: Create one fixed-length course for each existing biome, in order: Dawn City 2,500m, Moonlit Forest 3,000m, Crystal Mine 3,500m, and Cloudtop Skyway 4,000m. Story courses have no countdown; reach the finish to clear the stage. Stages unlock sequentially. Keep narrative content as planning only for this implementation.
- **Rationale**: Different course lengths provide a gradual campaign while keeping the four established themes.

## D04. Story lives and collision response
- **Chosen**: Start each stage with three lives. A normal obstacle collision removes one life, plays the hit animation, and grants 0.8 seconds of invulnerability before running resumes. Losing all three lives opens a failure screen with Retry Stage and Stage Select actions. Falling into a pit immediately fails the stage, except when Hiyori's protection is available.
- **Rationale**: The three-hit rule provides recovery opportunities while preserving the pit as a high-stakes hazard.

## D05. Hiyori protection in Story mode
- **Chosen**: Hiyori receives two protection charges per stage. A charge blocks a regular collision or a pit fall; a protected pit triggers a safe recovery and consumes one charge. Without a remaining charge, a pit immediately fails the stage.
- **Rationale**: Preserve Hiyori's defensive identity while retaining the pit's danger for other characters and after charges are used.

## D06. Story pickups and gates
- **Chosen**: Convert time pickups in Story mode into a 3-second, +15% course-speed boost. Gates act as course landmarks rather than time rewards. Keep the existing giant item behavior in both modes: six seconds of protection from ordinary obstacles, no pit protection.
- **Rationale**: Time extensions have no meaning without a countdown; a temporary speed boost gives those placements a useful effect.

## D07. Giant item follow-up
- **Chosen**: Revisit giant-item placement and frequency, especially around dense obstacle sections, and review its visual size, running animation, and visual effects. Preserve the six-second effect and its ordinary-obstacle-only protection unless playtesting shows a concrete issue.
- **Rationale**: Keep the existing power-up identity while addressing the player's request to refine both its pacing and presentation.

## D08. Story progression and character unlocks
- **Chosen**: Aokumo Rin is the only character available at the start. First clears unlock characters in this order: Stage 1 Hanayo Hiyori, Stage 2 Tokino Mary, Stage 3 Shizuki Toa, Stage 4 Cogane Rang. Once unlocked, a character can be selected in both modes. Show all five characters in the selector; locked cards are disabled and display their unlock condition. Future characters require completed motion assets and one tunable passive in the central ability configuration.
- **Rationale**: Story progress gives the roster a clear unlock path while preserving the same characters and passives in Endless mode.

## D09. Story challenges and rewards
- **Chosen**: Each stage has two optional first-clear challenges: finish without taking a hit and collect the configured coin target. First completion unlocks the next stage; each challenge grants its cosmetic reward once. The clear screen shows collected coins and challenge progress, with Next Stage and Stage Select actions. Failure still awards all collected coins; first-clear/challenge rewards cannot be farmed by replaying.
- **Rationale**: Clear progression stays straightforward while optional mastery goals reward replay.

## D10. Achievements
- **Chosen**: Add one-time achievements spanning distance, cumulative coins, gates, no-hit runs, and character-specific play. Achievement rewards include coins and some exclusive cosmetics. Show an achievements list and progress from the Title and Stage Select screens, and announce achievements when earned.
- **Rationale**: Multiple goal types give players long-term objectives in both modes.

## D11. Coins and local persistence
- **Chosen**: At the end of every run or stage attempt, add all collected coins to a persistent wallet exactly once, including pit or stage failures. Keep per-run collected coins separate for run results and Endless ranking. Save wallet, unlocks, equipped cosmetics, achievements, and story progress in browser local storage; keep a storage boundary that can later move to account-backed Azure persistence.
- **Rationale**: Offline play remains useful, and earned currency is not lost when a run ends unsuccessfully.

## D12. Rankings
- **Chosen**: Endless mode remains the only ranked mode. Rank by distance, then collected coins. Story mode saves stage progress and challenge completion but does not enter the distance leaderboard.
- **Rationale**: Fixed-length courses and no countdown use different success criteria from Endless distance runs.

## D13. Coin routes and near-miss feedback
- **Chosen**: Keep the frequent safe-route coin stream and add short optional coin rows immediately after jumpable obstacles, with enough landing room and no visual or collision overlap with hazards or gates. A near miss gives a brief visual/audio cue and a run-score bonus shown in results; it does not grant wallet coins or change leaderboard ordering.
- **Rationale**: Add optional skill rewards without creating a currency farming route or changing competitive rankings.

## D14. Coin shop and cosmetics
- **Chosen**: Add a shop accessible from the Title and Character Select screens. Sell character skins, runner trails/effects, and profile decoration; purchases are owned account-wide and can be equipped per character. Cosmetics do not alter gameplay stats. Newly added playable characters are unlocked through Story stages, not purchased. Aim for a first cosmetic purchase after about 1–2 average Endless runs and rare cosmetics after about 5–8 runs; keep prices and rewards centrally tunable.
- **Rationale**: Cosmetics provide a meaningful use for the coin wallet without selling performance advantages.

## D15. Cosmetic effects and asset format
- **Chosen**: Equipped runner effects show a subtle trail during normal running and become more pronounced during jumps and speed boosts. Skins replace the full action set and must match the current frame size and pivot. Source skin assets go in `assets/character/cosmetics/skins/<character-id>/<skin-id>/`; runner-effect assets use `assets/character/cosmetics/effects/<effect-id>/`. The user will provide the skin and effect assets separately.
- **Rationale**: Compatible frames preserve animation alignment, collision geometry, and visual consistency across actions.

## D16. Preserve character passive identities
- **Chosen**: Keep the five existing passive identities and central tuning approach: Rin speed, Hiyori protection, Mary pickup range, Toa slide protection, and Rang second-jump height. Passives remain available in both modes, with Hiyori's Story protection reset per stage.
- **Rationale**: Modes share character identity and can be tuned without duplicating per-character gameplay logic.

## Deferred

- Azure Entra ID, cloud wallets/progression, and cloud rankings.
- Narrative dialogue/cutscenes in the Story campaign.
- Actual shop stock and final prices pending the user's skin and runner-effect assets; shop infrastructure and data format can be prepared first.
- Final obstacle density, speed progression, coin targets, achievement thresholds, and giant-item placement values are initial tuning values to validate in local play.
