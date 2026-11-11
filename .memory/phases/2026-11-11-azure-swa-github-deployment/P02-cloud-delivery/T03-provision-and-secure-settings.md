# Task: T03 Provision Dedicated Resources and Secure API Settings

## Status: in_progress

## Goal

After explicit review of P02-T01's cost estimate and what-if, create the dedicated Static Web App and app-owned Cosmos database/container, then configure the managed API's secure server-side settings without altering shared account configuration.

## Decision Summary

- New resource: Standard SWA `stella-runner-project02` in `CR-Project-01` / `grill-me-edu`.
- Managed API runs in East Asia. Cosmos account is reused in Korea Central; only the dedicated child database/container are added.
- Connection string is account-scoped and must be held only in secure backend settings. If the owner approval statement or setting security cannot be verified, stop.

## Implementation

### I01. Reviewed infrastructure apply

- Related Files:
  - `infra/main.bicep` :: app and Cosmos child resource declarations; read-only from P02-T01.
  - `infra/main.parameters.example.json` or `infra/main.bicepparam` :: target IDs; read-only.
  - `docs/azure-deployment-preflight.md` :: approvals, estimate, reviewed what-if, deployed resource IDs; update.

#### Details

- **Preconditions**: user has reviewed the concrete Standard SWA and Cosmos incremental-cost estimate and sanitized what-if; current context still matches `CR-Project-01` and `grill-me-edu`; SWA name is available; app registration IDs are ready before API settings are configured; owner-approved Cosmos credential can be configured without revealing it.
- Re-run what-if immediately before apply. Abort if operations differ from the reviewed preview or include changes to existing account properties/resources.
- Apply only `infra/main.bicep` at the RG scope. Confirm new SWA ID/name and the new Cosmos SQL database/container IDs. Do not provision a Function App, storage account, extra Cosmos account, or non-required resource.
- Cosmos throughput must follow the reviewed capacity/cost plan. If a throughput value was not approved or the existing account's billing mode makes cost ambiguous, stop rather than guessing.
- Record sanitized resource IDs and resulting locations in the preflight doc. Never record access keys, connection strings, deployment tokens, or secret command output.

### I02. Configure SWA and managed API settings

- Related Files:
  - `src/auth/entraConfig.ts` :: environment variable contract; read-only.
  - `api/src/shared/auth.ts` :: server auth environment contract; read-only.
  - `api/src/data/cosmosRepository.ts` :: Cosmos connection string contract from P01-T03; read-only.
  - `docs/azure-deployment-preflight.md` :: setting names and verification outcomes, not values; update.

#### Details

- Configure SWA production build environment with public values only: `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_API_SCOPE`, `VITE_API_BASE_URL=/api` (only if the app requires it).
- Configure managed API settings in server-side SWA application settings: `ENTRA_TENANT_ID`, `ENTRA_API_AUDIENCE`, `ENTRA_API_SCOPE`, `COSMOS_DATABASE_ID=stella-runner`, `COSMOS_CONTAINER_ID=PlayerRecords`, and `COSMOS_CONNECTION_STRING`.
- Enter the Cosmos secret through a secure portal/secret input that masks the value. Do not place it in shell arguments, shell history, terminal output, Bicep, GitHub workflow, repository files, or logs. Avoid CLI commands that echo settings after write.
- Verify presence without reading back secret value (settings key names only). Verify API logs/errors do not expose it. Keep origin and API runtime settings to the approved values.
- Configure SWA authentication routes only as required by the existing MSAL flow; do not introduce conflicting platform auth unless validated against SPA redirect behavior.

## Acceptance Criteria

- [x] The user-provided apply result reports success for the dedicated SWA and intended Cosmos children; the supplied what-if contained only those additions.
- [ ] Existing apps, account configuration, databases, containers, and data remain untouched.
- [x] Static Web App was provisioned as Standard in East Asia per the reviewed parameters and successful deployment output.
- [ ] Static Web App hostname and deployed app reachability are verified.
- [ ] API settings include required auth and Cosmos keys; the connection-string value is never echoed or stored in code/workflow/docs.
- [ ] Actual incremental cost configuration matches the reviewed preflight; deviations stop for review.

## Validation

- Re-run `az deployment group what-if` and compare operations to reviewed report before apply.
- `az deployment group create --resource-group grill-me-edu --template-file infra/main.bicep --parameters @infra/main.parameters.example.json` — only after gate; deployment succeeds.
- `az staticwebapp show --name stella-runner-project02 --resource-group grill-me-edu --query "{name:name,defaultHostname:defaultHostname,sku:sku.name}" -o json` — records non-secret resource details.
- Verify SWA API app-setting key names through a masked/keys-only view; never request or print values.
- Verify Cosmos database/container IDs and partition key through resource metadata only.

## Commit Message

```text
chore(azure): provision Stella Runner hosting resources

Plan: 2026-11-11-azure-swa-github-deployment
Phase: P02-cloud-delivery
Task: T03-provision-and-secure-settings

- Create dedicated Static Web App and app-owned Cosmos data objects
- Configure server-side managed API settings without exposing secrets
```

## Progress

- [x] I01 reviewed infrastructure apply completed by the user; ARM output reports `Succeeded` and lists all three expected resource IDs.
- [ ] I02 configure Entra and Cosmos server-side API settings after T02 provides the app identifiers; no secret has been accessed or configured by this task.
- [ ] Validation passed
- commit: pending

### Execution notes (2026-11-11)

- User supplied the ARM deployment result for `stella-runner-create-20261111`; it reports `provisioningState: Succeeded` and no error.
- The output lists only the intended Static Web App, Stella Runner SQL database, and `PlayerRecords` container. Actual hostname, live site, Entra sign-in, API settings, and billing remain unverified.
- Proceed to T02 for dedicated Entra registrations before configuring server-side API settings. Never request or print credential values.
