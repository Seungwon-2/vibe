# Task: T02 GitHub Actions Deployment

## Status: pending

## Goal
Run quality gates and deploy SPA and Function API from `project02` without exposing Azure or Entra credentials in source control.

## Decision Summary
- Only `project02` deploys to the initial environment; pull requests validate but do not publish.
- Prefer GitHub OIDC for Azure/Bicep and Function deployment. Use SWA deployment token only if the selected SWA action requires it.
- Frontend and separate Function App are deployed as independent packages after common validation succeeds.

## Implementation

### I01. CI and deployment workflows
- Related Files:
  - `.github/workflows/ci.yml` :: PR and branch validation; new
  - `.github/workflows/deploy-project02.yml` :: protected deploy workflow; new
  - `api/package.json` :: test/lint/build scripts; modify if required
  - `infra/README.md` :: GitHub environment configuration; modify
- Validation order: `npm ci`; `npm run assets:validate`; `npm test`; `npm run lint`; `npm run typecheck`; `npm run build`; `npm ci --prefix api`; `npm --prefix api test`; `npm --prefix api run lint`; `npm --prefix api run build`; `az bicep build --file infra/main.bicep`.
- Triggers: PR => validation only; push to `project02` => approved dev deployment; manual dispatch for a protected staging/prod promotion. Set minimum permissions: `contents: read`; add `id-token: write` only to Azure deployment job.
- Sequence: quality gates; Bicep what-if; protected approval; deploy Function package; deploy `dist` to SWA; smoke test homepage and authenticated/unauthenticated API behavior.
- Use GitHub Environments `runner-dev` and `runner-prod` with required reviewers for production. Pin Actions to reviewed major versions/SHAs per company policy.
- Configure out of band only: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` for OIDC; `SWA_DEPLOYMENT_TOKEN` only if required by SWA deploy action. Never put values in repo.

## Acceptance Criteria
- [ ] PR workflow runs app/API/asset/Bicep checks.
- [ ] Only `project02` can deploy the initial environment.
- [ ] No long-lived Azure service-principal secret is committed.
- [ ] Production deployment is environment-protected.
- [ ] Failed validation blocks API and SPA deployment.

## Validation
- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run assets:validate`
- `npm run build`
- `npm --prefix api test`
- `npm --prefix api run build`
- `az bicep build --file infra/main.bicep`
- Inspect GitHub Actions run to ensure pull requests skip deployment.

## Commit Message
```text
ci(azure): deploy runner from project02 with gated workflows

Plan: 2026-11-03-azure-deployment-readiness
Phase: P02-infrastructure-delivery
Task: T02-github-actions-deployment

- Validate frontend, API and infrastructure before release
- Deploy SPA and Function App separately from project02
- Protect environments and use federated Azure login
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
