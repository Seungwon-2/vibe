import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { randomUUID } from 'node:crypto';
import { requirePrincipal } from './auth.js';
import { ApiException } from './errors.js';
import { errorResponse, json } from './response.js';

export async function protectedHandler(request: HttpRequest,
  action: (principal: Awaited<ReturnType<typeof requirePrincipal>>, correlationId: string) => Promise<HttpResponseInit>): Promise<HttpResponseInit> {
  const correlationId = randomUUID();
  try {
    const principal = await requirePrincipal(request);
    return action(principal, correlationId);
  } catch (error) { return errorResponse(error, correlationId); }
}

export function requireMethod(request: HttpRequest, method: string): void {
  if (request.method.toUpperCase() !== method) throw new ApiException(405, 'METHOD_NOT_ALLOWED', 'METHOD_NOT_ALLOWED');
}
export { json };
