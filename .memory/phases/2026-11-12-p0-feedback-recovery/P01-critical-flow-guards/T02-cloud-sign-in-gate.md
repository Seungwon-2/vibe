# Task: T02 Cloud Sign-In Gate

## Status: done

## Goal
Make required company sign-in unmistakable and prevent unauthenticated users from entering gameplay or other app screens in cloud mode.

## Decision Summary
- Cloud mode requires `authStatus === 'signed-in'` before exposing game, ranking, history, achievement, or shop actions.
- Local mode remains playable without authentication; configuration errors remain fail-closed.

## Implementation

### I01. Render a login-only menu state for cloud users who are not signed in
- Related Files:
  - `src/app/screens/MainMenu.tsx` :: `MainMenuProps`, `MainMenu`; modify.
  - `src/app/screens/MainMenu.test.tsx` :: cloud authentication cases; modify.
  - `src/App.tsx` :: `menu`, auth screen gate; read-only unless tests reveal a missing prop.

#### Details
- **Signatures & Types**: Preserve existing `MainMenuProps` and `RunnerAuthStatus` contracts. Do not add Graph profile scopes or API token requests.
- **Rendering Logic**:
  1. When `authMode === 'cloud'` and `authStatus !== 'signed-in'`, render the brand/title, a short sign-in explanation, existing auth error/status text, and one prominent sign-in button only.
  2. During `authStatus === 'loading'`, show loading status and keep sign-in unavailable to prevent duplicate requests; render no gameplay/menu navigation buttons.
  3. During sign-in error (`authStatus === 'error'`), render a retry sign-in button and error text; hide all other actions.
  4. In `configuration-error`, fail closed: show the configuration explanation and no gameplay, rankings, shop, or other app actions. Do not show a sign-in action if configuration prevents a valid redirect.
  5. When signed in or in local mode, retain current menu actions and account display/logout behavior.
- **State/Flow**: `App` already routes unauthenticated cloud status to `menuWithRecovery` and passes auth props. Do not change session scope or unlock local access for cloud users.

### I02. Verify menu action visibility and existing local behavior
- Related Files:
  - `src/app/screens/MainMenu.test.tsx` :: sign-in-only, loading, retry, local-mode, and signed-in cases; modify.
  - `src/App.test.tsx` :: app-level cloud route guard if current coverage is insufficient; modify only as needed.

#### Details
- Assert signed-out cloud mode shows only sign-in among action buttons, hiding Start, Rankings, History, Achievements, Shop, Sound, and Credits.
- Assert signed-in cloud mode preserves account controls.
- Assert local mode keeps the existing menu and can begin the game.
- Assert configuration error cannot reach character selection or a run through the UI.

## Acceptance Criteria
- [x] A signed-out cloud user sees a clear sign-in-only entry state.
- [x] No gameplay or other menu action can be reached before successful sign-in in cloud mode.
- [x] Loading and configuration-error states fail closed without exposing enabled game actions.
- [x] Local mode and signed-in cloud menu behavior remain available.

## Validation
- `npm test -- src/app/screens/MainMenu.test.tsx src/App.test.tsx`
- `npm run typecheck`
- `npm run lint`

## Commit Message
```text
fix(auth): gate cloud menu actions behind sign-in

Plan: 2026-11-12-p0-feedback-recovery
Phase: P01-critical-flow-guards
Task: T02-cloud-sign-in-gate

- Show a focused sign-in state before authenticated play
- Preserve local mode and signed-in account actions
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
