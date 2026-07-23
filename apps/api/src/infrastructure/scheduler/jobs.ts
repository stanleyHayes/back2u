import type { Container } from 'inversify';

import type { IQueue } from '../../application/ports/queue.js';
import type { ILogger } from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';

export async function registerJobs(c: Container): Promise<void> {
  const queue = c.get<IQueue>(TOKENS.Queue);
  const logger = c.get<ILogger>(TOKENS.Logger);

  await queue.scheduleJob('marketplace.auto-close', {}, { every: 60 * 1000 });
  await queue.scheduleJob('marketplace.ending-soon', {}, { every: 5 * 60 * 1000 });
  await queue.scheduleJob('items.auto-archive', {}, { every: 60 * 60 * 1000 });

  logger.info('scheduled repeatable jobs via BullMQ');
}
