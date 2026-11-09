import { app } from '@azure/functions';
import { CosmosRepository } from '../data/cosmosRepository.js';
import { RunService } from '../domain/runService.js';
import { protectedHandler, json, requireMethod } from '../shared/handler.js';
import { readJson, parseHistoryQuery, validateRunSubmission } from '../shared/validation.js';

const service = new RunService(new CosmosRepository());

app.http('runs', {
  route: 'runs', methods: ['GET', 'POST'], authLevel: 'anonymous',
  handler: (request) => protectedHandler(request, async (principal) => {
    if (request.method.toUpperCase() === 'POST') {
      const submission = validateRunSubmission(await readJson(request));
      return json(200, await service.submit(principal, submission));
    }
    requireMethod(request, 'GET');
    const { limit, cursor } = parseHistoryQuery(request);
    return json(200, await service.history(principal, limit, cursor));
  }),
});

app.http('bestRun', {
  route: 'runs/best', methods: ['GET'], authLevel: 'anonymous',
  handler: (request) => protectedHandler(request, async (principal) => json(200, await service.best(principal))),
});
