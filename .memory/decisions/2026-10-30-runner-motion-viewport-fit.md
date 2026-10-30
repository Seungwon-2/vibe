# Decisions: Giant Run Motion and Viewport Fit

- Date: 2026-10-30
- Status: Confirmed

## D01. Animation while giant is active
- **Chosen**: Show the character's running animation for the entire active giant effect, including while jumping or descending. Keep pit-fall, rescue, hurt, and terminal states controlled by their existing state handlers.
- **Rationale**: Giant has looked like an endless falling pose; a clear running loop communicates the power-up while physics and collision behavior remain code-driven.

## D02. Title and character selection layout
- **Chosen**: Fit the title and character-selection screens to the dynamic browser viewport on desktop and mobile. Compact those screens responsively so the document itself does not scroll or clip their primary controls.
- **Rationale**: The run screen already scales correctly; this work should correct only the title and character-selection layouts while retaining their current content and colors.

## D03. Scope boundary
- **Chosen**: Defer color and theme changes to the next planned task.
- **Rationale**: This pass addresses animation behavior and viewport sizing only.
