# Plan: Pre-Run Controls and Items Guide

## Goal
Show a concise, mode-aware controls and item guide before the first run in a browser, allow it to be reopened from pause, and explain the selected character's passive. Starting the first-run guide must start the existing three-second countdown; closing a guide reopened from pause must return to the still-paused run.

## Decisions
- Confirmed behavior and content are recorded in [Pre-Run Guide](../decisions/2026-11-06-pre-run-guide.md).
- First-run visibility is persisted with the existing browser tutorial preference. The existing first-run obstacle hints remain available during that first run.
- Endless and Story mode descriptions must reflect the current simulation rules rather than describe a shared effect inaccurately.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `pending` | Add a first-run guide, pause-menu reopening, accurate item/passive content, and flow regression coverage | [P01](../phases/2026-11-06-pre-run-guide/P01-guide-flow/phase.md) |

## Execution Order
- Complete this guide plan before resuming [Azure Deployment Readiness](./2026-11-03-azure-deployment-readiness.md).
- When this plan is complete, set `.memory/current.md` back to Azure Deployment Readiness at its still-pending P01-T01 Entra SPA Authentication task.

## Out of Scope
- Changing controls, power-up behavior, collision rules, or balance values.
- Replacing the separate first-run obstacle warning/tutorial behavior.
- Implementing Azure authentication, cloud records, or deployment.
