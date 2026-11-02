# Task: T06 Audio Replacement

## Status: pending

## Goal
Integrate the user's replacement BGM and SFX files without changing sound behavior or attribution policy beyond the provided assets' supplied credits.

## Decision Summary
- The user supplies the replacement audio. Do not generate substitute files.
- Keep current audio URLs stable by replacing files with matching names under the existing public directories.

## Implementation

### I01. Replace and validate audio assets
- Related Files:
  - `public/audio/music/menu.wav` — replace when supplied.
  - `public/audio/music/dawn-city.wav` — replace when supplied.
  - `public/audio/music/moonlit-forest.wav` — replace when supplied.
  - `public/audio/music/crystal-mine.wav` — replace when supplied.
  - `public/audio/music/cloud-skyway.wav` — replace when supplied.
  - `public/audio/sfx/jump.wav`, `double-jump.wav`, `slide.wav`, `coin.wav`, `time-pickup.wav`, `gate.wav`, `hit.wav`, `fall.wav`, `hiyori-defense.wav`, `ui-click.wav` — replace corresponding supplied files.
  - `src/audio/audioCatalog.ts` and `public/audio/CREDITS.md` — modify only if filenames or attribution details differ from current entries.

#### Details
- If the user provides a packed archive or directory, map files by the stable basenames listed above. Keep the existing `.wav` extension unless the user provides another supported format and the catalog is intentionally updated.
- Do not overwrite an audio asset unless a supplied file is unambiguously intended as its replacement.
- Validate that every catalog URL resolves, each file decodes, duration is non-zero, and sample rate/channel count are supported by the browser playback path.
- Update `CREDITS.md` with supplied source, author, and license metadata. If the user created the files, record that accurate source; do not invent attribution.
- Preserve mute/volume settings and music/effect separation.

## Acceptance Criteria
- [ ] All supplied replacement files are mapped to the intended catalog slots.
- [ ] Every replacement decodes and is audible in the applicable screen/game event.
- [ ] Credits match supplied provenance; missing provenance is explicitly recorded as user-supplied/unverified.
- [ ] Existing mute and volume controls continue to work.

## Validation
- `npm test -- src/audio/audioCatalog.test.ts src/audio/RunnerAudioManager.test.ts`
- `npm run build`
- Manual local checks: title BGM, each Story biome BGM, jump/slide/pickup/gate/hit/fall/defense, mute and separate volume controls.

## Commit Message
```text
chore(audio): replace runner music and effects

Plan: 2026-11-02-runner-polish-predeploy
Phase: P02-audio-release-check
Task: T06-audio-replacement

- Install user-supplied soundtrack and effect files
- Keep audio mappings and attribution aligned with supplied assets
```

## Progress
- [ ] User audio files received
- [ ] Integration and validation complete
- commit: pending
