import type { HttpResponseInit } from '@azure/functions';
import { randomUUID } from 'node:crypto';
import { ApiException } from './errors.js';

export function json(status: number, body: unknown): HttpResponseInit {
  return { status, jsonBody: body, headers: { 'cache-control': 'no-store' } };
}

export function errorResponse(error: unknown, correlationId = randomUUID()): HttpResponseInit {
  if (error instanceof ApiException) {
    return json(error.status, { code: error.code, message: error.message, correlationId });
  }
  return json(500, { code: 'INTERNAL_ERROR', message: '?붿껌??泥섎━?섏? 紐삵뻽?듬땲??', correlationId });
}
