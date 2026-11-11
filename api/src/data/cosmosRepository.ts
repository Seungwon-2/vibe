import { CosmosClient, type Container, type FeedOptions, type OperationInput, type SqlQuerySpec } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import type { ProfileDocument, RunDocument, LeaderboardBestDocument } from '../shared/contracts.js';
import { ApiException } from '../shared/errors.js';
import { createDefaultProfile } from '../domain/profileDefaults.js';

export type Versioned<T> = Readonly<{ value: T; etag: string }>;
export interface RunnerRepository {
  ensureProfile(playerId: string): Promise<Versioned<ProfileDocument>>;
  getProfile(playerId: string): Promise<Versioned<ProfileDocument> | null>;
  getRun(playerId: string, runId: string): Promise<RunDocument | null>;
  getBest(playerId: string): Promise<Versioned<LeaderboardBestDocument> | null>;
  commitRun(run: RunDocument, profile: ProfileDocument, profileEtag: string,
    best: LeaderboardBestDocument | null, bestEtag: string | null): Promise<void>;
  getRunHistory(playerId: string, limit: number, cursor: string | null): Promise<{
    items: RunDocument[]; nextCursor: string | null;
  }>;
  listBestProjections(): Promise<LeaderboardBestDocument[]>;
}

function cosmos(): CosmosClient {
  const configuredConnectionString = process.env.COSMOS_CONNECTION_STRING;
  if (configuredConnectionString !== undefined) {
    const connectionString = configuredConnectionString.trim();
    if (!connectionString) throw new ApiException(503, 'DATA_NOT_CONFIGURED', 'DATA_NOT_CONFIGURED');
    try {
      return new CosmosClient(connectionString);
    } catch {
      // Cosmos SDK errors may include the supplied connection string. Keep the API error generic.
      throw new ApiException(503, 'DATA_NOT_CONFIGURED', 'DATA_NOT_CONFIGURED');
    }
  }

  const endpoint = process.env.COSMOS_ENDPOINT?.trim();
  if (!endpoint) throw new ApiException(503, 'DATA_NOT_CONFIGURED', 'DATA_NOT_CONFIGURED');
  return new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() });
}
let cachedContainer: Container | undefined;
function container(): Container {
  if (cachedContainer) return cachedContainer;
  const databaseId = process.env.COSMOS_DATABASE_ID?.trim() || 'stella-runner';
  const containerId = process.env.COSMOS_CONTAINER_ID?.trim() || 'PlayerRecords';
  cachedContainer = cosmos().database(databaseId).container(containerId);
  return cachedContainer;
}

function notFound(error: unknown): boolean { return (error as { code?: number; statusCode?: number })?.code === 404 ||
  (error as { statusCode?: number })?.statusCode === 404; }
function conflict(error: unknown): boolean { return (error as { code?: number; statusCode?: number })?.code === 409 ||
  (error as { statusCode?: number })?.statusCode === 409; }

export class CosmosRepository implements RunnerRepository {
  async getProfile(playerId: string): Promise<Versioned<ProfileDocument> | null> {
    try {
      const response = await container().item('profile', playerId).read<ProfileDocument>();
      return response.resource ? { value: response.resource, etag: response.etag ?? '' } : null;
    } catch (error) { if (notFound(error)) return null; throw error; }
  }
  async ensureProfile(playerId: string): Promise<Versioned<ProfileDocument>> {
    const current = await this.getProfile(playerId);
    if (current) return current;
    const value: ProfileDocument = { id: 'profile', playerId, kind: 'profile', schemaVersion: 1,
      updatedAtIso: new Date().toISOString(), profile: createDefaultProfile() };
    try {
      const created = await container().items.create(value);
      return { value: created.resource as ProfileDocument, etag: created.etag ?? '' };
    } catch (error) { if (conflict(error)) { const reread = await this.getProfile(playerId); if (reread) return reread; } throw error; }
  }
  async updateProfile(profile: ProfileDocument, etag: string): Promise<ProfileDocument> {
    const response = await container().item('profile', profile.playerId).replace(profile, { accessCondition: { type: 'IfMatch', condition: etag } });
    return response.resource as ProfileDocument;
  }
  async getRun(playerId: string, runId: string): Promise<RunDocument | null> {
    try {
      const response = await container().item(`run:${runId}`, playerId).read<RunDocument>();
      return response.resource ?? null;
    } catch (error) { if (notFound(error)) return null; throw error; }
  }
  async getBest(playerId: string): Promise<Versioned<LeaderboardBestDocument> | null> {
    try {
      const response = await container().item('leaderboard-best', playerId).read<LeaderboardBestDocument>();
      return response.resource ? { value: response.resource, etag: response.etag ?? '' } : null;
    } catch (error) { if (notFound(error)) return null; throw error; }
  }
  async commitRun(run: RunDocument, profile: ProfileDocument, profileEtag: string,
    best: LeaderboardBestDocument | null, bestEtag: string | null): Promise<void> {
    const operations: OperationInput[] = [
      { operationType: 'Create' as const, resourceBody: run },
      { operationType: 'Replace' as const, id: 'profile', resourceBody: profile, ifMatch: profileEtag },
    ];
    if (best) {
      operations.push(bestEtag
        ? { operationType: 'Replace' as const, id: 'leaderboard-best', resourceBody: best, ifMatch: bestEtag }
        : { operationType: 'Create' as const, resourceBody: best });
    }
    const response = await container().items.batch(operations, run.playerId);
    const statuses = response.result?.map((operation) => operation.statusCode) ?? [];
    if (statuses.some((status) => status === 409 || status === 412)) {
      throw new ApiException(409, 'SUBMISSION_CONFLICT', 'SUBMISSION_CONFLICT');
    }
    if (!statuses.length || statuses.some((status) => status >= 400)) {
      throw new ApiException(503, 'SAVE_FAILED', 'SAVE_FAILED');
    }
  }
  async getRunHistory(playerId: string, limit: number, cursor: string | null): Promise<{
    items: RunDocument[]; nextCursor: string | null;
  }> {
    const query: SqlQuerySpec = { query: 'SELECT * FROM c WHERE c.kind = @kind ORDER BY c.run.finishedAtIso DESC, c.id ASC',
      parameters: [{ name: '@kind', value: 'run' }] };
    const options: FeedOptions = { partitionKey: playerId, maxItemCount: limit, continuationToken: cursor ?? undefined };
    try {
      const page = await container().items.query<RunDocument>(query, options).fetchNext();
      return { items: page.resources, nextCursor: page.continuationToken ?? null };
    } catch (error) {
      if ((error as { code?: number })?.code === 400 && cursor) throw new ApiException(400, 'INVALID_CURSOR', 'INVALID_CURSOR');
      throw error;
    }
  }
  async listBestProjections(): Promise<LeaderboardBestDocument[]> {
    const iterator = container().items.query<LeaderboardBestDocument>({
      query: 'SELECT * FROM c WHERE c.kind = @kind', parameters: [{ name: '@kind', value: 'leaderboardBest' }],
    }, { maxItemCount: 500 });
    const results: LeaderboardBestDocument[] = [];
    while (iterator.hasMoreResults()) {
      const page = await iterator.fetchNext();
      results.push(...page.resources);
    }
    return results;
  }
}
