# Plan: Unified Runner Motions and Five-Character Roster

## Goal

Turn the five supplied 1536×1024 motion studies into reproducible, transparent, aligned game sprites, then make Rin, Toa, Rang, Hiyori, and Mary selectable and playable in the existing right-moving runner. Each character gets a 12-frame run loop and six source poses for hit, slide, jump, double jump, victory, cry, idle, and cheer. The active run uses a short slide entry followed by a held low pose. A new personal distance record plays victory; other completed runs play crying. Jump impulses, timer, obstacles, and collision dimensions remain code-owned.

## Confirmed source and roster

| Character | ID | Sheet | Accent |
| :--- | :--- | :--- | :--- |
| Aokumo Rin | `player-default` | `assets/character/reference/aokumo-rin-motion-study.png` | `#2b66c0` |
| Shizuki Toa | `goth-student` | `assets/character/reference/shizuki-toa-motion-study.png` | `#513661` |
| Cogane Rang | `cogane-rang` | `assets/character/reference/cogane-rang-motion-study.png` | `#c98743` |
| Hanayo Hiyori | `hanayo-hiyori` | `assets/character/reference/hanayo-hiyori-motion-study.png` | `#fca6d0` |
| Tokino Mary | `tokino-mary` | `assets/character/reference/tokino-mary-motion-study.png` | `#6d929a` |

Yuni and Lize leave the selectable/playable roster. Their historical art can remain in Git but no active code may import their atlases. The four new sheet files and Rin sheet are already committed on `project02`.

## Character passives

Rin's +1-second time pickup and Toa's 150ms slide-release grace stay as implemented. The user chose three new centrally tunable passives for this plan: Rang's second-jump impulse +8%, Hiyori's pickup radius +20px, and Mary's post-collision protection +250ms. Hiyori's wider pickup area must not make the optional upper row collectible while grounded. These are gameplay-code settings, independent from sprite scale or jump art.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Build and visually validate 60 aligned transparent frames and one runtime atlas for each of the five source sheets. | [P01](../phases/2026-10-26-rin-unified-motion/P01-motion-assets/phase.md) |
| P02 | `done` | Replace the playable roster, wire the new animations and slide pose, and show personal-best victory or crying on completion. | [P02](../phases/2026-10-26-rin-unified-motion/P02-character-runtime/phase.md) |

## Execution order and boundaries

1. P01-T01 prepares the five atlases and the three missing selector portraits. It preserves source PNGs and produces the run frames as the first contiguous atlas row because `CharacterPreview` reads that row through CSS steps.
2. P02-T01 updates the registry, passives, selector, runner animations, pose alignment, and affected tests together. Removing two `CharacterId` values in isolation would otherwise leave the runner tests and pose map broken.
3. P02-T02 stores per-character best distance, chooses terminal victory/cry once, and presents the outcome without obscuring the sprite.

The older `2026-10-26-running-action-redesign` plan resumes at P03-T01 after this plan. Its P03-T04 four-card selector blueprint and P04 ranking blueprint must be reconciled with the current roster before those tasks resume. P04's unified top-ten ranking is separate from this plan's per-character best-distance trigger; avoid two competing definitions of personal best.

Later sprite intake made Rin, Hiyori, and Mary the active playable set. Toa and Rang remain visible as `준비 중` until their matching sprite folders arrive. P02's runtime and per-character result flow is complete for the active set; the five-character completion evidence below remains a target for the deferred assets.

## Completion evidence

- `npm run assets:prepare`, `npm run assets:validate`, `npm test`, `npm run typecheck`, `npm run build`, and `npm run lint` pass on `project02`.
- Inspect transparent frame contact sheets and actual runner playback for all five characters; verify a full 12-frame leg/arm cycle, no source labels or grid, no frame clipping, no visual slide hovering, and no floating terminal pose.
- Test the selector at desktop and narrow widths and a complete run for each character; verify old saved Yuni/Lize IDs fall back safely to Rin.

## Outside this plan

- Four-biome scenery, overall HUD redesign, the later showcase-style selector layout, unified top-ten ranking, Azure sign-in, and cloud ranking remain in the earlier running-action plan.
- Passive upgrades, unlocks, or player-facing tuning controls are not included; the five fixed passive values live in the central character configuration.
