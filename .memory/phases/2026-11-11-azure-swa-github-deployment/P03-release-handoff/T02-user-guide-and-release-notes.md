# Task: T02 Employee Guide and Versioned Release Notes

## Status: done

## Goal

Give employees a short, clear guide to opening Stella Runner, signing in, playing, understanding browser-local records, and signing out. Update user-facing versioned patch notes and development history with the actual deployment details.

## Decision Summary

- The Entra account panel can show available name/account claims, but game records are not bound to that account.
- History, wallet, unlocks, and resume state use this browser profile's local storage. They are not account-isolated; anyone using the same browser profile can view them. No shared online ranking is active.
- Release notes describe shipped behavior and actual limitations, not planned work as if it were delivered.

## Implementation

### I01. Staff usage guide

- Related Files:
  - `docs/employee-user-guide.html` :: employee quick start and privacy explanation; new.
  - `docs/azure-deployment-preflight.md` :: deployed host and operational prerequisites; read-only source.
  - `src/app/screens/MainMenu.tsx` :: exact account/ranking/history labels; read-only reference.

#### Details

- The guide contains: app title and verified deployed URL; company account sign-in; account panel name/account-claim explanation; logout; jump/slide controls; mode selection; browser-local history and ranking; browser-local records not migrated; help/contact route and basic troubleshooting.
- Use plain Korean, clear headings, keyboard and mobile controls, and no implementation jargon. Ensure display text matches the actual deployed UI.
- Do not embed user emails, tokens, connection strings, internal subscription secrets, or test account details. Avoid exposing internal resource IDs to employees unless operationally necessary.

### I02. Versioned patch notes and development history

- Related Files:
  - `docs/release-notes.html` :: add the deployment release section using existing design and version/date pattern.
  - `docs/predeployment-development-history.html` :: append the Azure deployment outcome and links to guide/patch notes.
  - `docs/azure-deployment-preflight.md` :: source of verified version, date, URL, workflow SHA, and limitations; read-only.

#### Details

- Use the repository's existing release numbering convention; if no convention exists, start `v1.0.0` only after the first production deployment is verified. Otherwise use a clearly labeled pilot version (for example `v0.1.0`) and avoid implying production readiness beyond the actual checks.
- Include release date, version, new sign-in/account UI, shipped game updates, and known constraints. State that game records remain in browser-local storage, are not private to an Entra account, and there is no shared online ranking. Mention that existing local records were not migrated.
- Development history remains chronological and distinguishes planned, implemented, deployed, and verified states.
- Link the employee guide from the HTML patch notes and history page. Test links, keyboard navigation, contrast, and mobile readability.

## Acceptance Criteria

- [x] Employees can find the verified app URL and understand sign-in, play controls, browser-local records, and logout.
- [x] Guide clarifies that local data is not account-isolated and no shared online ranking is active; notes existing local history was not migrated.
- [x] Release/version/date/content are based on the successful deployment evidence.
- [x] History page accurately labels planned versus shipped work.
- [x] Internal HTML links resolve, responsive viewport/layout rules exist, and no secrets or personal test data appear.

## Validation

- PowerShell static checks confirmed a viewport meta tag and resolving local `href` targets in all three pages.
- `git diff --check` passed. A targeted scan found no credentials, tokens, connection strings, employee email addresses, or internal resource IDs in the three employee-facing pages.
- Reviewed guide labels and behavior against the deployed UI references and P03-T01 smoke evidence. No browser-based visual review was performed in this task.

## Commit Message

```text
docs(release): add employee guide and deployment patch notes

Plan: 2026-11-11-azure-swa-github-deployment
Phase: P03-release-handoff
Task: T02-user-guide-and-release-notes

- Explain employee sign-in, play, browser-local history, and account boundaries
- Publish verified versioned deployment notes and chronological history
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: docs(release): add employee guide and deployment patch notes
