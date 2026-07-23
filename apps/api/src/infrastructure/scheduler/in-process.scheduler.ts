import { inject, injectable } from 'inversify';

import type { ILogger } from '../../application/ports/services.js';
import type { IScheduler } from '../../application/ports/extra-services.js';
import { TOKENS } from '../../application/ports/tokens.js';

interface Job {
  ms: number;
  fn: () => Promise<void> | void;
  label: string;
  timer?: NodeJS.Timeout;
}

/**
 * Simple in-process scheduler. Replace with BullMQ/pg-boss when you need
 * crash-safe, multi-instance scheduling.
 */
@injectable()
export class InProcessScheduler implements IScheduler {
  private jobs: Job[] = [];
  private started = false;
  constructor(@inject(TOKENS.Logger) private readonly logger: ILogger) {}

  every(ms: number, fn: () => Promise<void> | void, label: string): void {
    this.jobs.push({ ms, fn, label });
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    for (const job of this.jobs) {
      job.timer = setInterval(async () => {
        try {
          await job.fn();
        } catch (err) {
          this.logger.warn('scheduled job failed', { label: job.label, err: String(err) });
        }
      }, job.ms);
      job.timer.unref();
    }
  }

  stop(): void {
    for (const j of this.jobs) if (j.timer) clearInterval(j.timer);
    this.started = false;
  }
}
