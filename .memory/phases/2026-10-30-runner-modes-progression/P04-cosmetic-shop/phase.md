# Phase: P04 Cosmetic Shop

## Tasks

| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | done | Add data-driven cosmetic inventory, wallet purchases, per-character equipment, and shop UI. | [T01](./T01-cosmetic-catalog-shop.md) |
| T02 | done | Render equipped runner trails and full-action skins safely in the game. | [T02](./T02-equipped-cosmetics-runtime.md) |

## Progress

- done: 2/2

## Notes

- Equipped trails render as low-intensity running particles and strengthen during jumps, speed boosts, and giant mode. Effect lifecycle is cleared on pause, pit fall, finish, and scene shutdown.
- Skin registration is guarded by complete action coverage and matching frame dimensions/pivots. No user skin assets were supplied, so shop skin placeholders remain unavailable.
- Validation: `npm run typecheck`, `npm run assets:validate`, and `npm run build` passed. Vitest was not run in this session.
