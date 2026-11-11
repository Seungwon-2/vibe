# Azure deployment preflight — Stella Runner

**Checked:** 2026-11-11 (Asia/Seoul); plan updated 2026-11-11
**Scope:** Azure inventory, resource-group what-if, and the user-provided successful deployment result. The user ran the deployment from local PowerShell. No account keys or deployment secrets were read.

## Target and access

| Item | Verified value |
|---|---|
| GitHub repository / branch | `Seungwon-2/vibe` / `project02` (repository default branch: `main`) |
| GitHub repository permission | User ran `gh repo view Seungwon-2/vibe --json name,viewerPermission,defaultBranchRef` in local PowerShell; result reports `viewerPermission: ADMIN`. Repository write access is confirmed. The ChatGPT GitHub connector itself remains read-only; the local GitHub CLI credential is separate. |
| GitHub Actions workflow scope | User ran `gh auth status --hostname github.com`; reported scopes include `repo` and `workflow`. Workflow-file pushes through the local GitHub CLI credential are authorized. Token value was not recorded. |
| Azure tenant | `69c1e470-4528-435a-a1ae-de98e0aac738` |
| Azure subscription | `CR-Project-01` (`b7af62a9-9a10-4deb-95fa-1690f7bbd33d`) |
| Resource group | `grill-me-edu` (`koreacentral`) |
| Static Web App | `stella-runner-project02`, **Standard**, API region `eastasia`; deployment succeeded |
| Shared Cosmos account | `maze-rescue-ms-b7af62a9` (Korea Central, provisioned throughput, Free Tier enabled) |
| App-owned Cosmos resources | SQL database `stella-runner` with shared manual throughput 400 RU/s; SQL container `PlayerRecords`, partition key `/playerId`; deployment succeeded |

The existing Cosmos account contains other applications' databases. This plan uses an `existing` account reference and declares only the Stella Runner database/container children. The shared account's free-tier allowance and key scope remain account-wide. Owner approval to use the account-scoped key was reported by the user; this preflight did not access that key.

Before creation, the target resource group did not contain a Static Web App named `stella-runner-project02`, and the Cosmos database `stella-runner` was absent. The generic App Service name-availability endpoint rejected `staticSites`, so global SWA hostname availability was not independently confirmed in advance. The successful ARM deployment confirms the requested resource was provisioned; check the SWA's `defaultHostname` before sharing the app.

## Capacity and incremental pilot estimate

The account is provisioned-throughput mode and has Free Tier enabled; it is not a serverless account. Latest-hour Azure Monitor account aggregates returned 400 RU/s provisioned throughput, autoscale maximum throughput average 183 RU/s / peak 1,000 RU/s, latest normalized RU consumption 2%, and approximately 13.2 MiB data plus 2.8 MiB indexes. A separate seven-day query showed normalized consumption reaching 100% at some point in that period; it is not the latest-hour peak. These are shared-account aggregates: they do not reveal each application's reservation or guarantee unused Free Tier capacity.

The preview assigns the new SQL database a 400 RU/s shared manual throughput minimum. At the observed Korea Central public rate of $0.008 per 100 RU/s-hour, the full incremental throughput ceiling is:

`400 / 100 × $0.008 × 730 hours = $23.36 USD/month`

Actual incremental throughput billing can be $0 if the account's 1,000-RU/s lifetime Free Tier allowance has at least 400 RU/s of unused provisioned capacity; otherwise it can be up to approximately $23.36/month (before tax/discounts). The current account-level throughput metrics are not sufficient to determine its exact remaining allowance or billable autoscale consumption. Storage currently reported by the aggregate metric is about 16 MiB; a pilot workload of up to 1,000 records at 5 KiB each adds roughly 5 MiB, negligible if included storage remains. If the account's 25-GB included storage has already been consumed, storage overage applies at the then-current regional rate. This estimate excludes user traffic/egress and any non-SWA services.

The initial preflight assumed Static Web Apps Free and did not include an SWA hosting charge. The user selected Standard on 2026-11-11 to avoid the exhausted Free-app quota and subsequently authorized proceeding after reviewing the estimate. Standard is billed based on usage (per-second/hourly billing); the exact amount depends on region, subscription offer, currency, and applicable discounts. A subscription-specific quote and actual invoice line item have not been verified. Check the Azure Pricing Calculator/Cost Management for the target subscription. Standard features and quotas do not configure Entra sign-in by themselves; the dedicated Entra SPA login and app-level API authorization remain separate requirements.

## Support checks

