import 'reflect-metadata';

import mongoose from 'mongoose';

import type { IQueueWorker } from './application/ports/queue.js';
import type { IErrorReporter } from './application/ports/services.js';
import { TOKENS } from './application/ports/tokens.js';
import { buildContainer } from './composition/container.js';
import type { Env } from './config/env.js';
import { connectMongo } from './infrastructure/persistence/mongo/connect.js';
import { registerWorkerHandlers } from './infrastructure/queue/job-handlers.js';
import { PinoAppLogger } from './infrastructure/security/pino-logger.js';

async function main() {
  const c = buildContainer();
  const env = c.get<Env>(TOKENS.Env);
  const logger = c.get(PinoAppLogger);
  const reporter = c.get<IErrorReporter>(TOKENS.ErrorReporter);

  await connectMongo(env.MONGO_URI);
  logger.info('worker mongo connected');

  registerWorkerHandlers(c);
  const worker = c.get<IQueueWorker>(TOKENS.QueueWorker);
  await worker.start();
  logger.info('worker started');

  const shutdown = async (signal: string) => {
    logger.info(`worker received ${signal}, draining`);
    await worker.stop();
    await mongoose.connection.close().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    // The process is in an undefined state after an uncaught exception:
    // report, give the reporter a tick to flush, then exit.
    reporter.capture(err, { type: 'uncaughtException' });
    setTimeout(() => process.exit(1), 200);
  });
  process.on('unhandledRejection', (err) => reporter.capture(err, { type: 'unhandledRejection' }));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('worker fatal', err);
  process.exit(1);
});
