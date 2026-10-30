# Decisions: Selector Viewport and Game Sprites

- Date: 2026-10-30
- Status: Confirmed

## D01. Selector screen fit
- **Chosen**: Fit the character selector inside the viewport height with no document-level vertical scrolling. Keep the five cards in one row on landscape/desktop; at very narrow widths allow the card rail itself to scroll horizontally, while the surrounding page stays fixed to the viewport.
- **Rationale**: The current selector still wraps into multiple rows and grows taller than the browser. Five full passive cards cannot stay readable on narrow portrait widths, so only that rail may scroll.

## D02. In-game animation quality
- **Chosen**: Use the title asset's source quality motion frames for all available gameplay actions for all five characters: run, hit, slide, jump, double jump, victory, and cry/game-over. Keep game motion and collisions code-driven; do not use image dimensions to calculate physics.
- **Rationale**: Runtime currently renders 96×96 atlas cells. The supplied source pack has 192×192 Rin frames and 384×384 frames for the other characters; its quality frames are already transparent and consistently aligned.

## D03. Motion mappings and size
- **Chosen**: Map the source `hit` sequence to runtime `hurt`, `double` to `doubleJump`, and `cry` to `gameOver`. Keep existing 96px logical character size and collision boxes by applying source-scale factors (0.5 for Rin, 0.25 for other characters) and normalizing body dimensions/offsets by the effective sprite scale. Use the source pivot (Rin y=180/192, others y=360/384) to align feet to the same ground baseline.
- **Rationale**: Higher-resolution frames must not enlarge player art or collision boxes. Animation is visual; jump trajectories and hazard collision data remain unchanged.

## D04. Legacy atlas
- **Chosen**: Preserve the generated 96×96 atlas and metadata as a fallback/reference for existing systems, but route the live Phaser player and result animation preview through quality frame assets.
- **Rationale**: This limits migration risk while removing low-resolution rendering from the visible runner and result character.
