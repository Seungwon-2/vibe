# Character ability icons

Place the source PNG icons for character passives in this directory. The game imports these files into the UI bundle, so they are available offline after deployment.

Icon requirements: transparent RGBA PNG, 512 × 512, centered composition, consistent visual weight. The selection showcase renders them at 56 px and the running HUD at 28 px; CSS can scale them responsively.

Current icon files:

- `rin-cloud-tailwind.png` — Rin, 질주의 메이드
- `hiyori-blossom-ward.png` — Hiyori, 벚꽃 수호
- `mary-music-magnet.png` — Mary, 음표의 이끌림
- `toa-ghost-glide.png` — Toa, 고스트 슬라이드
- `rang-tiger-spring.png` — Rang, 호랑이 탄력

Names, effects, tuning values, and character mappings are centrally configured in `src/game/characters/characterAbilities.ts`.
