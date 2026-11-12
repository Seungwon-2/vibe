# Plan: Azure Static Web Apps and GitHub Deployment

## Goal

Deploy Stella Runner's frontend to its dedicated Azure Static Web App and automatically publish pushes to `project02` in `Seungwon-2/vibe`. The current pilot uses single-tenant OIDC sign-in and browser-local records. Cosmos-backed history, public cross-user ranking, custom API scopes, and admin consent are deferred until tenant policy and data-access design are reviewed. This plan records infrastructure and deployment work already completed.

## Confirmed Target

- Repository: `https://github.com/Seungwon-2/vibe.git`; branch: `project02`.
- App: React 19 + TypeScript + Vite 8 + Phaser; root `/`; `npm run build`; output `dist/`.
- API: source exists in `api/`, but the current workflow deploys no API (`api_location` is blank). Cloud records and rankings are not active.
- Azure: subscription `CR-Project-01`; resource group `grill-me-edu`; new Standard SWA `stella-runner-project02` (availability to verify); managed API in East Asia. Standard was selected by the user on 2026-11-11 to avoid the subscription's exhausted Free-plan quota; verify recurring cost before apply.
- Data: Azure deployment created database `stella-runner` and container `PlayerRecords` in the existing `maze-rescue-ms-b7af62a9` account, but this release does not connect to them. Current history and ranking stay in browser storage.
- Identity: dedicated single-tenant SPA registration with MSAL OIDC sign-in; no Microsoft Graph permission or custom API scope is requested during login. The account panel uses claims available to MSAL and supports logout.
- API consent and Cosmos access: deferred. No Cosmos connection string is configured in SWA or GitHub, and the live frontend does not make Cosmos/API requests.
- Cost: Standard SWA has recurring usage charges; Cosmos throughput/storage and API consumption can also incur charges. The existing Cosmos account is shared; determine its actual capacity and estimate this app's incremental use before provisioning.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Complete the remaining app-side account/history experience and managed API Cosmos configuration. | [P01](../phases/2026-11-11-azure-swa-github-deployment/P01-app-readiness/phase.md) |
| P02 | `done` | Provision the dedicated SWA, defer cloud API settings, and deploy the frontend from `project02`. | [P02](../phases/2026-11-11-azure-swa-github-deployment/P02-cloud-delivery/phase.md) |
| P03 | `done` | Complete browser sign-in/gameplay smoke checks and prepare employee usage and versioned release documentation. | [P03](../phases/2026-11-11-azure-swa-github-deployment/P03-release-handoff/phase.md) |

## Gates and Scope

- Azure resource creation is complete per the user's supplied successful ARM result. Do not create further cloud resources, Entra registrations, GitHub secrets, or deploy until each remaining phase's access, target, and secret-handling gates have been reviewed.
- Proceed only if refreshed GitHub access can write to the requested repository and branch. Prior observed GitHub permissions were read-only; this remains unverified.
- Verify tenant/app registration permissions, SWA name availability, managed API region/runtime support, Cosmos account capacity/usage, and incremental cost at execution time.
- Use an infrastructure preview before applying. The preview must show only the new SWA and the new app-owned Cosmos database/container; no existing apps, databases, containers, or shared account settings may be altered.
- The deployment workflow runs for `project02` pushes and does not expose the SWA token to pull-request code. Frontend `VITE_*` values are public identifiers only; no credentials go into frontend variables or bundles.
- No Cosmos connection string or API setting is configured in the current release. If cloud data is resumed, first review admin-consent policy and a least-privilege Cosmos access design.
- If Cosmos owner approval, secure secret configuration, GitHub write permission, expected cost, or target isolation is not verified, stop before the dependent cloud mutation.

## Previous Work Carried Forward

The previous plan `.memory/plans/2026-11-03-azure-deployment-readiness.md` delivered the MSAL SPA auth foundation and API source. The user later provisioned the dedicated SWA and app-owned Cosmos objects, and the frontend now deploys automatically from `project02`. The current release does not call the API or Cosmos. This plan supersedes the old plan for current deployment scope while preserving historical files.
