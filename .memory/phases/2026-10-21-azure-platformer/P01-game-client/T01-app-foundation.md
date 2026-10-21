# Task: T01 App Foundation

## Status: done

## Goal
Turn the starter-kit root into a runnable React + TypeScript + Vite desktop web app and initialize Git so later tasks can be committed and validated independently.

## Decision Summary
- Preserve .agents/, .memory/, README history as useful, and assets/character/. Create the client app at repository root.
- Use npm, Node.js 22 LTS, React, TypeScript, Vite, Vitest, and ESLint; pin actual stable compatible versions in package-lock.json.

## Implementation

### I01. Git and application scaffold
- Related Files:
  - .gitignore :: ignore generated/local files; new
  - package.json and package-lock.json :: scripts and pinned dependencies; new
  - index.html :: React mount document; new
  - vite.config.ts :: Vite and Vitest configuration; new
  - tsconfig.json :: strict TypeScript configuration; new
  - src/main.tsx :: React bootstrap; new
  - src/App.tsx :: app root; new
  - src/styles/global.css :: desktop viewport and pixel-game base style; new
  - src/test/setup.ts and src/App.test.tsx :: DOM setup and mount test; new
- Details
  - Signatures: App(): JSX.Element. Mount App into #root using createRoot.
  - Scripts: dev, build, preview, test (Vitest run mode), typecheck (tsc --noEmit), lint.
  - Initialize Git at the workspace root. Ignore node_modules, dist, coverage, .env files except .env.example, local Azure settings, and generated test artifacts. Do not remove starter files or existing assets.
  - Add a minimal React render test and configure jsdom.
  - Error handling: build/type/lint/test failures return non-zero; do not suppress diagnostics.

### I02. Safe local configuration
- Related Files:
  - .env.example :: public frontend placeholders; new
  - README.md :: app setup/build instructions and link to memory workflow; modify
- Details
  - Document VITE_ENTRA_TENANT_ID, VITE_ENTRA_CLIENT_ID, VITE_ENTRA_API_SCOPE, VITE_API_BASE_URL as placeholders only. Never put secrets in VITE variables.
  - README instructions include npm install, npm run dev, npm test -- --run, npm run build.

## Acceptance Criteria
- [ ] npm run dev renders the React root.
- [ ] npm run build, npm run typecheck, npm run lint, and npm test -- --run pass.
- [ ] Git is initialized and existing memory and asset files remain present.

## Validation
- npm test -- --run — React mount test passes.
- npm run typecheck — no TypeScript errors.
- npm run lint — no lint errors.
- npm run build — Vite emits dist/.

## Commit Message
chore(app): scaffold React TypeScript client

Plan: 2026-10-21-azure-platformer
Phase: P01-game-client
Task: T01-app-foundation

- initialize Git and create Vite app
- add strict checks and safe local configuration

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: recorded in Git history
