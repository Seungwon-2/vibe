# Task: T01 Resume Prompt Dismissal

## Status: done

## Goal
Let a player close the active-run recovery prompt and return to the title menu while retaining the saved run for later recovery.

## Decision Summary
- Dismissal hides the prompt only for the current page session; it does not remove or mutate the saved envelope.
- Resume and confirmed New Run retain their current semantics. The destructive New Run path still requires confirmation.

## Implementation

### I01. Add a non-destructive dismiss path
- Related Files:
  - `src/App.tsx` :: `sessionEnvelope`, `sessionRecoveryReady`, `confirmingNewRun`, `menuWithRecovery`; modify.
  - `src/app/components/ResumeSessionDialog.tsx` :: `ResumeSessionDialogProps`, `ResumeSessionDialog`; modify.

#### Details
- **Signatures & Types**:
  ```ts
  type ResumeSessionDialogProps = {
    envelope: RunnerSessionEnvelope | null;
    warning?: string | null;
    confirmingNewRun: boolean;
    onResume(): void;
    onRequestNewRun(): void;
    onConfirmNewRun(): void;
    onCancelNewRun(): void;
    onDismiss(): void;
    onDismissWarning(): void;
  };
  ```
- **State**: Add `resumePromptDismissed: boolean` state to `App`, initially `false`. Reset it when `sessionScope` changes and when a new run is confirmed or a saved run is resumed. Do not clear `sessionEnvelope` on dismissal.
- **Execution Flow / Logic**:
  1. In the active recovery-choice view, render a clearly labeled `닫기` button alongside `이어하기` and `새로 시작`.
  2. `onDismiss` sets `resumePromptDismissed` to `true`; the menu remains visible and the browser storage envelope remains untouched.
  3. Render `ResumeSessionDialog` only when the menu is active, the envelope kind is `active`, and `resumePromptDismissed` is false.
  4. The new-run confirmation view keeps `돌아가기` and `저장 삭제 후 새로 시작`; `돌아가기` returns to the choice view rather than dismissing or deleting.
  5. On a page reload, component state resets and the still-valid stored envelope produces the prompt again.
- **Error Handling**: Existing storage warnings remain dismissible independently. Dismissing the recovery prompt must not clear a storage warning or report a successful save.

### I02. Add interaction and persistence regression coverage
- Related Files:
  - `src/app/components/ResumeSessionDialog.test.tsx` :: recovery and confirmation cases; modify.
  - `src/App.sessionRecovery.test.tsx` :: app-level recovery flow; modify.

#### Details
- Cover that the active recovery state exposes Resume, New Run, and Dismiss.
- Cover that Dismiss calls its callback and does not call resume, request-new-run, or confirm-new-run.
- Cover that confirmation back/cancel behavior remains intact.
- At app level, dismiss the prompt, inspect the backing session store to confirm the envelope still exists, then remount and confirm the prompt returns.

## Acceptance Criteria
- [x] A player can close the active-run prompt and use the title menu.
- [x] Closing the prompt does not delete the saved run or bank its uncommitted coins.
- [x] Reloading with the same valid saved run presents the recovery choice again.
- [x] Existing explicit discard confirmation still protects against accidental loss.

## Validation
- `npm test -- src/app/components/ResumeSessionDialog.test.tsx src/App.sessionRecovery.test.tsx`
- `npm run typecheck`
- `npm run lint`

## Commit Message
```text
fix(session): allow dismissing resume prompt safely

Plan: 2026-11-12-p0-feedback-recovery
Phase: P01-critical-flow-guards
Task: T01-resume-prompt-dismissal

- Hide the recovery prompt without deleting its saved session
- Cover dismiss, reload, and discard-confirmation flows
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`npm test -- src/app/components/ResumeSessionDialog.test.tsx src/App.sessionRecovery.test.tsx`, `npm run typecheck`, `npm run lint`)
- commit: `70ac100`
