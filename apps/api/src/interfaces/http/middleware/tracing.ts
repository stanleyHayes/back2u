import { AsyncLocalStorage } from 'async_hooks';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

const asyncStorage = new AsyncLocalStorage<Map<string, string>>();

export function getTraceId(): string | undefined {
  return asyncStorage.getStore()?.get('traceId');
}

export function runWithTrace<T>(traceId: string, fn: () => T): T {
  const store = new Map<string, string>();
  store.set('traceId', traceId);
  return asyncStorage.run(store, fn);
}

export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const traceId = req.header('x-request-id') ?? randomUUID();
  res.setHeader('X-Request-ID', traceId);
  runWithTrace(traceId, () => next());
}
