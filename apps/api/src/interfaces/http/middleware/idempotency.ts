import type { NextFunction, Request, Response } from 'express';
import type { Container } from 'inversify';

import { IdempotencyRecord } from '../../../domain/idempotency/idempotency-key.entity.js';
import { hashToken } from '../../../domain/auth/refresh-token.entity.js';
import { newId } from '../../../domain/shared/id.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { IIdempotencyStore } from '../../../application/ports/auth-repos.js';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const TTL_SECONDS = 24 * 60 * 60; // 24h

export function idempotency(container: Container) {
  const store = container.get<IIdempotencyStore>(TOKENS.IdempotencyStore);

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!MUTATING.has(req.method)) return next();
    const rawKey = req.header('Idempotency-Key');
    if (!rawKey) return next();

    const keyHash = hashToken(rawKey);
    const userId = req.auth?.sub;

    try {
      const existing = await store.get(keyHash, userId);
      if (existing) {
        const s = existing.snapshot;
        if (s.expiresAt.getTime() > Date.now()) {
          res.setHeader('X-Idempotent-Replay', 'true');
          res.status(s.status).type('application/json').send(s.responseBody);
          return;
        }
      }
    } catch {
      // Store unavailable → fail open, process the request normally.
    }

    let captured: string | undefined;
    const json = res.json.bind(res);
    res.json = ((body: unknown) => {
      captured = JSON.stringify(body);
      return json(body);
    }) as Response['json'];
    const send = res.send.bind(res);
    res.send = ((body: unknown) => {
      if (captured === undefined && typeof body === 'string') captured = body;
      return send(body);
    }) as Response['send'];

    res.on('finish', () => {
      if (captured === undefined || res.statusCode >= 500) return;
      const record = IdempotencyRecord.seal({
        id: newId(),
        rawKey,
        userId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        responseBody: captured,
        ttlSeconds: TTL_SECONDS,
      });
      void store.put(record).catch(() => {});
    });

    next();
  };
}
