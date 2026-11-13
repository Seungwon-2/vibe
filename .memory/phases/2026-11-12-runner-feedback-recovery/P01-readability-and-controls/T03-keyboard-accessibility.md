# Task: T03 Keyboard Accessibility

## Status: done

## Goal
Allow keyboard users to pause/resume, move through primary menus and selections, and activate/close dialogs without breaking runner jump/slide input.

## Decision Summary
- Escape pauses an active run; while a modal is open it closes the topmost dismissible modal; it never confirms destructive exit.
- Arrow keys move visible focus among applicable controls; Enter/Space activates the focused control. Preserve Space/Up jump and Down slide during active play.
- Use native buttons and visible focus indicators so assistive technology and browser focus remain functional.

## Implementation

### I01. Centralize screen-level keyboard behavior
- Related Files:
  - `src/app/screens/RunScreen.tsx` :: `onPauseShortcut`, modal state, pause/guide behavior; modify
  - `src/app/components/PauseOverlay.tsx` :: focus order and escape-close surface; modify
  - `src/app/screens/MainMenu.tsx`, `ModeSelect.tsx`, `CharacterSelect.tsx`, `StageSelect.tsx` :: native controls and focus grouping; modify as needed
  - `src/game/runner/RunnerInput.ts` and `RunnerScene.ts` :: gameplay key handling; read-only unless conflict requires a scoped fix
  - `src/styles/global.css` :: `:focus-visible`; modify
  - `src/app/screens/RunScreen.test.tsx` and screen tests; modify/add
- Details
  - Replace the current KeyP-only handler in RunScreen with Escape and P support, with explicit priority: settings/guide/exit confirmation handling first; active run pause second; resume only when the pause overlay is the top layer and orientation permits it.
  - Ignore keyboard shortcuts when a text input, textarea, select, or editable element owns focus. Prevent default only for handled shortcuts.
  - Keep ArrowUp/Space and ArrowDown behavior under `RunnerInputBridge`; do not let screen-level arrow navigation capture gameplay while the runner is active.
  - For menu/card grids, rely on native tab order and add roving arrow navigation only within a clearly bounded grid; Enter and Space use native activation. Do not introduce a global handler that steals arrows from forms or game input.
  - Return focus to the invoking pause/guide/shop/stage control after a dismissible modal closes. Add `:focus-visible` outline that is not clipped by card overflow.

## Acceptance Criteria
- [x] Escape pauses a running session and resumes from the pause view according to the stated top-layer behavior.
- [x] Escape never silently exits a run or discards a resume session.
- [x] Menu and selection controls are operable via keyboard with visible focus; active gameplay retains jump/slide bindings.
- [x] Automated tests cover Escape/P pause, modal priority, and gameplay key non-interference.

## Validation
- `npm run test -- --run src/app/screens/RunScreen.test.tsx src/app/components/PauseOverlay.test.tsx src/app/keyboardNavigation.test.tsx` — 17 tests passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- Manual keyboard-only flow remains for the user's browser confirmation; automated coverage verifies pause/resume, dialog dismissal, focus, and movement-key non-interference.

## Commit Message
```text
feat(a11y): add keyboard navigation and escape pause

Plan: 2026-11-12-runner-feedback-recovery
Phase: P01-readability-and-controls
Task: T03-keyboard-accessibility

- Support Escape pause and safe modal dismissal
- Keep runner controls available while adding menu keyboard access
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: included in the task commit

## Implementation Notes
- Escape pauses and resumes, dismisses the top dismissible pause dialog, and never confirms exiting. P remains an alternate pause shortcut.
- Arrow keys move focus within mode, character, and stage choices; Enter/Space retain native button activation. Active gameplay arrow/space controls are not intercepted.
- Pause, settings, and exit-confirmation focus moves to a useful action and returns to the invoking pause control when dismissed.
- Added tests for keyboard grid movement, pause focus, Escape pause/resume, and safe exit-confirmation dismissal.
