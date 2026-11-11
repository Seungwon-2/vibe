# Task: T03 SWA Managed API Cosmos Configuration

## Status: done

## Goal

Allow the SWA managed API to use the approved server-only Cosmos account connection string while keeping the local development path and preventing credentials from entering client code or logs.

## Decision Summary

- Static Web Apps managed Functions API has no managed identity; use a backend app setting named `COSMOS_CONNECTION_STRING` for the cloud account key.
- Local development may continue to use `COSMOS_ENDPOINT` with `DefaultAzureCredential`.
- Database/container remain fixed to `stella-runner` / `PlayerRecords`; never change or enumerate other account data.
- The connection string is account-scoped. If approval or secure server-side storage cannot be verified, stop cloud API connection.

## Implementation

### I01. Credential selection and safety

- Related Files:
  - `api/src/data/cosmosRepository.ts` :: `cosmos()`, cached `container()`; modify.
  - `api/src/data/cosmosRepository.test.ts` or current Cosmos repository unit-test file :: credential selection and config validation; modify/add based on actual test layout.
  - `api/local.settings.example.json` :: `Values`; modify with placeholders only.
  - `api/README.md` :: runtime/credential setup; replace Azure managed-identity-only instructions.
  - `api/src/shared/errors.ts` :: `ApiException`; read-only for safe config error shape.

#### Details

- **Signatures & Types**:
  - Keep `cosmos(): CosmosClient` private to the repository module.
  - Select connection mode by environment: if non-empty `COSMOS_CONNECTION_STRING` is present, construct `new CosmosClient(connectionString)`; otherwise require `COSMOS_ENDPOINT` and construct `new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() })`.
  - Do not add any `VITE_COSMOS_*` variables or client-visible config.

- **Data & Schema Fields**:
  - `COSMOS_CONNECTION_STRING`: secret, server-side only.
  - `COSMOS_ENDPOINT`: non-secret account endpoint for local AAD mode.
  - `COSMOS_DATABASE_ID`: defaults exactly to `stella-runner`.
  - `COSMOS_CONTAINER_ID`: defaults exactly to `PlayerRecords`.
  - Existing document schemas and `/playerId` partition key remain unchanged.

- **Execution Flow / Logic**:
  1. Trim environment values. If connection string exists, reject incomplete/whitespace-only values with a generic configuration error; never include the provided value in exception text.
  2. Else require endpoint and use `DefaultAzureCredential`. If neither credential path is configured, retain safe `503 DATA_NOT_CONFIGURED` behavior.
  3. Keep singleton client/container caching behavior; ensure tests reset module cache between credential cases.
  4. Keep `databaseId` and `containerId` as exact configured values with existing defaults; do not add account-management, database deletion, or cross-container behavior.
  5. Update local example using placeholders only. Do not copy a real connection string into any file, command recorded in docs, or test snapshot.
  6. Document that SWA managed API deployment sets `COSMOS_CONNECTION_STRING` through protected server-side application settings, whereas frontend build variables contain only the public tenant/client/scope identifiers.
  7. Update API README to remove the inaccurate assumption that managed identity will authenticate the SWA managed API; retain local AAD setup and describe how to validate configuration without printing secret values.

### I02. Repository credential tests

- Related Files:
  - `api/src/data/cosmosRepository.test.ts` :: Cosmos construction behavior; new or modify located test.
  - `api/src/shared/auth.test.ts` :: read-only regression check only if API test suite requires broad config fixture updates.

#### Details

- Verify connection-string branch selects connection-string auth and does not instantiate `DefaultAzureCredential`.
- Verify local endpoint branch retains `DefaultAzureCredential` behavior.
- Verify missing config fails with generic status/code and neither exception nor captured logger output contains a secret sentinel.
- Verify database/container defaults and explicit IDs remain `stella-runner` and `PlayerRecords`.

## Acceptance Criteria

- [x] Cloud managed API can create the Cosmos client from `COSMOS_CONNECTION_STRING`.
- [x] Local endpoint + AAD behavior continues to work.
- [x] No secret is exposed in client code, local example, exception, log, or README.
- [x] API remains restricted by configuration and repository operations to the approved app database/container.
- [x] Documentation no longer claims SWA managed API has managed identity.

## Validation

- `npm --prefix api test -- --run` — API unit/integration tests pass.
- `npm --prefix api run lint` — no API lint errors.
- `npm --prefix api run build` — API TypeScript build succeeds.
- `npm run typecheck` — client config remains valid.
- `rg -n "COSMOS_CONNECTION_STRING|VITE_COSMOS|DefaultAzureCredential" src api` — verify secret name appears only in API/runtime documentation/examples and no frontend Cosmos credential exists; manually inspect matches without printing secret values.

## Commit Message

```text
feat(api): support protected Cosmos connection string for SWA

Plan: 2026-11-11-azure-swa-github-deployment
Phase: P01-app-readiness
Task: T03-managed-api-cosmos-config

- Add server-side Cosmos connection-string mode for managed API
- Preserve local AAD mode and document secret boundary
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: `57396c8`
