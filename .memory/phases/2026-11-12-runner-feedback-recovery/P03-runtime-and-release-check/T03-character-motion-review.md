# Task: T03 Character Motion Review

## Status: done

## Goal
Remove visible discontinuity in jump, double-jump, slide, hurt, fall, victory and defeat transitions while keeping the supplied sprite sheets and collision geometry intact unless a specific asset defect is demonstrated.

## Decision Summary
- Sprite motion is presentation only; physics and collision remain in runner code.
- Review every playable character that has usable motion assets; do not compensate for poor frames with global playback acceleration.
- Preserve the current terminal pose pacing unless review shows a specific regression.

## Implementation

### I01. Audit animation definitions and transitions
- Related Files:
  - `src/game/runner/runnerAnimationConfig.ts` :: frame rates and animation loops; modify
  - `src/game/runner/RunnerPlayer.ts` :: action state transitions; modify
  - `src/game/runner/hurtAnimation.ts` :: hurt hold and recovery; modify if transition is abrupt
  - `src/game/runner/RunnerScene.ts` :: landing/fall/terminal presentation; modify only for a reproduced transition defect
  - motion atlas manifest/build scripts and character assets; read-only unless frame-order defect is verified
  - runner-player/animation tests; modify/add
- Details
  - Review frame sequences at native gameplay scale for run→jump→fall→land, second jump, held slide, slide release, hurt recovery, pit fall, victory and game-over.
  - Check frame order, loop boundaries, duplicate/dropped frames, anchor consistency, texture trimming, and state transition timing. Separate a source atlas defect from animation configuration and runtime-state defects.
  - Keep held slide in a stable crouched/slide pose after its entry frames; do not loop a visibly deforming entry sequence if that is the source of the reported wobble.
  - Preserve jump/fall animation until landing; collecting coins, time, speed or giant pickups must not reset airborne state to running.
  - If the source art itself is incomplete, document exact character/action/frame evidence and stop at an asset request instead of synthesizing replacement art in code.

## Acceptance Criteria
- [ ] Landing is the only normal event that transitions an airborne character to running.
- [ ] Slide hold does not alternate between standing and crouching.
- [ ] Pickup events do not interrupt jump/fall motion.
- [ ] All terminal and hit motions finish at intended timing without accelerated sprite playback.

## Validation
- `npm run test -- --run src/game/runner/RunnerPlayer.test.ts src/game/runner/hurtAnimation.test.ts` — tests pass.
- `npm run assets:validate` — atlas validation passes.
- Manual frame-by-frame review of each available playable character and gameplay recording of action transitions.

## Commit Message
```text
fix(animation): preserve runner action continuity

Plan: 2026-11-12-runner-feedback-recovery
Phase: P03-runtime-and-release-check
Task: T03-character-motion-review

- Keep airborne and held-slide states continuous
- Correct verified frame order or transition timing defects
```

## Review Results
- Reviewed the five playable characters' run, jump, double-jump, slide, hurt, victory, and game-over frame sequences using labeled contact sheets. Run cycles use the same 12-frame layout; the action sheets have six source frames per character.
- The upside-down poses in the double-jump sheets are part of the supplied aerial spin sequence, followed by upright recovery frames. They are not a frame-order or atlas-cropping defect, so the source art and timing were left intact.
- Runtime transition review confirmed that the player state selects running only after floor recovery, airborne state is retained through pickups/giant scaling, held slide remains in its low pose, and terminal animation is guarded against restart. Existing focused tests cover these behaviors.
- Hurt animation inserts a fallen-pose hold before recovery and fits within the configured stagger interval. Terminal playback uses each character's configured quality FPS without a global speed multiplier.
- A live browser gameplay recording could not be captured in this environment because the browser automation host is unavailable. The automated transition tests and visual frame review passed; keep a hands-on gameplay pass in T04's regression matrix.

## Progress
- [x] Implementation/review complete
- [x] Validation passed
- commit: `5cc2f25`
