# Task: T02 Azure Deployment

## Status: pending

## Goal
Make the client, Functions API, and Azure SQL deployable in the company tenant with passwordless SQL access and documented Entra setup.

## Decision Summary
- Static Web Apps hosts React and links a separate Node Functions v4 Function App with system-assigned identity; Azure SQL grants that identity database access.
- Do not provision resources or register apps without an authenticated company subscription and required tenant parameters.

## Implementation

### I01. Infrastructure and runtime settings
- Related Files:
  - infra/main.bicep :: SWA, Function App/plan, SQL server/database; new
  - infra/parameters.example.json :: non-secret parameters; new
  - staticwebapp.config.json :: route policy and SPA fallback; modify
  - api/host.json :: runtime settings; modify
- Details
  - Bicep parameters: location, resourceNamePrefix, tenantId, sqlEntraAdminObjectId, sqlDatabaseName, functionRuntime (Node 22 LTS), staticWebAppSku (Standard for linked Function API). Create SWA, Function plan/app with system identity, SQL logical server/database with Entra admin; output names and URLs. Never set real tenant values as defaults.
  - SQL TLS-only, minimum TLS 1.2. Grant Function identity only required database access. Apply schema separately as Entra SQL admin. Document network reachability/firewall constraints.
  - Link existing Function App to SWA and route /api/* to it. Require authenticated role for game routes while allowing auth bootstrap. MSAL is API identity source; do not trust SWA identity headers.
  - Function settings: ENTRA_TENANT_ID, ENTRA_API_AUDIENCE, ENTRA_REQUIRED_SCOPE, AZURE_SQL_SERVER, AZURE_SQL_DATABASE. Local dev CORS only for localhost.

### I02. Operator setup documentation
- Related Files:
  - docs/azure-entra-setup.md :: SPA/API registration and consent; new
  - docs/local-development.md :: local client/API/SQL runbook; new
  - docs/deployment.md :: Bicep, API link, migration, verification; new
  - README.md :: setup links; modify
- Details
  - Document SPA redirect URI; API access_as_user scope; tenant authority; API access-token name optional claim; tenant/app IDs in local settings only. Explain company admin consent policy.
  - Document npm/func/az login, DefaultAzureCredential, SQL local requirements, and human-run deployment steps.

## Acceptance Criteria
- [ ] Bicep builds without deploying and exposes required resource outputs.
- [ ] Setup docs specify tenant, SQL Entra admin object ID, app registration, API link, and schema order.
- [ ] No secret or real company tenant/client id is committed.
- [ ] After authorized deployment, signed-in tenant user reaches game and API rejects wrong tenant/scope.

## Validation
- az bicep build --file infra/main.bicep — template compiles.
- npm run typecheck; npm run lint; npm run build; cd api; npm run typecheck; npm run build — release builds pass.
- az deployment group what-if --resource-group <authorized-rg> --template-file infra/main.bicep --parameters @infra/parameters.local.json — preview only, when Azure context/parameters exist; do not deploy in this task.

## Commit Message
chore(azure): add deployable platformer infrastructure

Plan: 2026-10-21-azure-platformer
Phase: P03-integration-release
Task: T02-azure-deployment

- add Bicep resources and managed-identity SQL path
- document Entra registration and release steps

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
