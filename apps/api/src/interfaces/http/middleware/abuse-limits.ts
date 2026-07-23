import type { NextFunction, Request, Response } from 'express';
import type { Container } from 'inversify';
import { Redis } from 'ioredis';

import { TooManyRequestsError } from '../../../domain/shared/errors.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

function getRedis(env: Env): Redis | null {
  if (!env.REDIS_URL) return null;
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1 });
}

function key(userId: string, action: string): string {
  return `abuse:${action}:${userId}:${new Date().toISOString().slice(0, 10)}`;
}

function minuteKey(userId: string, action: string): string {
  const now = new Date();
  const minute = `${now.getHours()}:${now.getMinutes()}`;
  return `abuse:${action}:${userId}:${now.toISOString().slice(0, 10)}:${minute}`;
}

export function uploadLimit(container: Container) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const env = container.get<Env>(TOKENS.Env);
    const limit = Number(env.UPLOAD_DAILY_LIMIT ?? 10);
    if (!req.auth) return next();

    const redis = getRedis(env);
    if (!redis) return next();

    const k = key(req.auth.sub, 'upload');
    const current = await redis.incr(k);
    if (current === 1) await redis.expire(k, 86_400);
    if (current > limit) {
      const ttl = await redis.ttl(k);
      return next(new TooManyRequestsError(`Upload limit reached. Retry after ${ttl}s.`));
    }
    next();
  };
}

export function messageRateLimit(container: Container) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const env = container.get<Env>(TOKENS.Env);
    const limit = Number(env.MESSAGE_RATE_LIMIT ?? 30);
    if (!req.auth) return next();

    const redis = getRedis(env);
    if (!redis) return next();

    const k = minuteKey(req.auth.sub, 'message');
    const current = await redis.incr(k);
    if (current === 1) await redis.expire(k, 60);
    if (current > limit) {
      const ttl = await redis.ttl(k);
      return next(new TooManyRequestsError(`Message rate limit reached. Retry after ${ttl}s.`));
    }
    next();
  };
}
