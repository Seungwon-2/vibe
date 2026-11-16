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

All data access is authorized with the verified `tid` + `oid` token claims. Public rows contain the verified Entra `name` claim or `Runner`, never email or account identifiers. Locally, Cosmos uses `COSMOS_ENDPOINT` with `DefaultAzureCredential` so developers can sign in with Azure CLI. In the SWA managed API, use the server-only `COSMOS_CONNECTION_STRING` application setting because the managed API does not provide a managed identity. Configure that secret in the backend application settings; never add it to `VITE_*` variables, source files, local examples, logs, or client bundles. The repository converts invalid credential configuration into a generic `DATA_NOT_CONFIGURED` response so SDK parse errors cannot reveal the supplied value.

The initial global ranking reads only `leaderboardBest` projections. Review Cosmos request units and query latency after deployment; if the number of players grows materially, replace the projection scan with a server-maintained leaderboard index. Client-sent runs receive basic plausibility validation but are not cheat-proof because the simulation remains client-side.

## Static Web Apps managed API settings

The client sends `X-Runner-Authorization: Bearer <Entra API access token>`.
SWA can replace the standard `Authorization` header with an internal token when
forwarding to the managed API. The API therefore reads only the app header and
validates its signature, issuer, audience, expiry, tenant and delegated scope.
The platform header is never accepted as a user credential. Never log either token.

The `project02` GitHub Actions workflow deploys this folder as the SWA managed API (Node.js 22). Set these values in GitHub repository **Variables** so the frontend build can request the API scope:

- `VITE_ENTRA_TENANT_ID`
- `VITE_ENTRA_CLIENT_ID`
- `VITE_ENTRA_API_SCOPE` (for example `api://<api-app-id>/access_as_user`)

The workflow sets `VITE_API_BASE_URL=/api`. The API also needs these server-side Static Web App application settings; never put the Cosmos connection string in GitHub Variables or any `VITE_*` value:

- `ENTRA_TENANT_ID`
- `ENTRA_API_AUDIENCE` (the API app's client ID or `api://<client-id>` Application ID URI; the verifier accepts both forms for v2 tokens)
- `ENTRA_API_SCOPE=access_as_user`
- `COSMOS_CONNECTION_STRING` (store as a secret application setting)
- `COSMOS_DATABASE_ID=stella-runner`
- `COSMOS_CONTAINER_ID=PlayerRecords`

Login requests the runner API scope together with OIDC scopes. Existing signed-in sessions first try silent acquisition and automatically start API consent when interaction is required, once per account/scope to avoid redirect loops after a denied request. A retry control remains available on failure. Tenant policy may still require an administrator to approve that consent; until API access succeeds, the browser-local gateway remains active. Deploying the API does not by itself prove a live Cosmos write: after setting these values and deploying, sign in, grant consent if permitted, submit a run, and verify it in the app's private history and public leaderboard. Never expose or paste Cosmos keys in chat or logs.

## Validation

```sh
npm test
npm run lint
npm run build
```

Provisioning, Entra app registration, API scope consent, Cosmos database/container setup, and deployment are separate tasks. This package does not perform those changes.
