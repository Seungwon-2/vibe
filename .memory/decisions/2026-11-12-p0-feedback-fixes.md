# Decision: P0 Release Feedback Fixes

## Goal
Resolve the five feedback items classified as P0 before starting broader gameplay, visual, and performance revisions.

## Confirmed Scope
- The active-run dialog needs a dismiss action in addition to Resume and New Run.
- When cloud authentication is required but the user is not signed in, the menu must expose only the sign-in path and account/status feedback; gameplay, ranking, shop, and other menu actions must not be available.
- Cosmetics must not be equipped for locked characters, even if a stale UI state or direct service call supplies that character ID.
- Investigate and correct the story-mode session-save failure report. Do not hide genuine storage failures; show a warning only when the relevant persistence operation actually fails.
- Achievement unlock messages must show catalog names or a safe localized fallback, never an internal identifier.

## Behavior Decisions
- Dismissing the resume prompt hides it for the current page session but preserves the saved run. The prompt may appear again after a later reload.
- Starting a new run continues to require explicit confirmation. Confirming discards the saved session and its unbanked run coins, as already decided in the resume-session plan.
- Unauthenticated cloud users see a clear sign-in action and status/error text. Local mode remains usable without authentication.
- The cosmetic picker lists only unlocked characters. The service layer also rejects attempts to equip a cosmetic for a locked character. Existing saved loadouts are not silently deleted.
- Story persistence remains supported by the existing browser session store. A real storage or validation failure remains visible and recoverable; successful story saves must not produce a failure warning.
- Achievement IDs missing from the catalog use the localized fallback `알 수 없는 업적`.

## Out of Scope
- The remaining feedback on audio tuning, colors, hazards, pits, collision leniency, passive balance, gate placement, stutter, animations, boost balance, obstacle variety, keyboard navigation, and game-screen composition is not part of this P0 plan.
- Azure/Cosmos ranking work remains deferred under the current release architecture.

## Existing Worktree Context
- The deployment plan `.memory/plans/2026-11-11-azure-swa-github-deployment.md` currently points to live-browser smoke/privacy validation. This P0 plan supersedes the active pointer for the requested work; its deployment records and unfinished validation notes must remain intact.
- Preserve all unrelated working-tree changes. Planning must not commit or push.
