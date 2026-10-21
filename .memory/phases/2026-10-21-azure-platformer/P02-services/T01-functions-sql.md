# Task: T01 Functions and SQL Foundation

## Status: pending

## Goal
Create an independently buildable Azure Functions Node.js v4 API and Azure SQL schema for player saves and stage records.

## Decision Summary
- Separate Function App, Node.js 22 LTS, Functions v4, TypeScript, Azure SQL, system-assigned managed identity; no SQL password.
- Identity key is tenant id plus Entra object id; one save row per user and one best row per user-stage.

## Implementation

### I01. API shell and database adapter
- Related Files:
  - api/package.json :: API dependencies and scripts; new
  - api/host.json and api/tsconfig.json :: host and strict TS settings; new
  - api/src/index.ts :: function registration; new
  - api/src/db/sqlPool.ts :: getSqlPool():Promise<ConnectionPool>; new
  - api/src/db/sqlPool.test.ts :: config/lifecycle tests; new
- Details
  - Use @azure/functions v4 and mssql. package main points to dist/src/index.js. Scripts: build, typecheck, test.
  - getSqlPool reads AZURE_SQL_SERVER and AZURE_SQL_DATABASE, port 1433, TLS encryption, azure-active-directory-default auth; cache one pool promise and clear failed promise for retry.
  - Local credential comes from DefaultAzureCredential. Production Function App uses system identity. Never log tokens or secrets. A failed DB request returns generic 503 at handler boundary.

### I02. Schema and domain models
- Related Files:
  - api/sql/001-initial-schema.sql :: repeat-safe table/index creation; new
  - api/src/domain/models.ts :: PlayerSave, StageRecord, StageRankingRow; new
  - api/src/domain/models.test.ts :: schema validation; new
- Data & Schema Fields
  - PlayerSaves columns: tenantId NVARCHAR(36), userObjectId NVARCHAR(36), characterId NVARCHAR(64), worldId NVARCHAR(64), stageId NVARCHAR(64), checkpointId NVARCHAR(64), lives TINYINT, stageScore INT, unlockedStageOrdinal TINYINT, updatedAt DATETIME2(3), all NOT NULL. Composite PK tenantId,userObjectId.
  - StageRecords columns: tenantId NVARCHAR(36), userObjectId NVARCHAR(36), displayName NVARCHAR(128), stageId NVARCHAR(64), bestScore INT, bestClearTimeMs INT, updatedAt DATETIME2(3), all NOT NULL. Composite PK tenantId,userObjectId,stageId. Index stageId,bestScore DESC,bestClearTimeMs ASC.
  - Enforce lives 1..9, score >=0, clearTime >0. PlayerSave API timestamp is ISO-8601. Public ranking DTO omits tenantId and userObjectId.

## Acceptance Criteria
- [ ] Functions v4 project compiles and uses passwordless SQL auth.
- [ ] SQL migration is repeat-safe and creates both tables/indexes.
- [ ] No credentials or tokens in source or logs.

## Validation
- cd api; npm test -- --run — DB/model tests pass.
- cd api; npm run typecheck; npm run build — pass.
- sqlcmd -S <authorized-test-server> -d <test-db> -G -i api/sql/001-initial-schema.sql — applies when test resource is available.

## Commit Message
feat(api): add Functions and Azure SQL foundation

Plan: 2026-10-21-azure-platformer
Phase: P02-services
Task: T01-functions-sql

- scaffold TypeScript Functions v4 project
- add passwordless SQL pool and persistence schema

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
