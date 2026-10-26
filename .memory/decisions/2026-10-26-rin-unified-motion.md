# Decisions: Aokumo Rin Unified Runner Motion

- Date: 2026-10-26
- Status: Confirmed
- Branch: `project02`
- Source image: `assets/character/reference/aokumo-rin-motion-study.png` (1536 × 1024 PNG)

## D01. Character and scope
- **Chosen**: Use the supplied motion study as the design and pose source for Aokumo Rin in the existing right-moving 2D running game. Keep the character selector and Shizuki Toa. Replace Ayatsuno Yuni and Akane Lize in the selectable/playable roster with Cogane Rang, Hanayo Hiyori, and Tokino Mary. The target roster has five characters.
- **Rationale**: The runner already exists in Phaser, while Rin currently mixes art from several sheets. The user chose to retain Toa and replace the other two roster members. Their historical source files can remain in Git; roster removal does not require deleting art history.

## D02. Animation inventory
- **Chosen**: Extract the twelve RUN poses in order for a looping run cycle. Use the six poses shown for each of HIT, SLIDE, JUMP, DOUBLE JUMP, VICTORY, and CRY. Keep the sheet's IDLE and CHEER rows available for subsequent animation integration.
- **Rationale**: The user explicitly requested twelve run frames and animated action poses. The source sheet provides six labeled poses for each requested action.

## D03. Sprite format and alignment
- **Chosen**: The game atlas contains only character artwork, with genuine transparent backgrounds and no sheet title, labels, icons, shadows, or grid. Normalize each action to equal-sized frames and one consistent visual scale and anchor. Validate that hair, limbs, and shoes do not touch frame edges or bleed into neighboring frames.
- **Rationale**: Equal frame size and pivot prevent the cutting and movement jumps seen in the previous mixed-source art. Retain source art separately from runtime atlas output.

## D04. Slide behavior
- **Chosen**: Play a short slide entry animation, then hold the lowest pose while the slide input remains down. On release, return to running. Keep the visual feet on the ground.
- **Rationale**: The user previously found a continuously cycling slide to look like squirming and selected the held-low-pose behavior.

## D05. Result animation
- **Chosen**: Show VICTORY when the run exceeds that player's locally stored best distance; show CRY for other completed runs. Distinguish the first recorded run as a new best. Persist the personal best in local browser storage during local play.
- **Rationale**: This distance-runner has no stage-clear endpoint. A personal record gives VICTORY a clear trigger and uses both requested result animations.

## D06. Physics and renderer boundary
- **Chosen**: Continue managing jump impulse, maximum jump count, vertical position, standing/slide collision bodies, obstacle hits, and timer in code. Changing artwork or animation timing must not change those gameplay values. Preserve the right-facing runner and existing touch/keyboard controls.
- **Rationale**: The current `RunnerPlayer`, `runnerPose`, and `RunnerSimulation` already separate physics from art; the new atlas should respect that boundary.

## D07. Character source sheets and colors
- **Chosen**: Use `assets/character/reference/aokumo-rin-motion-study.png`, `shizuki-toa-motion-study.png`, `cogane-rang-motion-study.png`, `hanayo-hiyori-motion-study.png`, and `tokino-mary-motion-study.png` as the five character motion references. Names are Aokumo Rin, Shizuki Toa, Cogane Rang, Hanayo Hiyori, and Tokino Mary. Preserve Rin `#2b66c0` and Toa `#513661`; use sheet-palette representative colors Rang `#c98743`, Hiyori `#fca6d0`, and Mary `#6d929a`.
- **Rationale**: The four newly supplied filenames resolve the line-wrapped English names in the message. The user chose palette-derived colors for the three new characters.

## D08. New character passives
- **Chosen**: Retain Rin's +1-second time-pickup bonus and Toa's 150ms slide-release grace. Give Rang +8% second-jump impulse, Hiyori +20px pickup collection radius, and Mary +250ms protection after a collision. Keep values in central code configuration for later tuning.
- **Rationale**: The user chose distinct, modest passive abilities for all three new characters during planning. Hiyori's radius must be tuned so the optional upper pickup row still requires a jump.

## Existing-code findings for the implementation plan
- `src/game/characters/characterAtlas.json` currently has twelve run frames, one jump frame, two double-jump frames, two slide frames, three hit frames, three victory frames, and three game-over frames for Rin. The source paths point to multiple art batches.
- `src/game/runner/RunnerScene.ts` currently creates a single held slide frame and does not register victory as a runner-scene animation.
- `src/game/runner/RunnerPlayer.ts` always plays `gameOver` on finish. The current result screen does not store or evaluate a local personal best.
- `scripts/prepare-character-assets.mjs` already builds transparent 96 × 96 atlas frames and checks edge padding. Its per-frame resizing and mixed anchors need review for this unified sheet.
- `.memory/current.md` still points to P03-T01 biome pixel art. A new plan should make this motion work the active task without marking the unfinished biome task complete.
- The current four-character registry and selector need a five-character roster update when implementation begins. Toa remains available; Yuni and Lize should no longer appear as choices.

## Input and verification notes
- The original PNG is present at the source path above. Its background is pale rather than transparent, so frame extraction needs visual inspection of edge cleanup, especially near white hair and frills.
- The four additional PNGs are present at their D07 paths. All five sheets are 1536 × 1024 without an alpha channel and share twelve RUN cells plus six cells for each other labeled motion row. Extraction must also exclude label bars, icons, dust trails, sparkles, and cell boundaries while preserving character-specific costume and held props.
- The image-generation cutout drafts made during the interview changed poses and introduced residue; they were not added to the repository and are not selected as the production source.
