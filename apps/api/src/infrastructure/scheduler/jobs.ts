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
  // Hourly is well inside the shortest sensible holding period (§4: 7–14 days).
  await queue.scheduleJob('points.clear-pending', {}, { every: 60 * 60 * 1000 });
  // Reservations are held for hours, so an hourly sweep is well inside the window.
  await queue.scheduleJob('rewards.expire-reservations', {}, { every: 60 * 60 * 1000 });

  logger.info('scheduled repeatable jobs via BullMQ');
}
