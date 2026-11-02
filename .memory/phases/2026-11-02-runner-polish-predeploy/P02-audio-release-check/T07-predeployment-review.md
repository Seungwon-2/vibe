# Task: T07 Pre-deployment Review

## Status: done — blockers recorded

## Goal
Verify the local production build, assets, tests, and runtime paths, then report remaining deployment work without deploying to Azure.

## Decision Summary
- A successful local preflight is not an Azure deployment authorization.
- Existing unrelated worktree changes must remain untouched and must not enter this task's commit.

## Implementation

### I01. Release validation and blocker report
- Related Files:
  - `package.json` :: `test`, `typecheck`, `lint`, `build`, `assets:validate` scripts — read-only.
  - `vite.config.ts`, `.env.example`, Azure workflow/hosting configuration — inspect read-only; modify only for a release blocker directly caused by this plan and document why.
  - `.memory/worklogs/2026-11-02.md` — new completion log after checks.

#### Details
- Capture initial and final `git status`; preserve all user changes and stage only plan-owned changes.
- Run in order: `npm run assets:validate`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Run `npm run preview -- --host 127.0.0.1` and inspect the built app for title rendering, menu navigation, selector, stage selection, story run, audio loading, and result navigation. Confirm console/network contains no missing required assets.
- Inspect Azure hosting/build configuration, required environment variable names, Entra redirect/origin assumptions, and whether any secrets are committed. Do not print secret values. Report any absent or unconfigured Azure settings as blockers; do not create cloud resources or deploy.
- Include exact command outcomes, any known existing Vite chunk warning, remaining user-provided audio requirement, and manual checks that could not be completed.
- Write a concise Korean worklog summarizing the day's changes, validations, and deployment follow-ups.

## Acceptance Criteria
- [x] Local check outcomes and observed failure causes are recorded in the worklog.
- [ ] Production preview responds and static bundle/audio URLs load; interactive browser flow remains unverified because the browser host is unavailable.
- [x] Missing Azure/Entra configuration is reported without exposing secret values.
- [x] Unrelated user modifications remain unstaged and uncommitted.
- [x] Worklog records changes and exact validation outcomes.

## Validation
- `npm run assets:validate`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run preview -- --host 127.0.0.1`

## Commit Message
```text
docs(release): record pre-deployment readiness

Plan: 2026-11-02-runner-polish-predeploy
Phase: P02-audio-release-check
Task: T07-predeployment-review

- Record local preflight and Azure readiness gaps
- Save the day's worklog with validation results
```

## Progress
- [x] Review complete; deployment is not ready while authentication/hosting inputs, test failures, and lint errors remain.
- [x] `npm run assets:validate`, `npm run typecheck`, `npm run build`, and audio tests passed. Full suite/lint failures and preview limits are documented.
- [ ] Manual interaction verification is unavailable in this session.
- commit: fe6fa6e