- This subscription currently has 10 Free and 4 Standard Static Web Apps (14 total). Microsoft's current quota is 10 Free apps per subscription; the original Free SWA failed ARM preflight with `InvalidSkuName`. The user selected Standard to proceed without changing existing apps. The Standard plan quota is higher (currently 100 apps per subscription per Microsoft's quota documentation), but a new Standard deployment still needs a fresh ARM what-if and name-availability check.
- East Asia is listed among supported Static Web Apps managed API regions. The managed API supports Node.js 22 and HTTP triggers only. The repository currently has no `staticwebapp.config.json`; a later task must add the runtime declaration before deploying the API.
- API settings are configured on the Static Web App backend, separate from frontend build settings. Secrets must be API-side settings and must never be bundled into the frontend.
- Cosmos SQL database/container ARM resources support declarative creation; database-level shared manual throughput has a 400 RU/s minimum for the first 25 containers.
- Name availability for the global SWA namespace could not be verified by the available generic name-check endpoint. Check again at create time and stop on collision.

## Preview and deployment status

`infra/main.bicep` is deliberately limited to these additions:

1. `Microsoft.Web/staticSites/stella-runner-project02` (Standard, East Asia)
2. `Microsoft.DocumentDB/databaseAccounts/maze-rescue-ms-b7af62a9/sqlDatabases/stella-runner` (400 RU/s shared manual)
3. `.../containers/PlayerRecords` (partition `/playerId`)

The initial Free-plan preview was rejected because the subscription already has its maximum 10 Free apps (`InvalidSkuName`). The user selected Standard, then supplied a successful Standard `what-if` showing only three additions: the new SWA, the `stella-runner` SQL database (400 RU/s), and the `PlayerRecords` container (`/playerId`). The user then ran deployment `stella-runner-create-20261111`; the pasted ARM result reports `provisioningState: Succeeded` and lists all three resource IDs. The created resource IDs are:

- `/subscriptions/b7af62a9-9a10-4deb-95fa-1690f7bbd33d/resourceGroups/grill-me-edu/providers/Microsoft.Web/staticSites/stella-runner-project02`
- `/subscriptions/b7af62a9-9a10-4deb-95fa-1690f7bbd33d/resourceGroups/grill-me-edu/providers/Microsoft.DocumentDB/databaseAccounts/maze-rescue-ms-b7af62a9/sqlDatabases/stella-runner`
- `/subscriptions/b7af62a9-9a10-4deb-95fa-1690f7bbd33d/resourceGroups/grill-me-edu/providers/Microsoft.DocumentDB/databaseAccounts/maze-rescue-ms-b7af62a9/sqlDatabases/stella-runner/containers/PlayerRecords`

No existing-resource update or deletion appears in the supplied `what-if`. This confirms ARM deployment success and resource IDs; it does not yet verify the SWA hostname, deployed app, Entra registrations, API settings, or actual billed amount. The user-provided deployment output was reviewed on 2026-11-11.

## Remaining deployment work

- Repository role `ADMIN` and local GitHub CLI `workflow` scope are verified. The ChatGPT GitHub connector remains read-only; use the local GitHub CLI credential for repository writes.
- Check the actual Standard SWA and Cosmos charges in Azure Cost Management; the user authorized creation, but subscription-specific pricing and invoice amounts remain unverified.
- Create the dedicated single-tenant Entra SPA/API registrations and configure the SWA/API identifiers and secure Cosmos connection setting.
- Connect GitHub Actions to `Seungwon-2/vibe` branch `project02`, then verify the deployment and app URL.

## Sources checked 2026-11-11

- [Static Web Apps plans and quotas](https://learn.microsoft.com/en-us/azure/static-web-apps/plans)
- [Static Web Apps pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/static/)
- [Static Web Apps FAQ](https://learn.microsoft.com/en-us/azure/static-web-apps/faq)
- [Static Web Apps application settings](https://learn.microsoft.com/en-us/azure/static-web-apps/application-settings)
- [Static Web Apps configuration and supported runtimes](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration)
- [Static Web Apps API support and restrictions](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-functions)
- [Cosmos DB lifetime Free Tier](https://learn.microsoft.com/en-us/azure/cosmos-db/free-tier)
- [Cosmos DB plan and manage costs](https://learn.microsoft.com/en-us/azure/cosmos-db/plan-manage-costs)
- [Cosmos DB provisioned throughput](https://learn.microsoft.com/en-us/azure/cosmos-db/set-throughput)
- [Cosmos DB limits](https://learn.microsoft.com/en-us/azure/cosmos-db/concepts-limits)
- [Microsoft.Web/staticSites Bicep reference](https://learn.microsoft.com/en-us/azure/templates/microsoft.web/staticsites)
- [Azure Cosmos DB Korea Central price reference](https://azure.microsoft.com/en-us/pricing/details/cosmos-db/standard-provisioned/)
