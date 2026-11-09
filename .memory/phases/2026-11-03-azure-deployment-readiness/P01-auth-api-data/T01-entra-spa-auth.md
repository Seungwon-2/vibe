# Task: T01 Entra SPA Authentication

## Status: done

## Goal
Allow only users from the configured company Entra tenant to enter cloud gameplay and call protected APIs, while keeping local Vite development usable.

## Decision Summary
- MSAL SPA authorization-code flow with PKCE; request the runner API delegated scope.
- Single-tenant authority only; no client secret in the browser app.
- Keep `LocalRunGateway` and `LocalPlayerProfileStore` as the local-development path when cloud auth config is absent.

## Implementation

### I01. MSAL provider and protected app entry
- Related Files:
  - `package.json` :: add `@azure/msal-browser` and `@azure/msal-react`; modify
  - `src/main.tsx` :: mount auth provider; modify
  - `src/auth/entraConfig.ts` :: `entraMsalConfig`, `runnerApiRequest`; new
  - `src/auth/AuthProvider.tsx` :: `AuthProvider`, `useRunnerAuth`; new
  - `src/App.tsx` :: screen gating and signed-in flow; modify
  - `src/app/screens/MainMenu.tsx` :: sign-in affordance; modify
  - `.env.example` :: public config placeholders; modify
- `entraMsalConfig` reads `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_CLIENT_ID`; authority is exactly `https://login.microsoftonline.com/{tenantId}`. Never use `common` or `organizations`.
- `runnerApiRequest` requests only `[VITE_ENTRA_API_SCOPE]`; redirect URI uses current origin and must be registered for localhost and approved SWA URL.
- `useRunnerAuth()` returns `{ status: 'loading'|'signed-out'|'signed-in'|'error', account, signIn(), signOut(), acquireApiToken() }`. `acquireApiToken` tries silent acquisition first, then interactive redirect only for `InteractionRequiredAuthError`.
- Read the account's public display name from the verified access-token `name` claim on the API side; request/configure this claim for the API token. Do not use email, call Microsoft Graph, or accept a client-provided public display name. The API falls back to `Runner` when the validated claim is absent.
- Deployed app fails closed with a configuration error when required settings are missing. Local dev with no auth config retains the existing local game.
- Never request Graph scope unless a later approved feature needs it. Sign-out clears in-memory cloud session only, not local records.

### I02. Authenticated cloud gateway
- Related Files:
  - `src/services/RunGateway.ts` :: `RunGateway`, public/private run DTOs; modify
  - `src/services/LocalRunGateway.ts` :: local implementations of best, ranking, history and submit receipt; modify
  - `src/services/LocalRunGateway.test.ts` :: local adapter contract tests; modify
  - `src/services/AuthenticatedRunGateway.ts` :: cloud adapter; new
  - `src/services/AuthenticatedRunGateway.test.ts` :: API client tests; new
  - `src/App.tsx` :: gateway injection; modify
