# Decision: Screen Frame Unification

## Context
The stage selection and gameplay screens use narrower, differently sized outer frames than the character selector. The stage selector also has a plain gradient backdrop, while the character selector reuses the title illustration.

## Decisions
- Use the character selector's full-viewport shell as the shared framing reference across mode/stage selection, gameplay, results, and rankings: consistent viewport gutters, a 2048px maximum content width, and a full-height main panel where a panel is used.
- Apply the same title illustration backdrop and pale overlay to progression screens, including stage selection. Keep the content panel opaque enough for text contrast.
- Let gameplay UI use the shared 2048px shell width, while keeping the Phaser playfield at its existing 16:9 aspect ratio and sizing it within the remaining viewport space. Never stretch the canvas to match a page panel.
- Keep small-screen safe-area padding and internal scrolling for long utility screens such as achievements and the shop.

## Out of Scope
- No changes to game simulation, HUD contents, stage layout, or character selector card arrangement.
