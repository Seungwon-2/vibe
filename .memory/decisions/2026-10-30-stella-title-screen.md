# Decision: Stella Runner Title Screen

## Context

The user supplied a standalone title-screen prototype under `public/assets/title/stella-runner-start-screen (1)/`. Its visual direction is a full-bleed group illustration, large Stella Runner branding, and a bottom start dock. The prototype also contains download links and a fan-made demo disclaimer, which should not appear in the application.

## Decisions

- Rebuild the title screen in the existing React application using its current menu callbacks and dialogs.
- Use the supplied `assets/hero.webp` as the title background, copied to the stable path `public/assets/title/title-hero.webp`.
- Follow the reference composition: full-viewport art, legible overlay, brand/title at the upper portion, and a bottom dock for the play action and menu utilities.
- Keep local ranking, sound settings, effect credits, record status, and control help available.
- Do not add download links or the standalone prototype/fan-made explanatory message.
- Keep the new title treatment responsive for desktop and mobile; preserve the character selector and gameplay screens.

## Consequences

- The title uses the supplied illustration offline from the repository's public assets.
- The reference's independent HTML and JavaScript game are not embedded; only its visual direction and title art are used.
