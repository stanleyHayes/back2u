import { inject, injectable } from 'inversify';
import { Redis } from 'ioredis';

import type { ICache } from '../../application/ports/cache.js';
import type { ILogger } from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { Env } from '../../config/env.js';

@injectable()
export class RedisCache implements ICache {
  private readonly client: Redis | null;
  private readonly enabled: boolean;

  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {
    this.enabled = Boolean(env.REDIS_URL);
    this.client = this.enabled ? new Redis(env.REDIS_URL!, { maxRetriesPerRequest: 3 }) : null;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn('cache.get failed', { key, err: String(err) });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      this.logger.warn('cache.set failed', { key, err: String(err) });
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn('cache.del failed', { key, err: String(err) });
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      // SCAN in batches instead of blocking KEYS.
      const stream = this.client.scanStream({ match: pattern, count: 100 });
      for await (const keys of stream as AsyncIterable<string[]>) {
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      }
    } catch (err) {
      this.logger.warn('cache.invalidatePattern failed', { pattern, err: String(err) });
    }
  }
}
