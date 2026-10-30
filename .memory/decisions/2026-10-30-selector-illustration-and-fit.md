# Decisions: Selector Illustration and Fit

- Date: 2026-10-30
- Status: Confirmed

## D01. Static card art
- **Chosen**: Use each character's supplied high-resolution `portrait-quality.webp` as a static full-body illustration in the selection card. Do not animate or pixel-render the card illustration.
- **Rationale**: This matches the supplied reference and removes the low-resolution atlas from the still-image area.

## D02. Running animation source
- **Chosen**: Animate only the lower runway, using the 12 supplied high-quality run frames per character at the source's 20 fps cadence. Preserve transparent PNG/WebP rendering without pixelated image-rendering.
- **Rationale**: The asset bundle provides dedicated quality run frames; using the 96x96 runtime atlas caused the visible pixelation.

## D03. Roster fit
- **Chosen**: At wide desktop widths, show all five cards in one row with no wrapping. At narrower widths where five readable cards cannot fit, keep one row and provide horizontal scrolling; never wrap the fifth card into a second row.
- **Rationale**: The reference uses a five-wide card row and the current wrap breaks its composition.

## D04. Existing behavior
- **Chosen**: Retain passive icons and descriptions, accent selection outline, Korean names, selected-name start button, run strip, callbacks, and internal IDs.
- **Rationale**: This task corrects asset resolution and layout while preserving the accepted selector design and game behavior.
