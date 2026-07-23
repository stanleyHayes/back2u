import rateLimit, { type IncrementResponse, type Options, type Store } from 'express-rate-limit';
import type { Redis } from 'ioredis';

// Fixed-window Redis store (express-rate-limit calls `init` with the window).
class RedisStore implements Store {
  windowMs = 60_000;

  constructor(
    private readonly redis: Redis,
    private readonly name: string,
  ) {}

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private key(key: string): { k: string; resetTime: Date } {
    const windowStart = Math.floor(Date.now() / this.windowMs) * this.windowMs;
    return { k: `rl:${this.name}:${key}:${windowStart}`, resetTime: new Date(windowStart + this.windowMs) };
  }

  async increment(key: string): Promise<IncrementResponse> {
    const { k, resetTime } = this.key(key);
    const totalHits = await this.redis.incr(k);
    if (totalHits === 1) await this.redis.pexpire(k, this.windowMs);
    return { totalHits, resetTime };
  }

  async decrement(key: string): Promise<void> {
    await this.redis.decr(this.key(key).k);
  }

  async resetKey(key: string): Promise<void> {
    await this.redis.del(this.key(key).k);
  }
}

function limiter(redis: Redis | null, prefix: string, windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: redis ? new RedisStore(redis, prefix) : undefined, // falls back to in-memory
  });
}

export const authLimiter = (redis: Redis | null) => limiter(redis, 'auth', 5 * 60_000, 10);
export const strictLimiter = (redis: Redis | null) => limiter(redis, 'strict', 15 * 60_000, 100);
export const publicLimiter = (redis: Redis | null) => limiter(redis, 'public', 15 * 60_000, 300);
export const partnerApiLimiter = (redis: Redis | null) => limiter(redis, 'partner', 15 * 60_000, 600);
