import { Queue, type JobsOptions } from 'bullmq';
import { inject, injectable } from 'inversify';
import { Redis, type Redis as RedisType } from 'ioredis';

import type { IQueue, JobName } from '../../application/ports/queue.js';
import type { ILogger } from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { Env } from '../../config/env.js';
import { runJobInline } from './bullmq.worker.js';

const QUEUE_NAME = 'back2u';

@injectable()
export class BullmqQueue implements IQueue {
  private readonly q: Queue | null;
  private readonly connection: Redis | null;

  constructor(
    @inject(TOKENS.Env) env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {
    if (!env.REDIS_URL) {
      this.connection = null;
      this.q = null;
      this.logger.warn('queue disabled (no REDIS_URL); jobs run inline');
      return;
    }
    const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    this.connection = connection;
    this.q = new Queue(QUEUE_NAME, { connection });
  }

  async enqueue<T>(name: JobName, data: T, opts?: { delayMs?: number; jobId?: string }): Promise<void> {
    if (!this.q) {
      // No Redis: run the registered handler inline instead of dropping the job.
      if (opts?.delayMs) this.logger.warn('queue.enqueue inline: delayMs ignored (no Redis)', { name });
      this.logger.info('queue.enqueue inline (no Redis)', { name });
      await runJobInline(name, data);
      return;
    }
    const jobOpts: JobsOptions = {
      removeOnComplete: { count: 1000, age: 86_400 },
      removeOnFail: { count: 1000, age: 86_400 * 7 },
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    };
    if (opts?.delayMs) jobOpts.delay = opts.delayMs;
    if (opts?.jobId) jobOpts.jobId = opts.jobId;
    await this.q.add(name, data as object, jobOpts);
  }

  async scheduleJob<T>(name: JobName, data: T, repeat: { every: number }): Promise<void> {
    if (!this.q) {
      // Repeats need Redis; run once inline so the job is not silently dropped.
      this.logger.warn('queue.scheduleJob inline: repeat unsupported (no Redis), running once', {
        name,
        everyMs: repeat.every,
      });
      await runJobInline(name, data);
      return;
    }
    await this.q.add(name, data as object, {
      repeat: { every: repeat.every },
      removeOnComplete: { count: 1000, age: 86_400 },
      removeOnFail: { count: 1000, age: 86_400 * 7 },
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async enqueuePushBroadcast(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
    opts?: { delayMs?: number; jobId?: string },
  ): Promise<void> {
    return this.enqueue('push.broadcast', { userIds, title, body, data }, opts);
  }

  async enqueueWebPushSend(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    opts?: { delayMs?: number; jobId?: string },
  ): Promise<void> {
    return this.enqueue('webpush.send', { userId, title, body, data }, opts);
  }

  async close(): Promise<void> {
    await this.q?.close();
    await this.connection?.quit();
  }
}
