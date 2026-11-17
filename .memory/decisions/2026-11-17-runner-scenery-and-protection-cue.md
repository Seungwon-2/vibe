# Decisions: Runner scenery and protection cue

- Date: 2026-11-17
- Status: Confirmed

## D01. Background scope
- User chose: rebuild theme artwork with large readable forms; retain calm fixed far/middle scenery and minimal ground movement.
- Code-derived: preserve standard parallax comparison, cached textures and collision/placement geometry. Code-native Graphics art is appropriate; no bitmap generation or higher render resolution required.
- Four themes: dawn roofline/clock tower, moonlit tree canopy, faceted cavern/crystals, floating sky islands/arches. Keep the lower running lane quiet and background edges lower contrast than hazards.

## D02. One-second protection cue
- User requested a visible character effect. Use two gradual opacity pulses (0.5–1 alpha) over the existing 1s recovery, without changing run/jump/slide animation or collision state.
- Reduced motion uses fixed translucent character and existing protection HUD label, no pulse. Keep ordinary hit protection behavior separate; no new camera/glow/particle effect.
- Derive cue from snapshot.giantRecoveryRemainingMs, so pause/continuation stay consistent. Preserve expiry and passive/pit rules from previous decision.

## D03. Validation and delivery
- Automated regressions, source-driven static artwork preview and local5175 check. Static preview is artwork inspection, not live frame-time measurement.
- project02 local commits only; actual user comfort and real-device performance remain pending. No production push/deploy.
