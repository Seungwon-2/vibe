# Phase: P02 Cloud Delivery

## Tasks

| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | `in_progress` | Inspect target access, SWA availability, Cosmos capacity/cost, and produce an isolated infrastructure preview. | [T01](./T01-preflight-and-infrastructure.md) |
| T02 | `pending` | Configure the dedicated single-tenant Entra SPA/API registration and approved redirect/scope settings. | [T02](./T02-entra-registration.md) |
| T03 | `pending` | Provision the app-specific Free SWA and only its Cosmos DB/database/container; configure server-side settings after reviewed preview. | [T03](./T03-provision-and-secure-settings.md) |
| T04 | `pending` | Connect GitHub Actions to deploy root app and managed API from `project02`, keeping deployment secrets protected. | [T04](./T04-github-actions.md) |

## Progress

- done: 0/4 (active: T01)

## Exit Criteria

- Azure subscription and resource group are the approved `CR-Project-01` / `grill-me-edu` targets.
- The reviewed preview adds only the new SWA and `stella-runner` / `PlayerRecords` Cosmos children; no shared resource is modified.
- Actual Cosmos capacity and expected usage are documented with an incremental-cost estimate before apply.
- The API secret exists only in the SWA managed API server-side settings; the SWA deployment token exists only in an appropriate GitHub secret.
- Deployment workflow triggers on pushes to `project02` and excludes secret-bearing deployment from untrusted PR contexts.
