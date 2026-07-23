import { Worker } from 'bullmq';
import { inject, injectable } from 'inversify';
import { Redis, type Redis as RedisType } from 'ioredis';

import type { IQueueWorker, JobName } from '../../application/ports/queue.js';
import type { ILogger } from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { Env } from '../../config/env.js';

const QUEUE_NAME = 'back2u';

/**
 * In-process job name → handler registry. Shared by the BullMQ worker and the
 * no-Redis inline fallback in BullmqQueue, so jobs are executed (not dropped)
 * when REDIS_URL is unset.
 */
const jobHandlers = new Map<JobName, (data: unknown) => Promise<void>>();

/** Execute a registered job handler in-process (used when no Redis is available). */
export async function runJobInline(name: JobName, data: unknown): Promise<void> {
  const handler = jobHandlers.get(name);
  if (!handler) throw new Error(`No handler registered for job '${name}' (cannot run inline)`);
  await handler(data);
}

@injectable()
export class BullmqWorker implements IQueueWorker {
  private worker: Worker | null = null;
  private connection: Redis | null = null;

  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  on<T>(name: JobName, handler: (data: T) => Promise<void>): void {
    jobHandlers.set(name, handler as (data: unknown) => Promise<void>);
  }

  async start(): Promise<void> {
    if (!this.env.REDIS_URL) {
      this.logger.warn('worker.start skipped — no REDIS_URL');
      return;
    }
    const connection = new Redis(this.env.REDIS_URL, { maxRetriesPerRequest: null });
    this.connection = connection;
    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const handler = jobHandlers.get(job.name as JobName);
        if (!handler) throw new Error(`No handler for ${job.name}`);
        await handler(job.data);
      },
      { connection, concurrency: 8 },
    );
    this.worker.on('failed', (job, err) =>
      this.logger.warn('job failed', { name: job?.name, err: String(err), attempt: job?.attemptsMade }),
    );
    this.worker.on('completed', (job) => this.logger.info('job done', { name: job.name, id: job.id }));
  }

  async stop(): Promise<void> {
    await this.worker?.close();
    await this.connection?.quit();
  }
}
