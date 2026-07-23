import 'reflect-metadata';

import { createServer } from 'node:http';

import mongoose from 'mongoose';

import type { IScheduler } from './application/ports/extra-services.js';
import type { IQueue } from './application/ports/queue.js';
import type { IErrorReporter } from './application/ports/services.js';
import { TOKENS } from './application/ports/tokens.js';
import { buildContainer } from './composition/container.js';
import type { Env } from './config/env.js';
import { connectMongo } from './infrastructure/persistence/mongo/connect.js';
import { ensureIndexes, runMigrations } from './infrastructure/persistence/mongo/migrations.js';
import { checkCriticalProviders } from './infrastructure/observability/provider-check.js';
import { registerWorkerHandlers } from './infrastructure/queue/job-handlers.js';
import { registerJobs } from './infrastructure/scheduler/jobs.js';
import { PinoAppLogger } from './infrastructure/security/pino-logger.js';
import { buildApp } from './interfaces/http/app.js';
import { attachSocketIo } from './interfaces/http/realtime.js';

async function main() {
  const container = buildContainer();
  const env = container.get<Env>(TOKENS.Env);
  const logger = container.get(PinoAppLogger);
  const reporter = container.get<IErrorReporter>(TOKENS.ErrorReporter);

  // Sentry-style integration: hook to your provider here when you wire one in.
  if (env.SENTRY_DSN) logger.info('error-reporter configured (DSN present)');

  // Surface missing provider keys at boot (ERROR + report in production).
  checkCriticalProviders(env, logger, reporter);

  await connectMongo(env.MONGO_URI);
  logger.info('mongo connected');

  await ensureIndexes(logger);
  await runMigrations(logger);

  const app = buildApp(container);
  const httpServer = createServer(app);
  attachSocketIo(httpServer, container);

  // Register job handlers in-process too: without Redis the queue runs them inline.
  registerWorkerHandlers(container);
  await registerJobs(container);
  const scheduler = container.get<IScheduler>(TOKENS.Scheduler);
  scheduler.start();

  httpServer.listen(env.PORT, () => {
    logger.info(`api listening on :${env.PORT}`, { url: env.API_PUBLIC_URL });
  });

  const queue = container.get<IQueue>(TOKENS.Queue);

  const shutdown = async (signal: string) => {
    logger.info(`received ${signal}, shutting down`);
    scheduler.stop();
    try {
      await queue.close();
    } catch (err) {
      logger.warn('queue close failed', { err: String(err) });
    }
    httpServer.close(async () => {
      try {
        await mongoose.connection.close();
      } catch (err) {
        logger.warn('mongo close failed', { err: String(err) });
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 15_000).unref();
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
  console.error('fatal', err);
  process.exit(1);
});
