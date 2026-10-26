# Task: T02 Runner Action Poses

## Status: done

## Follow-up: natural run cycle

- The first pass used four key poses and four independently generated in-between poses. A later follow-up replaced that run row for all four characters with cohesive twelve-pose source sheets (`assets/character/locomotion/*-run-cycle-v3.png`). Lize received a `v4` revision. Yuni's `v4` lacked a visible leg crossover, so a twelve-pose near/far leg guide was used to produce `v5`. That still read as walking; Yuni `v6` uses Toa's strong running poses as the action reference. Rin `v4` also uses Toa's running poses to make the leg crossover and knee drive visible below her skirt. Runtime frames are `run-00` through `run-11` at 96x96; the selector loops them in 768ms. Old source sheets remain as versioned reference assets. The future runner must use the twelve-frame atlas cycle.

## Goal

Correct the four characters' run loops and add legible slide and double-jump animation states required by the runner controls.

## Decision Summary

- Each run loop has four 96x96 frames with visibly alternating lead legs and a complete loop; the current run art is not accepted as final because the legs look uncrossed and stiff.
- Add two slide frames (`slide-00`, `slide-01`) and two double-jump frames (`double-jump-00`, `double-jump-01`) for each character. Preserve existing idle, jump, hurt, start, victory, and game-over poses.

## Implementation

### I01. Refresh all four locomotion sheets and atlas manifests

- Related Files:
  - `assets/character/locomotion/aokumo-rin-locomotion-v2.png` :: Rin walk/run/action sheet; new.
  - `assets/character/locomotion/shizuki-toa-locomotion-v2.png` :: Toa walk/run/action sheet; new.
  - `assets/character/locomotion/ayatsuno-yuni-locomotion-v2.png` :: Yuni walk/run/action sheet; new.
  - `assets/character/locomotion/akane-lize-locomotion-v2.png` :: Lize walk/run/action sheet; new.
  - `src/game/characters/characterAtlas.json` :: Rin frame manifest; new, based on source-ref manifest.
  - `src/game/characters/gothCharacterAtlas.json` :: Toa frame manifest; new.
  - `src/game/characters/wingedCharacterAtlas.json` :: Yuni frame manifest; new.
  - `src/game/characters/akaneCharacterAtlas.json` :: Lize frame manifest; new.
  - `scripts/prepare-character-assets.mjs` :: validate flexible named frame counts and output frame crops; modify.

#### Details

- Define exactly four `run` frames per character in contact/passing/opposite-contact/passing order. Frames 0 and 2 must clearly show opposite legs leading; keep head, torso, and feet inside the cell and align the planted foot to the same floor anchor.
- Define exactly two `slide` frames per character for entry and held-slide pose. Keep the low silhouette inside the collision height and preserve accessory shapes (Rin's long hair, Yuni's wings/horn, Lize's coat/hair) without cropping.
- Define exactly two `doubleJump` frames per character with an unmistakable second-air-action pose. Reuse the established palette and body proportions; do not change character identity.
- Use transparent 96x96 runtime cells. Keep cells on the common 8-column runtime atlas grid. JSON entries use `{name, source, column, row, animation}` and retain unique frame names prefixed by the stable texture key where existing manifests do so.
- Replace the script's hardcoded `frames.length === 24` check with validation that every required animation has its configured minimum/expected frame count, names are unique, and all frames are inside the atlas. Continue validating transparency, source crop dimensions, and edge padding.
- Keep previous image files untouched as versioned source/reference files; update `*-locomotion-v2.png` and runtime outputs instead of overwriting v1.

### I02. Rebuild runtime atlases

- Related Files:
  - `assets/character/runtime/{player-default,goth-student,moonwing,akane-lize}.png` :: packed runtime sheets; regenerated.
  - `assets/character/runtime/{player-default,goth-student,moonwing,akane-lize}.json` :: runtime frame manifests; regenerated.
  - `assets/character/runtime/frames/*.png` :: normalized transparent frames; regenerated.

#### Details

- Each runtime manifest must expose `idle`, `run`, `jump`, `doubleJump`, `slide`, `hurt`, `start`, `victory`, and `gameOver` animation keys for all four characters.
- A run animation has four ordered frames; `slide` and `doubleJump` have two each. Existing animations keep at least one valid frame.
- Check visually at 1x and nearest-neighbor enlarged scale that heads, feet, wings, bows, and long hair do not touch cell edges or reveal adjacent frames.

## Acceptance Criteria

- [x] All four run cycles visibly alternate the leading leg and loop without a foot/torso pop.
- [x] All four characters have complete two-frame slide and double-jump states.
- [x] Frame bounds, transparent backgrounds, atlas coordinates, and animation names validate.
- [x] Existing character states are preserved and remain loadable.

## Validation

- `npm run assets:prepare` — regenerates four atlas outputs.
- `npm run assets:validate` — verifies frame dimensions, alpha, atlas layout, required states, and source crops.

## Commit Message

```text
fix(assets): refine runner motion sheets for all characters

Plan: 2026-10-26-running-action-redesign
Phase: P01-characters-and-entry
Task: T02-runner-action-poses

- Correct opposite-leg run poses and preserve floor anchors
- Add slide and double-jump animation states to all four atlases
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending
