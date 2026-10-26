# Decisions: Running Action Redesign

- Date: 2026-10-26
- Status: Confirmed

## Goal

Redesign the current platformer as a lightweight, Cookie Run-inspired 2D running action game. Preserve the four character designs, sprite sheets, animation work, and character-selection experience while replacing platforming, stages, bosses, and checkpoints with one continuous timed course.

## Placement in the project plan

- This redesign supersedes pending platformer-focused work in `.memory/current.md`, including the old stage-presentation follow-up.
- Carry forward the four-character run-cycle correction and the character-selector animation work as tasks in the new runner plan; do not discard those requirements.
- Keep Azure Entra ID integration deferred. The runner must be playable locally first, with a future cloud ranking path behind the existing gateway boundary where practical.
- The next step is `/memory-plan running-action-redesign`. Planning must not implement game code.

## Confirmed decisions

1. **Genre and run loop:** Remove platformer movement, platform routes, stage selection, checkpoints, lives, enemies, and boss fights from the new run loop. Provide one continuous auto-running course. The player jumps or slides around obstacles and tries to cover the most distance before the countdown reaches zero.
2. **Camera and orientation:** Use a 2D horizontal side view. Keep the runner near the left side while scenery and hazards move toward the player. Use landscape layout on mobile and desktop.
3. **Run timing and speed:** Start with 90 seconds after a 3-second start countdown. Increase the existing run speed gradually from 250 to 325 over the normal run; when time bonuses extend a run beyond the ramp, hold at the cap. End the run when remaining time reaches zero.
4. **Controls:** Desktop uses Space or Up Arrow to jump and Down Arrow to slide. Mobile provides on-screen jump and slide buttons. A jump press starts one jump; one additional jump is allowed while airborne. Reset the extra-jump allowance on landing. Sliding is available only while grounded and remains active while its button is held.
5. **Collision penalty and recovery:** A hazard collision removes 5 seconds and staggers the runner for 0.8 seconds. Collision protection lasts only for that 0.8-second stagger. There is no life counter; if the penalty reduces the timer to zero, the run ends.
6. **Obstacle set and difficulty:** Use ground obstacles that require jumping and overhead obstacles that require sliding. Start with widely spaced single hazards, then introduce readable jump/slide combinations and gradually shorten spacing as distance increases. Author patterns so each is avoidable with the available jump, double-jump, and slide actions and provides recovery time after a successful dodge or collision.
7. **Distance and difficulty pacing:** Display and record distance in meters. Pace the course at roughly 2,500 meters per 30 seconds at the initial speed so a normal 90-second run can encounter all four themes and all three bonus gates. Increase difficulty by distance; speed ramps from 250 to 325 as above.
8. **Time pickups and cap:** A time pickup is collected on contact and adds 3 seconds. The timer cap is 120 seconds; excess time above the cap is discarded.
9. **Bonus gates:** Place three one-time, visible time gates at 2,500m, 5,000m, and 7,500m. Passing each adds 20 seconds, subject to the 120-second cap. Do not repeat these rewards after the third gate.
10. **Coins:** Collect coins on contact. Record collected coins as a secondary run result and ranking tiebreaker; coins do not buy upgrades or affect character performance. Put some coins and time pickups on the safe route and some as optional jump rewards. Do not require risky pickups to progress.
11. **Course themes:** Create four new running-course themes in this order: dawn city, moonlit forest path, crystal mine, and cloud-top skyway. Transition the theme at 2,500m intervals so the gates also serve as visible course landmarks. Use the previously selected editable, code-based pixel-art approach for scenery.
12. **Character selection:** Keep the four existing characters, character portraits, SD sprites, and symbolic-color selection treatment. The later visual reference update below replaces the four equal-width vertical-card layout with a selected-character showcase and compact four-card roster. Roster previews show front-facing idle; the selected hero repeatedly plays the run animation. The start button begins the 3-second countdown and enters the run directly, with no world or stage map.
13. **Character passives:** Give each character one small passive while keeping the shared runner controls and core loop. Initial tunable values: Aokumo Rin receives +1 second from each time pickup (3s base becomes 4s); Shizuki Toa keeps the slide collision pose for 0.15 seconds after slide input is released; Ayatsuno Yuni gets +12% upward impulse on the second jump; Akane Lize loses 4 seconds instead of 5 on a collision. The stagger/protection duration remains 0.8 seconds for everyone.
14. **Ability balance controls:** Define passive values in one centralized character-ability configuration so they can be tuned during balancing without changing individual gameplay systems. Do not add a player-facing ability-strength setting. Keep all four characters in one leaderboard and tune the effects toward similar expected distance benefit.
15. **Pause:** Pause stops the timer, runner, hazards, pickups, and scenery motion. Resume continues the same run state.
16. **Run results:** At zero time, show distance, collected coins, and the local best distance. Offer retry with the same character or return to character selection.
17. **Ranking and persistence:** Rank runs by distance, then by coins for ties. Save local results in the browser for offline play. When Azure Entra ID and cloud persistence are added later, use one unified leaderboard across all four characters and authenticated users.

