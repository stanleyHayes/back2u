import { Router } from 'express';
import type { Redis } from 'ioredis';
import mongoose from 'mongoose';

export function healthRouter(redis: Redis | null): Router {
  const r = Router();

  r.get('/', async (_req, res) => {
    const readyState = mongoose.connection.readyState;
    const mongoUp = readyState === 1;

    let redisStatus: 'up' | 'down' | 'disabled' = 'disabled';
    if (redis) {
      try {
        redisStatus = (await redis.ping()) === 'PONG' ? 'up' : 'down';
      } catch {
        redisStatus = 'down';
      }
    }

    res.status(mongoUp ? 200 : 503).json({
      status: mongoUp ? 'ok' : 'degraded',
      uptime: Math.floor(process.uptime()),
      mongo: { readyState, connected: mongoUp },
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    });
  });

  return r;
}
