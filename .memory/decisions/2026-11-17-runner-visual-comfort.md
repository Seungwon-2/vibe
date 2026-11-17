# Decisions: Runner Visual Comfort

- Date: 2026-11-17
- Status: Confirmed — user approved the recommended execution sequence.

## D01. Scope approved by the user
- First compare the existing presentation with a calmer presentation, then measure and fix demonstrated stalls, and evaluate speed/difficulty only after play feedback.
- Preserve physics, collisions, actual speeds, item rewards, course schedules and ranking rules in this implementation. No engine replacement or new sprites.

## D02. Implementation choices derived from current code
- Default presentation `calm`; retain `standard` for same-course comparison in the pause menu. Browser-local preference only; storage failure cannot interrupt play. No account/server schema change.
- Calm mode: stationary far scenery, reduced middle parallax, unchanged ground movement, quieter backdrop colors/details, no screen-wide gate streaks/giant pulse, no fatal-pit shake. Keep essential HUD effects and readable hazards.
- Preserve cosmetic ownership and show a smaller steady trail in calm mode. Honor OS reduced-motion independently, including when standard is selected.
- Changing presentation while paused must not reconstruct Phaser or reset the run/checkpoint.
- Existing background transition synchronously generates textures. Measure it, then cache per-scene backdrop textures before countdown, share them between active/outgoing sets, release once on teardown.

## D03. Verification boundary
- Record reproducible browser frame-time/update costs for both modes, covering boost and theme transitions. Headless results are a developer comparison, not proof of comfort or real-device GPU performance.
- New task supersedes the previous waiting state only for this approved work. Preserve unfinished feedback-recovery P03-T04 as a return pointer.
- No automatic deployment from this work; commit on project02 and provide local preview for comparison. Pushing the auto-deploy branch needs a deliberate release step after comparison.