## Visual reference update (2026-10-26)

- The user-provided first image is a **composition reference** for the run: a side-view runner near the lower-left, a continuous ground strip, dense but layered scenery, readable obstacle and pickup silhouettes, a compact top HUD, and translucent Jump/Slide controls near opposite bottom corners. Adapt this to the four already chosen biomes and the 960x540 runner canvas; do not introduce platforms, pits, enemies, or screenshot-specific scenery.
- The second image is a **composition reference** for character selection: a large selected-character showcase on the left and a compact portrait roster on the right, with an emphatic selection frame and one primary start action. Adapt its roster to the existing four characters (2x2), retain each portrait, SD preview, visible name, symbolic accent color, selected-character run animation, back action, and confirmation flow.
- The reference's rarity, level, price, upgrade, currency, and unlock labels are not part of Project 02. The selector shows the selected passive in plain language without adding progression data or a shop.
- Use original project art and code-based pixel scenery; the screenshots are layout and mood references only. Keep previously decided gameplay values, biome order, hazards, pickups, and 2,500m gates.
- Work into the existing runner plan rather than starting a second active plan. P02 remains the next implementation step; P03's pending tasks carry the stage/HUD presentation and a new selector-showcase task. Keep `.memory/current.md` at P02-T01.

## Existing implementation constraints to carry into the plan

- The current client uses React with Phaser; keep the visual game in Phaser and the surrounding screens in React unless code inspection reveals a concrete blocker.
- Existing character movement tuning uses run speed 250, jump velocity -420, a 96x96 frame, and a 40x76 collision body. Re-evaluate the body against the new runner poses and double-jump arc; do not assume the old platform collision box is accurate for sliding.
- Treat the character passive values above as initial balancing values, not immutable constants. Preserve each passive's identity while tuning its value against distance outcomes in the unified leaderboard.
- Preserve the selected character across the selector, countdown, run, result, and retry flows.
- Keep the game gateway boundary so local browser storage can be replaced or extended for future Entra-backed ranking.

## Out of scope

- Azure Entra ID login and cloud leaderboard implementation in this iteration.
- Platform layouts, stage maps, checkpoints, lives, bosses, stomp combat, and platformer enemy systems.
- Player-controlled ability-strength settings, coin shops, unlock progression, and additional power-up types beyond time pickups.
- Portrait orientation; the game uses landscape on both mobile and desktop.

## Implementation details delegated to the plan

- Choose collision-box dimensions that fit each character's run, jump, double-jump, and slide poses, and align visible hazards with their collision shapes.
- Define deterministic authored hazard patterns, safe minimum spacing, pickup placement, and distance-based pattern progression.
- Use the 2,500m/30-second pacing target as a tunable gameplay scale rather than implying real-world running speed.
- Preserve mobile input accessibility and prevent held inputs from leaking across pause, result, or retry state transitions.
