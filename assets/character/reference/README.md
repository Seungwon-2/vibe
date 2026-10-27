# Character sprite sources

The runner uses the individual transparent PNGs in each `<slug>-sprite/` folder as its art source. Keep these originals at 192×192 with pivot `(96, 180)`. `animations.json` lists the frames and motion order; its `assets/` prefix is ignored because the PNGs live beside the JSON file.

Run `npm run assets:prepare` after changing a source frame. This builds the 96×96 runtime frames, atlas, manifest, and checkerboard proof images in `assets/character/runtime/`. Run `npm run assets:validate` to check that generated files match their sources.

Rin currently supplies 48 frames. Until dedicated `idle` and `cheer` frames arrive, the builder uses her first `victory` frame for idle and the six victory frames for the start gesture.

To enable a new character set, add its sprite folder to `MOTION_SHEETS` in `scripts/motion-study-layout.mjs`, regenerate assets, and add its ID to `READY_CHARACTER_IDS` in `src/game/characters/characterCatalog.ts`. Toa and Rang remain visible as coming soon until their new sprites are supplied.
