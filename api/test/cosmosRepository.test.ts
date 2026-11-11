import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cosmosState = vi.hoisted(() => ({
  constructorArgs: [] as unknown[],
  databaseIds: [] as string[],
  containerIds: [] as string[],
  defaultCredentialCount: 0,
}));

vi.mock('@azure/cosmos', () => ({
  CosmosClient: class {
    constructor(configuration: unknown) {
      cosmosState.constructorArgs.push(configuration);
      if (typeof configuration === 'string' && !configuration.includes('AccountKey=')) {
        throw new Error(`Invalid connection string: ${configuration}`);
      }
    }
    database(databaseId: string) {
      cosmosState.databaseIds.push(databaseId);
      return {
        container: (containerId: string) => {
          cosmosState.containerIds.push(containerId);
          return { item: () => ({ read: async () => ({ resource: null }) }) };
        },
      };
    }
  },
}));

vi.mock('@azure/identity', () => ({
  DefaultAzureCredential: class {
    constructor() { cosmosState.defaultCredentialCount += 1; }
  },
}));

const configKeys = ['COSMOS_CONNECTION_STRING', 'COSMOS_ENDPOINT', 'COSMOS_DATABASE_ID', 'COSMOS_CONTAINER_ID'] as const;
const originalConfig = new Map(configKeys.map((key) => [key, process.env[key]]));

beforeEach(() => {
  vi.resetModules();
  cosmosState.constructorArgs = [];
  cosmosState.databaseIds = [];
  cosmosState.containerIds = [];
  cosmosState.defaultCredentialCount = 0;
  for (const key of configKeys) delete process.env[key];
});

afterEach(() => {
  for (const key of configKeys) {
    const originalValue = originalConfig.get(key);
    if (originalValue === undefined) delete process.env[key];
    else process.env[key] = originalValue;
  }
});

async function triggerCosmosClient(): Promise<void> {
  const { CosmosRepository } = await import('../src/data/cosmosRepository.js');
  await new CosmosRepository().getProfile('tenant:player');
}

describe('Cosmos credential selection', () => {
  it('uses the server connection string and runner-owned default IDs without creating an AAD credential', async () => {
    process.env.COSMOS_CONNECTION_STRING = 'AccountEndpoint=https://runner.example/;AccountKey=unit-test-key;';
    process.env.COSMOS_ENDPOINT = 'https://ignored.example/';

    await triggerCosmosClient();

    expect(cosmosState.constructorArgs).toEqual(['AccountEndpoint=https://runner.example/;AccountKey=unit-test-key;']);
    expect(cosmosState.defaultCredentialCount).toBe(0);
    expect(cosmosState.databaseIds).toEqual(['stella-runner']);
    expect(cosmosState.containerIds).toEqual(['PlayerRecords']);
  });

  it('keeps local endpoint plus DefaultAzureCredential and honors explicit runner IDs', async () => {
    process.env.COSMOS_ENDPOINT = '  https://local.example/  ';
    process.env.COSMOS_DATABASE_ID = 'stella-runner-test';
    process.env.COSMOS_CONTAINER_ID = 'PlayerRecordsTest';

    await triggerCosmosClient();

    expect(cosmosState.constructorArgs).toHaveLength(1);
    expect(cosmosState.constructorArgs[0]).toMatchObject({ endpoint: 'https://local.example/' });
    expect(cosmosState.defaultCredentialCount).toBe(1);
    expect(cosmosState.databaseIds).toEqual(['stella-runner-test']);
    expect(cosmosState.containerIds).toEqual(['PlayerRecordsTest']);
  });

  it('rejects an explicitly empty connection string with the safe configuration error', async () => {
    process.env.COSMOS_CONNECTION_STRING = '   ';
    process.env.COSMOS_ENDPOINT = 'https://local.example/';
    const { CosmosRepository } = await import('../src/data/cosmosRepository.js');

    await expect(new CosmosRepository().getProfile('tenant:player')).rejects.toMatchObject({
      status: 503, code: 'DATA_NOT_CONFIGURED', message: 'DATA_NOT_CONFIGURED',
    });
    expect(cosmosState.defaultCredentialCount).toBe(0);
  });

  it('does not expose a malformed connection string in the API error', async () => {
    const secretSentinel = 'private-key-sentinel';
    process.env.COSMOS_CONNECTION_STRING = secretSentinel;
    const { CosmosRepository } = await import('../src/data/cosmosRepository.js');

    let caught: unknown;
    try {
      await new CosmosRepository().getProfile('tenant:player');
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({ status: 503, code: 'DATA_NOT_CONFIGURED', message: 'DATA_NOT_CONFIGURED' });
    expect(JSON.stringify(caught)).not.toContain(secretSentinel);
  });

  it('returns DATA_NOT_CONFIGURED when neither cloud nor local credential configuration exists', async () => {
    const { CosmosRepository } = await import('../src/data/cosmosRepository.js');

    await expect(new CosmosRepository().getProfile('tenant:player')).rejects.toMatchObject({
      status: 503, code: 'DATA_NOT_CONFIGURED', message: 'DATA_NOT_CONFIGURED',
    });
  });
});
