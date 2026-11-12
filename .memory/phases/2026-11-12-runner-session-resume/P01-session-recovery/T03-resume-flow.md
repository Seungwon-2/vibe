# Task: T03 Lifecycle, Resume Choice, and Terminal Recovery

## Status: done

## Goal
앱 복귀 시 계정별 저장 세션을 확인해 타이틀의 `이어하기`/`새로 시작` 대화상자를 표시하고, 중단 런 또는 종료 결과를 정확히 연결한다. 새 런 전 저장 폐기 확인과 저장 실패 안내를 추가한다.

## Decision Summary
- 자동 저장 대상은 story/endless 모두이며 브라우저 종료 중 시간은 흐르지 않는다.
- 세션은 타이틀 진입 때 발견하고 사용자 선택 후에만 복원한다.
- 새 런 선택은 기존 저장을 확인 후 폐기한다. 폐기한 런 코인은 정산하지 않는다.
- terminal save는 result screen으로 복구하고 run settlement를 두 번 적용하지 않는다.
- 로컬 모드에서는 guest 범위, Entra 모드에서는 불투명 계정 scope. 계정 ID/토큰은 UI에 노출하지 않는다.

## Implementation

### I01. 앱 세션 조정 및 계정 범위
- Related Files:
  - `src/App.tsx` :: `startRun`, screen state, result settlement, app entry routing; modify.
  - `src/auth/AuthProvider.tsx` :: `RunnerAuthValue.account` 소비; read-only unless account-scope helper is needed.
  - `src/services/RunnerSessionStore.ts` :: `createRunnerSessionKey`; read-only.
  - `src/app/screens/RunScreen.tsx` :: `onSnapshot`, pause, finish and save callbacks; modify.
  - `src/game/runner/RunnerGame.tsx` :: initial checkpoint and scene restore initialization; modify.
  - `src/app/components/ResumeSessionDialog.tsx` :: resume/new/discard/expiry/storage error dialog; new.
- **Types/Props**:
  ```typescript
  export type ResumeDecision = 'resume' | 'new-run' | 'cancel';
  export type SessionRecoveryState =
    | { status: 'checking' } | { status: 'none' }
    | { status: 'active'; envelope: RunnerSessionEnvelope }
    | { status: 'terminal'; envelope: RunnerSessionEnvelope }
    | { status: 'storage-warning'; warning: 'unavailable' | 'expired' | 'invalid' };
  type RunScreenProps = {
    initialSession?: RunnerActiveSession | null;
    onCheckpoint(session: RunnerActiveSession): void;
    onTerminalCheckpoint(session: RunnerTerminalSession): void;
    // preserve existing props
  };
  ```
  Use current screen union and `FinishedRun` model from `src/App.tsx`; do not create a parallel navigation system.
- **Execution Flow / Logic**:
  1. After `AuthProvider` resolves on title entry, derive scope from Entra `account.homeAccountId` or fixed guest scope in local mode. If cloud mode is signed out, never reuse another account or guest save; wait for an active account.
  2. Read storage once per scope. A valid active or terminal save opens the title dialog before a new run can start. Expired/invalid/storage errors show non-blocking notice.
  3. Active `resume`: pass `RunnerActiveSession` through existing `RunScreen`/`RunnerGame`/`RunnerScene` initialization. Initialize paused, restore checkpoint, show existing pause/continue controls, resume timers only when user chooses continue. Do not run countdown again.
  4. `new-run`: show a second explicit confirmation. Confirm removes only current scope’s save, then starts via existing `startRun`; do not pay saved coins or records. Cancel preserves save and returns to choice.
  5. Save every 1,000ms while active and immediately on pause, `visibilitychange` hidden, `pagehide`, or exit navigation. First clear held inputs and pause simulation, then best-effort write. Clean listeners/timers on unmount. If write fails, continue runtime and show “이 런은 이어하기 저장에 실패해 복구되지 않을 수 있습니다”.
  6. `savedAt` is only for expiry. Never subtract wall-clock away time from game/effect timers.
  7. Stop active autosave once run becomes terminal. Persist terminal envelope before existing finish settlement/UI transition.

### I02. Terminal result idempotency and title recovery
- Related Files:
  - `src/App.tsx` :: existing `onFinish`, `FinishedRun`, result screen routes; modify.
  - `src/app/screens/RunScreen.tsx` :: finish callback; modify.
  - `src/services/RunnerSessionStore.ts` :: remove terminal record after result acknowledgement; modify if necessary.
  - `src/App.sessionRecovery.test.tsx` :: recovery and settlement; new (follow existing `src/App.test.tsx` conventions).
- Before existing payout/achievement/record settlement, write terminal envelope with stable `runId`, `result`, `outcome`, and `settled:false`. Make settlement idempotent by run ID; persist `settled:true` after settlement. On reload, terminal save routes to result without creating a game scene; if unsettled, settle once then mark settled; if settled, render result only. Remove terminal envelope only after result acknowledgement via retry, next stage, character or title action. Never render terminal save as active run.
- Preserve current story unlock, coin and personal-best behavior exactly once. Discarding an active save never enters settlement.

### I03. Recovery flow tests and interface states
- Related Files:
  - `src/app/components/ResumeSessionDialog.test.tsx` :: dialog actions/accessibility/warning; new.
  - `src/App.sessionRecovery.test.tsx` :: routing and settlement; new.
  - `src/app/screens/RunScreen.test.tsx` :: save lifecycle/pause behavior; modify if present.
- Verify keyboard focus, labeled choices, pending second confirmation, cancel preservation, storage warning, account switching isolation, and result restoration without rendering RunnerGame.

## Acceptance Criteria
- [x] Returning to title with active save offers `이어하기` and `새로 시작`; neither happens automatically.
- [x] Resume restores mode, stage, character, physics/world state and remains paused until continue.
- [x] New-run confirmation discards only current account’s save; cancel preserves it; discarded coins are not paid.
- [x] Both modes autosave periodically and on lifecycle/pause signals; timer/effect values do not elapse while away.
- [x] A result reached during victory/defeat animation survives reload and displays as result, with settlement at most once.
- [x] Storage failures warn without preventing play; unrelated settings, wallet, achievements and other accounts remain untouched.

## Validation
- `npm test -- --run src/App.test.tsx src/App.sessionRecovery.test.tsx src/app/components/ResumeSessionDialog.test.tsx src/app/screens/RunScreen.test.tsx`
- `npm run lint`
- Manual: start endless/story, close or navigate away during jump/slide, return and resume; test new-run cancel/confirm, account switch, finish/death animation reload, and storage-denied browser mode.

## Commit Message
```text
feat(session): add paused run recovery flow

Plan: 2026-11-12-runner-session-resume
Phase: P01-session-recovery
Task: T03-resume-flow

- Autosave and pause runs on browser lifecycle changes
- Offer resume or confirmed discard on return
- Restore terminal result exactly once
```

## Progress
- [x] Implementation complete
- [x] Validation passed: targeted Vitest suite (21 tests) and `npm run lint`
- commit: pending
