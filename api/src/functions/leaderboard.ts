import { app } from '@azure/functions';
import { CosmosRepository } from '../data/cosmosRepository.js';
import { RunService } from '../domain/runService.js';
import { protectedHandler, json } from '../shared/handler.js';
import { ApiException } from '../shared/errors.js';

const service = new RunService(new CosmosRepository());
app.http('leaderboard', {
  route: 'leaderboard', methods: ['GET'], authLevel: 'anonymous',
  handler: (request) => protectedHandler(request, async () => {
    const rawLimit = request.query.get('limit');
    if (rawLimit !== null && !/^\d+$/.test(rawLimit)) throw new ApiException(400, 'INVALID_LIMIT', 'INVALID_LIMIT');
    const limit = rawLimit === null ? 20 : Math.min(100, Math.max(1, Number(rawLimit)));
    return json(200, await service.leaderboard(limit));
  }),
});