- Required signature:
  ```ts
  export type PublicLeaderboardRecord = Readonly<{
    rank: number;
    displayName: string;
    characterId: CharacterId;
    distanceMeters: number;
    coins: number;
    finishedAtIso: string;
  }>;
  export type PersonalBestRecord = PublicLeaderboardRecord;
  export type PersonalRunHistoryRecord = Readonly<{
    id: string;
    characterId: CharacterId;
    mode: 'endless' | 'story';
    storyStageId: StoryStageId | null;
    distanceMeters: number;
    coins: number;
    durationMs: number;
    finishedAtIso: string;
    finishReason: RunnerFinishReason;
    hitsTaken: number;
    passedGateCount: number;
    completedStage: boolean;
  }>;
  export type PersonalRunHistoryPage = Readonly<{
    items: readonly PersonalRunHistoryRecord[];
    nextCursor: string | null;
  }>;
  export type RunSubmissionReceipt = Readonly<{
    savedRun: PersonalRunHistoryRecord;
    personalBest: PersonalBestRecord | null;
    personalBestUpdated: boolean;
  }>;
  export interface RunGateway {
    getBest(): Promise<PersonalBestRecord | null>;
    getRanking(): Promise<PublicLeaderboardRecord[]>;
    getPersonalHistory(options?: { limit?: number; cursor?: string | null }): Promise<PersonalRunHistoryPage>;
    submitRun(result: RunnerResult): Promise<RunSubmissionReceipt>;
  }
  export class AuthenticatedRunGateway implements RunGateway {
    constructor(baseUrl: string, acquireToken: () => Promise<string>, fetcher?: typeof fetch);
    getBest(): Promise<PersonalBestRecord | null>;
    getRanking(): Promise<PublicLeaderboardRecord[]>;
    getPersonalHistory(options?: { limit?: number; cursor?: string | null }): Promise<PersonalRunHistoryPage>;
    submitRun(result: RunnerResult): Promise<RunSubmissionReceipt>;
  }
  ```
- Define shared DTOs in `RunGateway.ts` before wiring either adapter: `PersonalRunHistoryRecord` contains the owner's run id plus mode/stage, character, distance, coins, duration, finish timestamp/reason, hit count, gate count, and completion flag; `PersonalRunHistoryPage` contains `items` and opaque `nextCursor`; `PublicLeaderboardRecord` contains only `rank`, `displayName`, `characterId`, `distanceMeters`, `coins`, and `finishedAtIso`; `PersonalBestRecord` aliases the public row; `RunSubmissionReceipt` contains `{savedRun, personalBest, personalBestUpdated}`. Public DTOs must not contain run IDs or account identifiers.
- Update the `RunGateway` interface and local adapter to those contracts in this task so the codebase remains type-correct before the UI task. Local history is built from local records only; preserve existing local sorting/ranking behavior and do not fabricate story results or upload local records.
- Each request sends `Authorization: Bearer <access-token>`. Never send a client-selected player ID or public display name. `getPersonalHistory` calls owner-scoped `GET /api/runs`; `getBest` calls `GET /api/runs/best`; `getRanking` calls `GET /api/leaderboard`; `submitRun` calls `POST /api/runs`.
- `PublicLeaderboardRecord` already includes `rank`; it contains only display name, character, distance, coins and finish time, never run/account IDs or email. `PersonalRunHistoryPage` contains the current player's run DTOs and opaque next cursor. `RunSubmissionReceipt` contains the saved run and the player's current public best/rank (or null if none exists); it does not claim that every submitted run is a public leaderboard row.
- HTTP 401 asks for sign-in again; 403 displays access denied; network/5xx errors show retry and never fabricate a saved cloud rank.
- Tests mock token acquisition and fetch; verify all four endpoint contracts, authorization headers, owner-history cursor handling, DTO validation, absence of run/account identity fields from public responses, and 401/403/5xx handling. Local adapter tests verify the same shared contract without Entra.

## Acceptance Criteria
- [x] Cloud gameplay and cloud data are unavailable while deployed auth is signed out/invalid.
- [x] MSAL authority is the exact configured tenant and requests the API scope.
- [x] The configured token exposes the display-name claim without requesting Graph permissions or email.
- [x] Local mode still works with no Entra config.
- [x] No secret is added to Vite config or tracked files.
- [x] Gateway tests cover auth headers, DTO validation, and errors.

## Validation
- `npm test -- src/auth src/services/AuthenticatedRunGateway.test.ts src/services/LocalRunGateway.test.ts src/App.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Commit Message
```text
feat(auth): add single-tenant Entra sign-in and API client

Plan: 2026-11-03-azure-deployment-readiness
Phase: P01-auth-api-data
Task: T01-entra-spa-auth

  - Add MSAL auth-code PKCE configuration for one tenant
  - Send delegated API tokens through history, personal-best, submission, and leaderboard routes
- Retain the explicit local-only store path
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
