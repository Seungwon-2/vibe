# Phase: P01 App Readiness

## Tasks

| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | `done` | Finish owner-only run history and public best-run leaderboard screens using existing gateway contracts. | [T01](./T01-history-and-ranking-ui.md) |
| T02 | `done` | Complete the signed-in account area with Entra name, username/email, and logout. | [T02](./T02-account-area.md) |
| T03 | `done` | Support secure server-side Cosmos connection-string configuration for the SWA managed API and document local/Azure modes. | [T03](./T03-managed-api-cosmos-config.md) |

## Progress

- done: 3/3

## Exit Criteria

- Personal run history is requested only through the authenticated gateway and remains owner-scoped.
- Public ranking exposes only display name, distance, coins, and permitted public run metadata; no email or identity IDs.
- Account panel uses MSAL account claims already present in the token and has a functioning logout action without Graph scopes.
- API can select the configured server-side Cosmos connection string in SWA and retains its existing local-development credential path.
- Client/API build and targeted tests pass before starting cloud work.
