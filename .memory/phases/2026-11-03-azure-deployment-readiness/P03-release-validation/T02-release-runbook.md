# Task: T02 Azure Release Runbook

## Status: pending

## Goal
Prepare a usable operations handoff for the organization without deploying to production before access, cost, security, ownership, and staging evidence are approved.

## Decision Summary
- Production promotion requires a separate explicit user approval after staging evidence.
- Tenant app registrations, resource permissions, cost policy, custom domain, and GitHub OIDC trust require organization administrators.
- Rollback redeploys the previous known-good artifacts and retains Cosmos data; it never drops containers.

## Implementation

### I01. Admin/operator runbook and release gate
- Related Files:
  - `docs/azure-deployment-runbook.md` :: prerequisites, configuration, deployment, monitoring, rollback; new
  - `.env.example` :: safe public/local placeholders; modify
  - `infra/README.md` :: admin role and deployment prerequisites; modify
- Document values to supply out of band: tenant ID, SPA/API client IDs, API scope, SWA hostname/redirect URI, approved subscription/resource group, region/plan/cost ceiling, Cosmos backup/throughput policy, GitHub repository/environment IDs, OIDC subject and role assignments.
- Separate the required Azure/GitHub permissions by tenant admin, resource owner, repository admin, and operator. Use least privilege and separate deployment identity from human admin.
- Document health checks, App Insights metrics/alerts, Cosmos RU/cost monitoring, backup/export owner, secret rotation locations, and incident contact route.
- State that localStorage ranking and wallet records remain device-local and are not migrated; a later migration policy is a separate decision.
- Rollback: redeploy prior app/API artifacts; keep Cosmos schema backward-compatible; do not delete collections or alter existing app resources.
- Release checklist includes staging URL, sign-in, denied unauthenticated request, ranking/profile persistence, monitoring, browser smoke checks, recovery owner, and approved monthly budget.
- Production stays paused until the user confirms resource what-if, staging evidence, redirect/domain settings, and release timing.

## Acceptance Criteria
- [ ] Runbook separates user, Azure admin, GitHub admin, and operator responsibilities.
- [ ] No credential values or personal identifiers are committed.
- [ ] Cost, security, and recovery unknowns have approval owners.
- [ ] Rollback is non-destructive and schema evolution backward-compatible.
- [ ] Production gate requires explicit approval after staging validation.

## Validation
- Review runbook against current Microsoft Learn guidance and actual Azure what-if.
- `git diff --check`
- `npm run lint`
- `npm run build`

## Commit Message
```text
docs(azure): add deployment and operations runbook

Plan: 2026-11-03-azure-deployment-readiness
Phase: P03-release-validation
Task: T02-release-runbook

- Document tenant, Azure and GitHub prerequisites
- Add monitoring, rollback, and cost/security owner checklist
- Keep production deployment behind staging review and explicit approval
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
