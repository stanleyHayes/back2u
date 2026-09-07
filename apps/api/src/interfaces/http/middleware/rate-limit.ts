import rateLimit, {
  ipKeyGenerator,
  type IncrementResponse,
  type Options,
  type Store,
} from 'express-rate-limit';
import type { Request } from 'express';
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
    return {
      k: `rl:${this.name}:${key}:${windowStart}`,
      resetTime: new Date(windowStart + this.windowMs),
    };
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

function limiter(
  redis: Redis | null,
  prefix: string,
  windowMs: number,
  limit: number,
  keyGenerator?: (req: Request) => string,
) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    store: redis ? new RedisStore(redis, prefix) : undefined, // falls back to in-memory
  });
}

/**
 * Per-IP ceiling for the whole `/v1/auth` surface.
 *
 * Deliberately generous. This endpoint group includes `/refresh`, which every
 * signed-in client calls in the background, and Ghanaian mobile users sit
 * behind carrier-grade NAT while an office or campus shares one egress IP — so
 * a tight per-IP cap here logs out an entire building rather than stopping an
 * attacker. Brute-force protection is `credentialLimiter`'s job instead, which
 * counts per account.
 */
export const authLimiter = (redis: Redis | null) => limiter(redis, 'auth', 5 * 60_000, 240);

/**
 * The real brute-force guard: counted per ACCOUNT, not per IP.
 *
 * Ten attempts per 15 minutes against one email stops credential stuffing
 * without punishing everyone who shares an exit IP with the attacker. Requests
 * carrying no email fall back to the IP so the endpoint is never unbounded.
 */
export const credentialLimiter = (redis: Redis | null) =>
  limiter(redis, 'credential', 15 * 60_000, 10, (req) => {
    const email = (req.body as { email?: unknown } | undefined)?.email;
    return typeof email === 'string' && email.length > 0
      ? `email:${email.trim().toLowerCase()}`
      : ipKeyGenerator(req.ip ?? '');
  });
export const strictLimiter = (redis: Redis | null) => limiter(redis, 'strict', 15 * 60_000, 100);
// Inbound SMS webhook: tight burst cap. Every inbound can trigger a billed reply
// SMS, and the endpoint is gated only by a static shared secret, so keep this low.
export const smsInboundLimiter = (redis: Redis | null) =>
  limiter(redis, 'sms-inbound', 5 * 60_000, 30);
export const publicLimiter = (redis: Redis | null) => limiter(redis, 'public', 15 * 60_000, 300);
export const partnerApiLimiter = (redis: Redis | null) =>
  limiter(redis, 'partner', 15 * 60_000, 600);
// A Recovery Point counter is many staff behind one NAT'd IP working steadily
// through a queue; the strict limiter's 100/15min would throttle the whole desk.
export const custodyLimiter = (redis: Redis | null) => limiter(redis, 'custody', 15 * 60_000, 600);
