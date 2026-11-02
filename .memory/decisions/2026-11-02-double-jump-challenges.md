# Decisions: Double-Jump Challenge Obstacles

- Date: 2026-11-02
- Status: Confirmed

## D01. Challenge Types and Modes
- **Chosen**: Add both tall high-jump barriers and wide pits that require a double jump, to Endless and Story modes.
- **Rationale**: The game exposes double jump but its obstacle roster currently lets ordinary hazards be cleared with one jump. Both vertical and horizontal challenges give the input distinct purpose.

## D02. Progression
- **Chosen**: Introduce the first challenge after 2,000m in Endless and in the latter half of Story Stage 1; add harder combinations in later Story courses.
- **Rationale**: Preserve the existing 0–1,000m tutorial and 1,000–2,000m practice bands while adding a gradual new skill check.

## D03. One-Time Guidance
- **Chosen**: Show a short double-jump instruction at the first high barrier and the first wide pit during the browser's first-run tutorial; hide later prompts.
- **Rationale**: The player should understand the new requirement before risk while keeping repeat runs visually clear.

## D04. Hazard Pass Presentation
- **Chosen**: On a successful slide dodge, disable the collider and leave the artwork scrolling with the course until it exits the viewport. Do not fade or remove it at the instant of overlap.
- **Rationale**: All hazards should follow the same screen-space lifecycle after a successful pass.

## D05. Physics and Existing Rules
- **Chosen**: Derive challenge dimensions from current physics (jump impulse -420px/s, gravity 900px/s²). Use a tall ground barrier above single-jump clearance and a wide gap beyond single-jump horizontal travel but within a well-timed double jump. Keep geometry, sprite art, and collision rules independent.
- **Rationale**: The new challenges should test the intended action instead of relying on unclear art or accidental collision.
- **Additional rule**: Preserve Hiyori's existing two rescues, including pit rescue. A missed wide pit follows current fatal-fall behavior for other characters and exhausted Hiyori charges.
