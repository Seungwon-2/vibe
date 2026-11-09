import { app } from '@azure/functions';
import { CosmosRepository } from '../data/cosmosRepository.js';
import { protectedHandler, json, requireMethod } from '../shared/handler.js';
import { readJson, validateProfileUpdate } from '../shared/validation.js';
import { ApiException } from '../shared/errors.js';

const repository = new CosmosRepository();

app.http('profile', {
  route: 'profile', methods: ['GET', 'PUT'], authLevel: 'anonymous',
  handler: (request) => protectedHandler(request, async (principal) => {
    if (request.method.toUpperCase() === 'GET') {
      const profile = await repository.ensureProfile(principal.playerId);
      return json(200, profile.value.profile);
    }
    requireMethod(request, 'PUT');
    const current = await repository.ensureProfile(principal.playerId);
    const body = await readJson(request);
    const updated = validateProfileUpdate(body, current.value.profile);
    try {
      const response = await repository.updateProfile({ ...current.value, profile: updated, updatedAtIso: new Date().toISOString() }, current.etag);
      return json(200, response.profile);
    } catch (error) {
      if (error instanceof ApiException) throw error;
      const status = (error as { statusCode?: number })?.statusCode;
      if (status === 412) throw new ApiException(409, 'PROFILE_CONFLICT', 'PROFILE_CONFLICT');
      throw error;
    }
  }),
});
