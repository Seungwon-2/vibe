# Task: T01 Bicep Azure Resources

## Status: pending

## Goal
Describe a new runner Static Web App and Function App in `grill-me-edu`, while reusing only the existing `maze-rescue-ms-*` Cosmos account and adding runner-owned data resources without altering existing data.

## Decision Summary
- Use Bicep and non-secret environment parameters.
- Create a new Static Web App and Function App; do not reuse the existing Static Web App.
- Reference the existing Cosmos account as an `existing` Bicep resource. Add database `stella-runner` and container `PlayerRecords` with `/playerId` partition key. Do not change account properties or any existing database/container.
- Use Static Web Apps Standard if needed for linking an existing Function App API.
- Use Function App system-assigned identity and Cosmos data-plane RBAC; do not store Cosmos keys in app settings.

## Implementation

### I01. Resource template and parameter files
- Related Files:
  - `infra/main.bicep` :: Azure resource graph; new
  - `infra/parameters/dev.bicepparam` :: development parameters; new
  - `infra/parameters/prod.bicepparam.example` :: safe prod placeholders; new
  - `infra/README.md` :: prerequisites, preview, deployment and rollback; new
- Template resources:
  - `Microsoft.Web/staticSites`, Standard plan; choose deployment location only after Azure owner confirms policy and availability. The existing portal resource region is not assumed to be the runner region.
  - `Microsoft.Web/sites` Function App, Functions v4, Node 22 Linux; associated Storage Account and Application Insights/Log Analytics resources required by the approved hosting plan.
  - Existing `Microsoft.DocumentDB/databaseAccounts` resource `maze-rescue-ms-*`; declare with `existing` and do not redeploy account configuration.
  - Add SQL API database `stella-runner`; add container `PlayerRecords`; partition key `/playerId`.
  - Cosmos data-plane `Cosmos DB Built-in Data Contributor` role assignment scoped only to the new runner database/container for the Function App managed identity; no account-wide or subscription-wide data role.
  - Function settings: `COSMOS_ENDPOINT`, `ENTRA_TENANT_ID`, `ENTRA_API_AUDIENCE`, `ENTRA_API_SCOPE`, and App Insights connection setting. Secret references only where a service requires one.
  - SWA public settings: `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_API_SCOPE`, and `VITE_API_BASE_URL=/api`.
- Use `stella-runner-{env}-*` names within each Azure naming limit. Resource-group parameter defaults to `grill-me-edu`; existing Cosmos account name is an explicit parameter. No credentials are literal in Bicep or parameter files.

### I02. Compile and preview safely
- Related Files:
  - `infra/README.md` :: exact command sequence and permission table; modify
- Validation commands:
  - `az bicep build --file infra/main.bicep`
  - `az deployment group what-if --resource-group grill-me-edu --template-file infra/main.bicep --parameters infra/parameters/dev.bicepparam`
- What-if must show a new runner SWA, Function App and support resources plus the new `stella-runner` database/container and scoped role assignment. Stop if any existing SWA, Cosmos account properties, or existing database/container would be changed or deleted.
- Do not execute deployment until user reviews the what-if and confirms target/access.

## Acceptance Criteria
- [ ] Bicep compiles and parameters contain no secrets.
- [ ] What-if modifies or deletes no existing SWA, Cosmos account, or existing database/container.
- [ ] Function identity has access only to the new runner database/container.
- [ ] Location, plan, throughput, and environment are parameterized.
- [ ] Required Azure roles, cost approvals, and region decisions are documented.

## Validation
- `az bicep build --file infra/main.bicep`
- `az deployment group what-if --resource-group grill-me-edu --template-file infra/main.bicep --parameters infra/parameters/dev.bicepparam`

## Commit Message
```text
infra(azure): define isolated runner resources with Bicep

Plan: 2026-11-03-azure-deployment-readiness
Phase: P02-infrastructure-delivery
Task: T01-bicep-azure-resources

- Define a new SWA and Function App; add isolated data resources to the shared Cosmos account
- Parameterize environments without committing credentials
- Protect existing app resources and Cosmos data with a what-if gate
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
