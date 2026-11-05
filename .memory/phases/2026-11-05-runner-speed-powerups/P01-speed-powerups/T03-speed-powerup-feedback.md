# T03 HUD and Pickup Feedback

- Status: done
- Plan: `2026-11-05-runner-speed-powerups`
- Phase: `P01-speed-powerups`

## Goal

Communicate pickup collection and the remaining high-speed duration clearly without confusing the speed pickup, Story time boost, or giant effect.

## Decision summary

- The new speed pickup is a sky-blue lightning icon and has no size or protection effect.
- The HUD shows its remaining 3-second duration.
- Giant retains its existing duration/presentation; Story's +15% time pickup stays separately identifiable.
- Existing sound/UI feedback can be reused where appropriate; this task does not require new audio assets.

## Implementation blueprint

### Related files and symbols

- `src/app/components/RunnerHud.tsx`
  - Extend recent bonus / active effect display to distinguish the new `speed` pickup and its 2.5x remaining timer from the Story `speed-boost` (+15%) timer and `giantRemainingMs`.
  - Keep accessible labels and compact layout behavior on narrow screens.
- `src/app/screens/RunScreen.tsx`
  - Handle the new pickup event and show a clear short collection cue. Keep Story time pickup cue semantics unchanged.
- `src/game/runner/RunnerScene.ts`
  - Publish the new snapshot timer through the existing HUD update path and include the effect in speed-trail feedback if the existing trail is used for boosts.
  - Trigger the appropriate existing pickup sound/event without changing simulation effect state.
- `src/game/runner/RunnerEvents.ts`
  - Ensure the pickup event type accepts the new pickup kind.
- Related component styles and tests as needed, including `src/app/components/RunnerHud.test.tsx`, `src/app/screens/RunScreen.test.tsx`, and `src/game/runner/RunnerScene.test.ts`.

### Feedback rules

- New speed pickup label: lightning/speed cue with a 2.5x indicator and seconds remaining.
- Story time pickup: preserve its existing +15% cue and timer, never label it as 2.5x.
- Giant: preserve giant timer and visual scale/protection feedback independently.
- No timer or feedback is shown for an Endless time pickup because that pickup cannot restore Endless time.

## Acceptance criteria

- The player can distinguish the new 2.5x speed duration, Story +15% effect, and giant duration at a glance.
- Pickup confirmation is visible and uses existing audio events where available.
- HUD values update as time elapses, freeze while paused, and disappear at expiry.
- Labels remain accessible and do not overlap existing HUD controls at supported viewport sizes.

## Validation

- `npx vitest run src/app/components/RunnerHud.test.tsx src/app/screens/RunScreen.test.tsx src/game/runner/RunnerScene.test.ts`
- `npm run typecheck`
- `npm run build`

Add/update tests for the new timer label/cue, Story time label distinction, paused timer presentation, and timer expiry.

## Commit message

```text
feat(ui): show speed power-up feedback

Plan: 2026-11-05-runner-speed-powerups
Phase: P01-speed-powerups
Task: T03-speed-powerup-feedback
```

## Progress

- [x] Implementation complete
- [x] Validation complete
- [x] Task status set to done
