# Stella Runner Functions API

Node.js 22 Azure Functions v4 API for single-tenant Entra sign-in, private player data, and a public per-player best-run leaderboard.

## Local setup

1. Copy `local.settings.example.json` to `local.settings.json` and replace the tenant, API audience, and Cosmos endpoint placeholders. Do not commit the local file.
2. Give the local developer identity Azure Cosmos DB data-plane access to the account, then sign in with Azure CLI so `DefaultAzureCredential` can use it.
3. Run `npm install`, `npm run build`, and `npm start` from this directory. The Functions host serves routes below `/api`.

No database or container is created automatically. Configure an existing runner-owned database/container with partition key `/playerId`. The selected container must support transactional batches. The existing maze-rescue container and its data are not referenced or modified by this API.

## Routes

- `GET /api/profile` returns the signed-in player's profile, creating the default profile if absent.
- `PUT /api/profile` updates only cosmetic equipment the player already owns.
- `POST /api/runs` stores a run, settles run coins and rewards once, and updates the endless best projection when appropriate.
- `GET /api/runs?limit=20&cursor=...` returns only the signed-in player's private history.
- `GET /api/runs/best` returns the player's public endless best and current rank.
- `GET /api/leaderboard?limit=20` returns public best-run rows only.

All data access is authorized with the verified `tid` + `oid` token claims. Public rows contain the verified Entra `name` claim or `Runner`, never email or account identifiers. Cosmos uses managed identity in Azure and developer credentials locally; there are no Cosmos keys in the browser bundle.

The initial global ranking reads only `leaderboardBest` projections. Review Cosmos request units and query latency after deployment; if the number of players grows materially, replace the projection scan with a server-maintained leaderboard index. Client-sent runs receive basic plausibility validation but are not cheat-proof because the simulation remains client-side.

## Validation

```sh
npm test
npm run lint
npm run build
```

Provisioning, Entra app registration, API scope consent, Cosmos database/container setup, and deployment are separate tasks. This package does not perform those changes.
