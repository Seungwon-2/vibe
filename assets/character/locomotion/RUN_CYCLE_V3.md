# Twelve-frame run cycle sources

These four transparent 4-column by 3-row source sheets replace the earlier eight-frame run rows. Each source cell is 362×362 px. The earlier `*-locomotion-v2.png` and `*-run-inbetweens-v1.png` files remain as versioned references.

| Character | Source sheet | Runtime prefix |
| --- | --- | --- |
| Aokumo Rin | `aokumo-rin-run-cycle-v5.png` | `run-00`–`run-11` |
| Shizuki Toa | `shizuki-toa-run-cycle-v3.png` | `goth-student-run-00`–`goth-student-run-11` |
| Ayatsuno Yuni | `ayatsuno-yuni-run-cycle-v6.png` | `moonwing-run-00`–`moonwing-run-11` |
| Akane Lize | `akane-lize-run-cycle-v5.png` | `akane-lize-run-00`–`akane-lize-run-11` |

## Image generation brief

Each sheet was generated with the built-in image generation tool using its character's existing runtime atlas as the pixel-art identity reference and its portrait as a costume reference. The shared brief requested twelve consecutive right-facing running poses in a transparent 4×3 grid, a right-leg stride followed by a left-leg stride, arms counter-swinging against the legs, consistent face/costume/proportions, a steady torso scale and baseline, and full limbs inside every cell. Character-specific details retained Rin's blue maid outfit, Toa's purple school uniform, Yuni's horn and wings, and Lize's red hair and dark jacket.

Yuni and Lize received a second image-generation edit pass after the initial four-character refresh. Yuni's follow-up brief requested steady horn, wing, and hair silhouettes while preserving clear alternating boots. Lize's requested distinct knees and boots, counter-swinging arms, and steadier red-hair volume. Their `v3` source sheets remain in this directory for comparison. Lize's atlas config uses `v4`.

Yuni's `v4` motion still read as a small twitch because both boots occupied similar positions throughout the loop. `yuni-run-pose-guide-v1.svg` and its PNG rendering specify a twelve-step near/far leg crossover: the blue near leg starts forward and moves behind, while the lavender far leg starts behind and moves forward, then they exchange again. The built-in image generation tool used this guide, Yuni's portrait, and her idle sprite as references for `ayatsuno-yuni-run-cycle-v5.png`. The earlier Yuni sheets remain for comparison. A source alpha threshold removes faint generated color residue before runtime scaling.

The `v5` crossover was visible but still read as walking: the torso stayed upright and the stride and knee lift were small. `ayatsuno-yuni-run-cycle-v6.png` uses Toa's `shizuki-toa-run-cycle-v3.png` as the mandatory twelve-pose action reference, while Yuni's portrait and idle sprite define her identity. The brief specified Toa's forward lean, high knee recovery, broad stride, pumping arms, and short flight phase, while keeping Yuni's horn, wings, and outfit. The atlas now uses `v6` with the same 768ms cycle and source alpha cleanup.

Rin's `v3` had too many similar front-leg poses and a narrow stride hidden by her skirt. The built-in image generation tool produced `aokumo-rin-run-cycle-v4.png` with Toa's twelve-pose run as the motion reference and Rin's old run sheet, portrait, and idle frame as identity references. The prompt requested a forward lean, wider strides, high-knee recovery, alternating near/far shoes below the skirt, opposing arm drive, and a consistent foot baseline. The later Rin sheets use an alpha threshold of 64 to remove faint blue source residue. The earlier `v3` remains for comparison.

The arm-motion follow-up used `arm-swing-pose-guide-v1.svg` (and its PNG rendering) to specify twelve near/far arm phases. Full-sheet and single-frame image-generation trials showed that same-colored sleeves can still collapse into a visually repeated pose. Rin `v5` was selected for its more distinct rear-hand-to-front-hand movement while retaining her `v4` leg cycle and costume; Lize `v5` was generated afresh from the pose guide and her portrait because editing `v4` kept both sleeves static. Compare key frames 00, 03, 06, and 09 at 96px when tuning these sheets. The source sheets and runtime atlases use the same twelve-frame, 768ms contract. Toa and Yuni retain their existing sheets because their arm changes remain readable at runtime size.

## Runtime preparation

`npm run assets:prepare` extracts the twelve cells from each sheet, removes detached generation residue, fits each pose into an 88px content area, normalizes its displayed height to 84px, and anchors the feet in a 96×96 frame. The run frames occupy the first twelve slots of each 1152×288 runtime atlas. The selector plays the strip in 768ms (15.625fps). The planned Phaser runner should use the same atlas frames and cycle duration.

The generated source artwork is retained so individual poses can be repainted if a gait transition still looks wrong at game size. Frame timing or an engine swap cannot repair a malformed leg or arm pose.
