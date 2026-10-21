# Task: T01 Client Integration and Recovery

## Status: pending

## Goal
Connect React/Phaser gameplay to MSAL and the Azure API so login, save, resume, rankings, and network recovery work as one flow.

## Decision Summary
- Require authentication before game entry; attach API access token to requests.
- Network loss pauses play and retries; durable resume begins at last acknowledged server checkpoint.

## Implementation

### I01. Gateway and save flows
- Related Files:
  - src/services/ApiGameGateway.ts :: authenticated gateway; modify
  - src/services/MemoryGameGateway.ts :: development-only adapter; modify
  - src/app/App.tsx :: auth/service provider wiring; modify
  - src/app/screens/MainMenu.tsx :: continue/new-game flow; modify
  - src/app/screens/GameScreens.test.tsx :: integration flow cases; modify
- Details
  - Inject token provider and API base URL. Production calls same-origin /api and sends Authorization Bearer. Never persist access tokens in localStorage.
  - Continue loads saved world/stage/checkpoint/lives/score/character. New Game with existing save confirms, deletes old save, then writes initial stage with 5 lives. Stage clear submits score then unlocks next stage; new world resets lives to 5 and score to 0.
  - At checkpoint and clear, debounce duplicate writes and wait for server acknowledgement before marking durable. Use retry delays 1,2,4,8 seconds, capped at 30 seconds. On recovery reload authoritative save and continue after player acknowledgement.
  - 401 returns to sign-in; 403 shows configuration error; network/5xx pauses and retries. Production never silently uses memory gateway.

### I02. Browser lifecycle
- Related Files:
  - src/app/components/NetworkPauseOverlay.tsx :: retry status/action; new
  - src/app/App.test.tsx :: auth and pause tests; modify
- Details
  - Pause on document visibility hidden and suspend elapsed timer. Resume only when visible and network healthy.

## Acceptance Criteria
- [ ] All production game services use authenticated API responses.
- [ ] Network loss pauses and retry recovers without losing last acknowledged save.
- [ ] Continue, overwrite confirmation, stage clear, and 401/403/5xx flows pass mocked API tests.

## Validation
- npm test -- --run src/app src/services — client integration tests pass.
- npm run typecheck; npm run lint; npm run build — pass.

## Commit Message
feat(client): connect gameplay to authenticated services

Plan: 2026-10-21-azure-platformer
Phase: P03-integration-release
Task: T01-client-integration

- replace local gateway with secured API client
- add resume, acknowledgement, and reconnect flow

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
