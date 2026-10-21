# Plan: Azure Platformer MVP

## Goal
Build a desktop React + Phaser platformer for the company Entra tenant. A signed-in player can play two themed worlds with four stages each, stomp enemies, avoid hazards, fight two bosses, save and resume, and submit a verified best score to a stage leaderboard. The supplied blue-and-white pixel character is the first protagonist; later playable characters can be registered without rewriting player-control logic.

## Confirmed Decisions
- Worlds: windy ancient ruins and luminous underground mine; four stages each; each fourth stage is a boss.
- Controls: arrows or WASD move, Space jumps, Shift runs. World-shared lives start at 5 and cap at 9. A life loss respawns at the last checkpoint with 1.5 seconds invulnerability. Zero lives triggers game-over then restarts the current stage with 5 lives. New world starts with 5 lives.
- Speed pickups last 3 seconds and replace the current pickup effect. Stage mechanics can also change speed. Extra-life pickup at cap yields 1,000 points.
- Auto-save on checkpoint and stage clear; one slot per user; confirm before overwriting. Stage score resets per stage: coin 100, enemy stomp 200, clear 500; tie by faster clear. Keep each player's best score per stage, all-time, display Entra name.
- Entra sign-in for the whole company tenant. React uses MSAL; APIs validate tenant, issuer, audience, and delegated scope. API performs basic score bounds and completion validation. Network loss pauses play and retries.
- Azure: Static Web Apps frontend, separate Azure Functions Node.js v4 Function App with system-assigned managed identity, Azure SQL. Static Web Apps managed functions do not support managed identity; use a linked Function App. References: [SWA API options](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-functions), [Functions Node v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-node-upgrade-v4), [passwordless Azure SQL](https://learn.microsoft.com/en-us/azure/azure-sql/database/azure-sql-javascript-mssql-quickstart).
- Character extensibility means data-driven playable-character definitions and assets. MVP uses one character and no selection UI or character-specific powers.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | in_progress | Initialize React and implement Phaser game, player, stages, and menus. | [P01](../phases/2026-10-21-azure-platformer/P01-game-client/phase.md) |
| P02 | pending | Create Functions API, Entra validation, SQL persistence, save slot, and leaderboard. | [P02](../phases/2026-10-21-azure-platformer/P02-services/phase.md) |
| P03 | pending | Connect the client to secured APIs and prepare Azure deployment and verification. | [P03](../phases/2026-10-21-azure-platformer/P03-integration-release/phase.md) |

## Execution Notes
- Repository currently contains the Project Memory Starter Kit, with no app package and no .git directory. T01 initializes Git and creates the app. No Azure resource identifiers are present; actual provisioning requires an authenticated company subscription and tenant inputs.
- Generated character drafts are in assets/character/. They are transparent visual references, not fixed-cell Phaser atlases. T02 must preserve the drafts and normalize their frames.
- Azure Functions uses Node.js 22 LTS and programming model v4 unless the company runtime standard requires another supported LTS. Pin compatible stable package versions in package-lock files during implementation.
- Do not deploy Azure resources automatically during local implementation. Use placeholders for tenant, app registration, and subscription values.
