# Plan: Pre-deployment Validation Cleanup

## Goal
Restore a clean local quality gate before preparing the Entra ID and Azure deployment plan. Update stale tests to match the current mode and character-unlock flow, fix lint errors without changing game behavior, then pass the full validation suite.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Correct current test expectations and lint findings, then validate the project | [P01](../phases/2026-11-03-predeploy-validation/P01-quality-gates/phase.md) |
