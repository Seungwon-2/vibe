# Decisions: Stage and Mode Card Art

- Date: 2026-11-03
- Status: Confirmed

## D01. Progression content sizing
- **Chosen**: Keep the shared viewport frame, but cap mode and stage selection content at approximately 1,400px and use content-sized panels/cards rather than stretching them to fill all available height.
- **Rationale**: The outer frame remains consistent with character selection while the content density stays comfortable on wide monitors.

## D02. Stage card backgrounds
- **Chosen**: Add a distinct illustrated preview to each of the four stage cards, based on the corresponding existing biome palette and silhouettes. Build previews as lightweight code-based SVG visuals; do not add external image dependencies.
- **Rationale**: The game already defines the four visual themes in code, and these can be represented consistently without requiring new artwork files.

## D03. Stage card content and layout
- **Chosen**: Use a 2×2 desktop grid with scene art, stage number/name, distance, coin target, and clear/locked status. Keep selection and start actions unchanged. Stack cards on narrow screens.
- **Rationale**: The stage cards become scannable and theme-identifiable while retaining current progression behavior.

## D04. Mode selection
- **Chosen**: Present endless and story modes as two centered, equally sized cards with distinct visual accents, concise mode details, and compact calls to action. Use a max-width content region; stack cards on narrow screens.
- **Rationale**: A deliberate card size and richer hierarchy avoid the current stretched, sparse appearance.

## D05. Responsive behavior
- **Chosen**: Keep the shared outer frame and safe-area spacing. Let card content reflow at existing responsive breakpoints, preserving internal scrolling only when viewport height requires it.
- **Rationale**: Desktop, tablet, and mobile keep the same visual language without forcing oversized controls or clipping text.
