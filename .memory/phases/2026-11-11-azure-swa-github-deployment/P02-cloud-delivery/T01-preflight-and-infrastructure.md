# Task: T01 Cloud Preflight and Isolated Infrastructure Preview

## Status: done

## Goal

Verify live Azure and GitHub prerequisites, calculate a defensible incremental usage estimate, and prepare a reviewable infrastructure deployment that can only add the new Stella Runner SWA and its own Cosmos database/container. Do not apply resources in this task.

## Decision Summary

- Target subscription `CR-Project-01`, resource group `grill-me-edu`, SWA `stella-runner-project02`, Standard plan, API runtime region East Asia. User selected Standard on 2026-11-11 to avoid the exhausted Free-plan quota and authorized creation after reviewing the estimate and successful what-if.
- Reuse Cosmos account `maze-rescue-ms-b7af62a9` in Korea Central; add only database `stella-runner` and SQL container `PlayerRecords` with partition key `/playerId`.
- No other web app, Static Web App, database, container, account setting, or data is to be modified.
- Before any apply, user reviews the cost estimate and preview output; stop if target or cost cannot be verified.

## Implementation

### I01. Live preflight and cost report

- Related Files:
  - `.memory/decisions/2026-11-11-azure-swa-github-deployment.md` :: confirmed targets/guards; read-only.
  - `.memory/phases/2026-11-11-azure-swa-github-deployment/P02-cloud-delivery/T01-preflight-and-infrastructure.md` :: recorded preflight result; update execution notes only.
  - `docs/azure-deployment-preflight.md` :: actual selected resource IDs, support checks, capacity/usage assumptions, incremental estimate; new.

#### Details

- Inspect `az account show`, subscription context, resource-group ID, existing target Cosmos account ID/location/capacity mode/throughput/storage/usage, and whether `stella-runner-project02` is available in SWA global namespace. Do not read or print account keys.
- Verify current official Azure documentation/CLI support for: Standard SWA, managed API region East Asia and Node runtime, deployment limits, app-setting operation, Cosmos SQL database/container resource API, and pricing units. Record source links and check date in the report.
- Estimate only incremental cost from the Standard SWA and expected new DB/container/API usage using actual shared-account mode and a stated pilot traffic assumption. Distinguish fixed/base cost, usage charges, included quotas, and uncertain variables. Do not assume Cosmos is free because SWA is Standard.
- Confirm that shared-account owner approval for the account-scoped key is documented by the user; do not attempt to retrieve/access the key in preflight.
- Verify GitHub repository write permission for `Seungwon-2/vibe` and `project02` using repository metadata without revealing credentials. If still read-only, stop the deployment path and report the precise permission needed.
- Create `docs/azure-deployment-preflight.md` with sanitized resource identifiers only; no connection strings, deployment tokens, tenant secrets, or key values.

### I02. Bicep resource declaration and what-if

- Related Files:
  - `infra/main.bicep` :: root RG-scope resources; new.
  - `infra/main.bicepparam` or `infra/main.parameters.example.json` :: non-secret target parameters; new.
  - `infra/README.md` :: safe validate/what-if/apply instructions; new.
  - `docs/azure-deployment-preflight.md` :: append sanitized preview result; modify.

#### Details

- **Resources**:
  - Declare one `Microsoft.Web/staticSites` resource named `stella-runner-project02`, Standard SKU, using an API runtime/location value verified by I01. Leave repository provider linking to the GitHub Actions task; do not place GitHub tokens in Bicep.
  - Reference existing Cosmos account `maze-rescue-ms-b7af62a9` with `existing` semantics; declare only SQL database `stella-runner` and container `PlayerRecords` as children. The SQL container partition key path is `/playerId`; use the verified current provider API version and required indexing defaults.
  - Do not declare, update, or delete the Cosmos account itself; do not declare any pre-existing database/container; do not set throughput at account level or modify account networking.
