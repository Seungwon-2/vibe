# Decision: Endless Defeat Pose

## Goal
When Endless mode loses its final life, keep the runner game-over pose visible briefly before opening the result screen, matching Story mode.

## Decisions
- Use the existing one-second defeat-pose delay from `RUNNER_CONFIG.storyDefeatHoldMs` for any `lives-exhausted` result, regardless of mode.
- Stop gameplay immediately when the simulation finishes, clear held inputs and trail particles, play the character's game-over animation, then emit the result after the hold.
- Preserve immediate result transitions for Endless timeout and other non-life-exhaustion endings.
- Keep Story stage-complete victory timing unchanged.
