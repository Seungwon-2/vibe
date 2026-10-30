# Decision: Character Selector Layout Modes

## Context

The selector currently changes its card grid and artwork size through overlapping media queries. This creates inconsistent character scale and crops roster sprites on some viewport sizes.

## Decisions

- Keep responsive behavior, but use three explicit composition modes rather than continuously scaling the entire screen.
- Wide desktop: left showcase and right three-column roster; center the fifth card on the second row.
- Tablet and compact landscape: retain the side-by-side showcase and roster, with compact three-column cards and consistent artwork bounds.
- Portrait: compact showcase above a two-column roster; permit vertical scrolling when the viewport cannot fit all five cards and the start action legibly.
- Give every roster card the same sprite display box and visual scale. Keep artwork fully visible inside its art region; do not crop it to fill the card.
- Keep functionality, character order, colors, and game screen sizing unchanged.
- Keep title artwork assets in `public/assets/title/`, referenced at runtime with `/assets/title/{filename}`.

## Consequences

- Desktop and tablet layouts remain stable at common sizes while genuinely short portrait screens can scroll rather than clip names, art, or the start button.
- New title image assets can be added as static files without embedding binary data in application code.