- **Parameters**: accept subscription-independent RG-scope `location`/verified SWA region, app name, existing Cosmos account name, SQL database ID, container ID, and partition path. No secret parameters.
- Run `az bicep build --file infra/main.bicep`, then `az deployment group what-if` targeting only `grill-me-edu`. Save a sanitized summary of planned resource operations. A change to an existing resource, any delete, or any account property update fails the task; revise template or stop.
- Do not run `az deployment group create` in this task. P02-T03 is gated on explicit review of this preflight/what-if and separate execution step.

## Acceptance Criteria

- [ ] Current tenant/subscription/RG/Cosmos/SWA availability and GitHub write access are explicitly checked.
- [ ] Incremental cost estimate uses actual Cosmos capacity mode and documents its assumptions and uncertainty.
- [x] Bicep validates and the user-provided what-if shows only the new SWA and the two intended Cosmos children.
- [ ] No secrets are read, stored, printed, or included in the preview artifacts.
- [x] Apply result is limited to the new SWA and the two intended Cosmos children; supplied ARM output contains no error and reports `Succeeded`.
- [ ] Subscription-specific actual invoice price is confirmed in Cost Management after usage posts.

## Validation

- `az account show --query "{subscription:name,subscriptionId:id,tenantId:tenantId}" -o json` — confirms selected context; record IDs only where needed.
- `az bicep build --file infra/main.bicep` — template compiles.
- `az deployment group what-if --resource-group grill-me-edu --template-file infra/main.bicep --parameters @infra/main.parameters.example.json` — only intended additions appear; do not apply.
- Manual review of `docs/azure-deployment-preflight.md` and sanitized what-if operations.

## Commit Message

```text
chore(infra): add isolated SWA and Cosmos preview

Plan: 2026-11-11-azure-swa-github-deployment
Phase: P02-cloud-delivery
Task: T01-preflight-and-infrastructure

- Record current Azure support and incremental pilot cost assumptions
- Add app-scoped Bicep and validate with what-if only
```

## Progress

- [x] Live Azure/GitHub preflight and sanitized cost/support report recorded.
- [x] Bicep template compiled successfully; it declares only the requested new SWA and app-owned Cosmos children.
- [x] Full Standard ARM what-if passed, as supplied by the user; it listed only three additions: the new SWA, SQL database, and container. The earlier Free-plan preview was blocked by the subscription's 10-app Free quota.
- [x] User selected the paid Standard SWA plan on 2026-11-11. Before apply, verify the current subscription/region price, review it with the user, recheck global SWA name availability, and rerun what-if.
- [x] User verified `Seungwon-2/vibe` with `gh repo view ...`; `viewerPermission: ADMIN` confirms repository write/admin permission. The repository default branch is `main`; the intended deployment branch remains `project02`. The ChatGPT GitHub connector remains read-only, so use the local GitHub CLI credential for repository writes.
- [x] User verified `gh auth status --hostname github.com`; reported scopes include `repo` and `workflow`. Token value was not recorded.
- commit: pending

### Execution notes (2026-11-11)

- Verified subscription `CR-Project-01`, resource group `grill-me-edu`, and existing Cosmos account `maze-rescue-ms-b7af62a9`; no account key was accessed.
- Confirmed the subscription has 10 Free and 4 Standard Static Web Apps. The selected Free SWA cannot be added under the current Free quota. ARM what-if stopped at preflight and did not provide a complete operation list.
- User selected Standard on 2026-11-11. After reviewing the cost estimate and successful Standard what-if, the user ran deployment `stella-runner-create-20261111`.
- The supplied ARM deployment JSON reports `provisioningState: Succeeded`, `error: null`, and the expected SWA/database/container resource IDs. This confirms resource provisioning only; it does not establish site reachability, Entra/API configuration, or actual billed cost.
- Cosmos usage/cost assumptions, quota finding, unsupported global-name check, and GitHub permission evidence are recorded in `docs/azure-deployment-preflight.md`.
- No GitHub changes or secrets were made/read. The phase pointer advances to T02; preserve unrelated existing worktree changes and do not commit them with this task.
