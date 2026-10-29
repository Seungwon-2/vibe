# Audio Asset Credits

The ten sound effects in `audio/sfx/` are original sounds synthesized for Project02. They use no third-party recording, sample, or soundfont.

| Asset | Purpose | Generator |
| --- | --- | --- |
| `jump.wav` | Jump | `scripts/generate-runner-effects.mjs` |
| `double-jump.wav` | Double jump | `scripts/generate-runner-effects.mjs` |
| `slide.wav` | Slide | `scripts/generate-runner-effects.mjs` |
| `coin.wav` | Coin pickup | `scripts/generate-runner-effects.mjs` |
| `time-pickup.wav` | Time pickup | `scripts/generate-runner-effects.mjs` |
| `gate.wav` | Bonus gate | `scripts/generate-runner-effects.mjs` |
| `hit.wav` | Obstacle hit | `scripts/generate-runner-effects.mjs` |
| `fall.wav` | Pit fall | `scripts/generate-runner-effects.mjs` |
| `hiyori-defense.wav` | Hiyori defense | `scripts/generate-runner-effects.mjs` |
| `ui-click.wav` | Primary button | `scripts/generate-runner-effects.mjs` |

These files are original Project02-generated audio. The composition parameters and built-in synthesis code are the source of the generated files. Regenerate with `npm run audio:effects:generate`; verify byte-identical output with `npm run audio:effects:check`.

Background music is deferred and is not included in this effects catalog.
